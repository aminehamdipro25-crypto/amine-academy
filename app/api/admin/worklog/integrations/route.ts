import { NextRequest, NextResponse } from 'next/server'
import { isOwnerUser } from '@/lib/auth'
import { redis } from '@/lib/redis'
import { REMINDERS_LAST_RUN_KEY, type RemindersLastRun, getWorkSettings, listWork, saveWorkSettings } from '@/lib/worklog-store'
import { guessNotionMap, parseNotionDbId, validNotionMap, type NotionMap } from '@/lib/worklog-notion'
import {
  NOTION_LAST_KEY, fetchNotionSchema, notionTokenConfigured, syncLessonsToNotion, type NotionLast,
} from '@/lib/worklog-notion-sync'
import {
  GCAL_LAST_KEY, forgetGcalAuth, gcalClientConfigured, gcalConnection, syncLessonsToGcal, type GcalLast,
} from '@/lib/worklog-gcal-sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })
/** Lessons copied per «مزامنة الكل» call — the page repeats the call until done, inside Notion's rate limit. */
const BATCH = 20

// The state of the two outside connections, as the Settings page shows it:
// whether each one is actually working, not merely whether it was switched on.
export async function GET() {
  if (!(await isOwnerUser())) return bad('غير مصرح', 401)
  const settings = await getWorkSettings()
  const [last, lastRun, gcalLast, gcalConn] = await Promise.all([
    redis.get<NotionLast>(NOTION_LAST_KEY).catch(() => null),
    redis.get<RemindersLastRun>(REMINDERS_LAST_RUN_KEY).catch(() => null),
    redis.get<GcalLast>(GCAL_LAST_KEY).catch(() => null),
    gcalConnection(),
  ])

  const notion: Record<string, unknown> = { tokenConfigured: notionTokenConfigured(), last }
  if (settings.notion?.databaseId && notionTokenConfigured()) {
    try {
      const schema = await fetchNotionSchema(settings.notion.databaseId)
      Object.assign(notion, {
        databaseId: settings.notion.databaseId, title: schema.title, props: schema.props,
        map: validNotionMap(settings.notion.map as NotionMap, schema.props),
      })
    } catch (e) {
      Object.assign(notion, { databaseId: settings.notion.databaseId, error: (e as Error).message })
    }
  }

  return NextResponse.json({
    notion,
    // Never the token itself — only whether one is held and for which address.
    gcal: { clientConfigured: gcalClientConfigured(), ...gcalConn, last: gcalLast },
    reminders: {
      telegramConfigured: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
      cronConfigured: !!process.env.CRON_SECRET,
      lastRun,
    },
  })
}

export async function POST(req: NextRequest) {
  if (!(await isOwnerUser())) return bad('غير مصرح', 401)
  const body = await req.json().catch(() => null) as Record<string, unknown> | null
  if (!body) return bad('طلب غير صالح')
  const settings = await getWorkSettings()

  try {
    switch (body.action) {
      case 'connect': {
        if (!notionTokenConfigured()) return bad('أضف NOTION_TOKEN في Vercel أولاً، ثم أعد النشر', 503)
        const id = parseNotionDbId(body.database)
        if (!id) return bad('الصق رابط قاعدة البيانات في نوشن (أو معرّفها المكوّن من 32 حرفاً)')
        // Reading it first proves the integration can see it — the usual failure.
        const schema = await fetchNotionSchema(id)
        if (!schema.props.some(p => p.type === 'title')) return bad('هذه ليست قاعدة بيانات نوشن')
        const map = guessNotionMap(schema.props)
        await saveWorkSettings({ ...settings, notion: { databaseId: id, map } })
        return NextResponse.json({ databaseId: id, title: schema.title, props: schema.props, map })
      }
      case 'map': {
        if (!settings.notion?.databaseId) return bad('اربط قاعدة بيانات أولاً')
        const schema = await fetchNotionSchema(settings.notion.databaseId)
        const map = validNotionMap((body.map ?? {}) as NotionMap, schema.props)
        if (!map.title) return bad('عمود العنوان مطلوب')
        await saveWorkSettings({ ...settings, notion: { databaseId: settings.notion.databaseId, map } })
        return NextResponse.json({ map })
      }
      case 'sync': {
        if (!settings.notion?.databaseId) return bad('اربط قاعدة بيانات أولاً')
        // Oldest first, a batch at a time; the page passes back `next` until done.
        const all = (await listWork('lessons')).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
        const from = Math.max(0, Math.floor(Number(body.cursor) || 0))
        const batch = all.slice(from, from + BATCH)
        const r = await syncLessonsToNotion(batch)
        if (r.error) return bad(`توقّفت المزامنة عند ${from + r.synced} من ${all.length}: ${r.error}`, 502)
        const next = from + batch.length
        return NextResponse.json({ total: all.length, done: next, next: next < all.length ? next : null })
      }
      case 'gcal-sync': {
        if (!(await gcalConnection()).connected) return bad('اربط تقويم Google أولاً')
        const all = (await listWork('lessons')).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
        const from = Math.max(0, Math.floor(Number(body.cursor) || 0))
        const batch = all.slice(from, from + BATCH)
        const r = await syncLessonsToGcal(batch)
        if (r.error) return bad(`توقّف النسخ عند ${from + r.synced} من ${all.length}: ${r.error}`, 502)
        const next = from + batch.length
        return NextResponse.json({ total: all.length, done: next, next: next < all.length ? next : null })
      }
      case 'gcal-disconnect': {
        await forgetGcalAuth()
        return NextResponse.json({ ok: true })
      }
      case 'disconnect': {
        const { notion: _drop, ...rest } = settings
        await saveWorkSettings(rest)
        return NextResponse.json({ ok: true })
      }
      default:
        return bad('إجراء غير معروف')
    }
  } catch (e) {
    return bad((e as Error).message, 502)
  }
}
