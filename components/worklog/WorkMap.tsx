'use client'
// Maps for the work log — OpenStreetMap tiles through Leaflet: no API key, no
// billing account, and nothing about the families leaves the browser except
// the tile requests themselves.
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'
import type { Map as LMap, Marker as LMarker, LayerGroup } from 'leaflet'
import { Crosshair, Loader2, MapPin, Navigation, Search, Trash2 } from 'lucide-react'
import { googleDirectionsUrl, parseMapLink, wazeUrl, type GeocodeHit, type GeoPoint, type WorkCurrency } from '@/lib/worklog'
import { inputCls } from './ui'

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION = '&copy; OpenStreetMap'
const DEFAULT_CENTER: Record<WorkCurrency, GeoPoint> = {
  QAR: { lat: 25.2854, lng: 51.531 },  // Doha
  TND: { lat: 36.8065, lng: 10.1815 }, // Tunis
}

type Leaflet = typeof import('leaflet')
let leafletPromise: Promise<Leaflet> | null = null
function loadLeaflet(): Promise<Leaflet> {
  leafletPromise ??= import('leaflet').then(m => (m as unknown as { default?: Leaflet }).default ?? (m as Leaflet))
  return leafletPromise
}

function pinIcon(L: Leaflet, color: string, label?: string) {
  return L.divIcon({
    className: '',
    iconSize: [34, 44],
    iconAnchor: [17, 42],
    html: `<div style="position:relative;width:34px;height:44px">
      <svg width="34" height="44" viewBox="0 0 34 44" style="filter:drop-shadow(0 3px 4px rgba(0,0,0,.25))">
        <path d="M17 1C8.2 1 1 8 1 16.7 1 28.5 17 43 17 43s16-14.5 16-26.3C33 8 25.8 1 17 1z" fill="${color}" stroke="#fff" stroke-width="2"/>
      </svg>
      <span style="position:absolute;inset:0 0 10px 0;display:flex;align-items:center;justify-content:center;color:#fff;font:900 12px system-ui">${label ?? '●'}</span>
    </div>`,
  })
}

// ── Pick a location ──────────────────────────────────────────────────────────

export function LocationPicker({ value, onChange, color, currency, addressHint }: {
  value: GeoPoint | undefined
  onChange: (p: GeoPoint | undefined) => void
  color: string
  currency: WorkCurrency
  /** The written address, offered as a one-tap search while no pin is set. */
  addressHint?: string
}) {
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<LMap | null>(null)
  const marker = useRef<LMarker | null>(null)
  const L = useRef<Leaflet | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const [link, setLink] = useState('')
  const [busy, setBusy] = useState<'gps' | 'link' | null>(null)
  const [msg, setMsg] = useState('')
  const [hits, setHits] = useState<GeocodeHit[]>([])

  // Create the map once.
  useEffect(() => {
    let cancelled = false
    loadLeaflet().then(lf => {
      if (cancelled || !box.current || map.current) return
      L.current = lf
      const start = value ?? DEFAULT_CENTER[currency]
      const m = lf.map(box.current, { zoomControl: true, attributionControl: true }).setView([start.lat, start.lng], value ? 16 : 12)
      lf.tileLayer(TILE_URL, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(m)
      m.on('click', e => onChangeRef.current({ lat: +e.latlng.lat.toFixed(6), lng: +e.latlng.lng.toFixed(6) }))
      map.current = m
      // The sheet animates in; measure again once it has its final size.
      setTimeout(() => m.invalidateSize(), 250)
    })
    return () => { cancelled = true; map.current?.remove(); map.current = null; marker.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the pin in sync with the value.
  useEffect(() => {
    const lf = L.current, m = map.current
    if (!lf || !m) return
    if (!value) { marker.current?.remove(); marker.current = null; return }
    if (!marker.current) {
      marker.current = lf.marker([value.lat, value.lng], { draggable: true, icon: pinIcon(lf, color) }).addTo(m)
      marker.current.on('dragend', () => {
        const p = marker.current!.getLatLng()
        onChangeRef.current({ lat: +p.lat.toFixed(6), lng: +p.lng.toFixed(6) })
      })
    } else {
      marker.current.setLatLng([value.lat, value.lng])
      marker.current.setIcon(pinIcon(lf, color))
    }
    if (m.getZoom() < 15 || !m.getBounds().pad(-0.2).contains([value.lat, value.lng])) m.setView([value.lat, value.lng], Math.max(m.getZoom(), 16))
  }, [value, color])

  function useMyLocation() {
    if (!('geolocation' in navigator)) { setMsg('المتصفح لا يدعم تحديد الموقع'); return }
    setBusy('gps'); setMsg('')
    navigator.geolocation.getCurrentPosition(
      pos => {
        setBusy(null)
        const p = { lat: +pos.coords.latitude.toFixed(6), lng: +pos.coords.longitude.toFixed(6) }
        onChange(p)
        map.current?.setView([p.lat, p.lng], 17)
        setMsg(pos.coords.accuracy > 100 ? `الدقة تقريبية (±${Math.round(pos.coords.accuracy)} م) — اسحب الدبوس لتصحيحه` : '')
      },
      err => {
        setBusy(null)
        setMsg(err.code === err.PERMISSION_DENIED
          ? 'رُفض إذن الموقع — فعّله من إعدادات المتصفح، أو اضغط على الخريطة مباشرة'
          : 'تعذّر تحديد موقعك الآن — حاول مجدداً أو اضغط على الخريطة')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }

  function place(p: GeoPoint) {
    onChange(p)
    map.current?.setView([p.lat, p.lng], 17)
    setHits([])
    setLink('')
  }

  /** One box for everything people have at hand: coordinates, a shared link, or a written address. */
  async function find(input = link) {
    const text = input.trim()
    if (!text) return
    setMsg(''); setHits([])
    const local = parseMapLink(text)
    if (local) { place(local); return }
    setBusy('link')
    try {
      const isUrl = /^https?:\/\//i.test(text)
      const res = isUrl
        ? await fetch('/api/admin/worklog/resolve-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: text }) })
        : await fetch(`/api/admin/worklog/geocode?q=${encodeURIComponent(text)}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'تعذّر البحث')
      if (isUrl) { place(data.location); return }
      const found: GeocodeHit[] = data.results ?? []
      if (!found.length) {
        setMsg('لم يُعثر على هذا العنوان — جرّب اسم الحي أو معلماً قريباً، أو اضغط على الخريطة مباشرة')
      } else if (found.length === 1) {
        place(found[0].point)
        setMsg('تحقّق من الدبوس واسحبه إلى باب المنزل إن لزم — نتيجة البحث تقريبية')
      } else {
        setHits(found)
      }
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative rounded-2xl overflow-hidden border border-gray-200">
        <div ref={box} className="h-56 sm:h-64 w-full bg-gray-100 z-0" />
        <button
          type="button"
          onClick={useMyLocation}
          disabled={busy !== null}
          className="absolute bottom-3 left-3 z-[500] inline-flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-2 text-xs font-bold text-gray-800 shadow-md hover:bg-white disabled:opacity-60"
        >
          {busy === 'gps' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5 text-brand-600" />}
          موقعي الحالي
        </button>
        {!value && (
          <div className="pointer-events-none absolute top-3 inset-x-3 z-[500] text-center">
            <span className="inline-block rounded-full bg-gray-900/75 px-3 py-1 text-[11px] font-bold text-white">اضغط على الخريطة لتثبيت منزل العائلة</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            className={`${inputCls} pr-9`}
            value={link}
            onChange={e => setLink(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); find() } }}
            placeholder="ابحث عن عنوان، أو الصق رابط موقع أو إحداثيات"
            aria-label="بحث عن عنوان أو رابط موقع"
            dir="auto"
          />
        </div>
        <button type="button" onClick={() => find()} disabled={!link.trim() || busy !== null}
          className="rounded-xl bg-gray-900 px-3 text-xs font-bold text-white disabled:opacity-40">
          {busy === 'link' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'بحث'}
        </button>
      </div>

      {!value && !link && addressHint && addressHint.trim().length >= 3 && busy === null && hits.length === 0 && (
        <button type="button" onClick={() => find(addressHint)}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-brand-300 bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700">
          <Search className="w-3.5 h-3.5" /> ابحث عن «{addressHint.trim().slice(0, 40)}» على الخريطة
        </button>
      )}

      {hits.length > 0 && (
        <ul className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden" role="listbox" aria-label="نتائج البحث">
          {hits.map((h, i) => (
            <li key={i}>
              <button type="button" role="option" aria-selected={false} onClick={() => place(h.point)}
                className="w-full flex items-start gap-2 px-3 py-2 text-right text-xs text-gray-700 hover:bg-brand-50">
                <MapPin className="w-3.5 h-3.5 mt-0.5 text-brand-500 flex-shrink-0" />
                <span className="line-clamp-2">{h.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {msg && <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-3 py-2">{msg}</p>}

      {value && (
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 text-gray-500"><MapPin className="w-3.5 h-3.5" /><span dir="ltr">{value.lat.toFixed(5)}, {value.lng.toFixed(5)}</span></span>
          <NavLinks point={value} compact />
          <button type="button" onClick={() => onChange(undefined)} className="inline-flex items-center gap-1 text-rose-600 font-bold mr-auto">
            <Trash2 className="w-3.5 h-3.5" /> إزالة الموقع
          </button>
        </div>
      )}
    </div>
  )
}

// ── Show several stops (today's route, all families) ─────────────────────────

export interface MapStop { id: string; point: GeoPoint; color: string; label?: string; title: string }

export function StopsMap({ stops, currency, height = 'h-64', line = false }: {
  stops: MapStop[]; currency: WorkCurrency; height?: string; line?: boolean
}) {
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<LMap | null>(null)
  const layer = useRef<LayerGroup | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadLeaflet().then(lf => {
      if (cancelled || !box.current || map.current) return
      const c = DEFAULT_CENTER[currency]
      const m = lf.map(box.current, { scrollWheelZoom: false }).setView([c.lat, c.lng], 11)
      lf.tileLayer(TILE_URL, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(m)
      layer.current = lf.layerGroup().addTo(m)
      map.current = m
      setReady(true)
    })
    return () => { cancelled = true; map.current?.remove(); map.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!ready) return
    loadLeaflet().then(lf => {
      const m = map.current, g = layer.current
      if (!m || !g) return
      g.clearLayers()
      for (const s of stops) {
        lf.marker([s.point.lat, s.point.lng], { icon: pinIcon(lf, s.color, s.label), title: s.title })
          .bindPopup(`<div dir="rtl" style="font:700 12px system-ui">${s.title.replace(/</g, '&lt;')}<br/><a href="${googleDirectionsUrl(s.point)}" target="_blank" rel="noopener">الطريق ↗</a></div>`)
          .addTo(g)
      }
      if (line && stops.length > 1) {
        lf.polyline(stops.map(s => [s.point.lat, s.point.lng] as [number, number]), { color: '#6B46F0', weight: 3, dashArray: '6 8', opacity: 0.7 }).addTo(g)
      }
      if (stops.length === 1) m.setView([stops[0].point.lat, stops[0].point.lng], 15)
      else if (stops.length > 1) m.fitBounds(lf.latLngBounds(stops.map(s => [s.point.lat, s.point.lng] as [number, number])), { padding: [40, 40], maxZoom: 15 })
      setTimeout(() => m.invalidateSize(), 150)
    })
  }, [stops, ready, line])

  return <div ref={box} className={`${height} w-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 z-0`} />
}

// ── Navigation buttons ───────────────────────────────────────────────────────

export function NavLinks({ point, compact }: { point: GeoPoint; compact?: boolean }) {
  const cls = compact
    ? 'inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 font-bold text-gray-700 hover:bg-gray-200'
    : 'inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-3 py-2 text-xs font-bold text-white hover:bg-gray-800'
  return (
    <>
      <a href={googleDirectionsUrl(point)} target="_blank" rel="noopener noreferrer" className={cls}>
        <Navigation className="w-3.5 h-3.5" /> Google Maps
      </a>
      <a href={wazeUrl(point)} target="_blank" rel="noopener noreferrer"
        className={compact ? cls : 'inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-3 py-2 text-xs font-bold text-white hover:bg-sky-600'}>
        <Navigation className="w-3.5 h-3.5" /> Waze
      </a>
    </>
  )
}
