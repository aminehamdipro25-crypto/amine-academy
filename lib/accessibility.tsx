'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import React from 'react'

const STORAGE_KEY = 'aa_a11y'

interface A11yPrefs {
  reducedMotion: boolean
  dyslexiaFont: boolean
  highContrast: boolean
}

const DEFAULTS: A11yPrefs = { reducedMotion: false, dyslexiaFont: false, highContrast: false }

interface A11yCtx extends A11yPrefs {
  setPref: (key: keyof A11yPrefs, value: boolean) => void
}

const Ctx = createContext<A11yCtx>({ ...DEFAULTS, setPref: () => {} })

function applyToDom(prefs: A11yPrefs) {
  const root = document.documentElement
  root.classList.toggle('a11y-motion-reduced', prefs.reducedMotion)
  root.classList.toggle('a11y-dyslexia', prefs.dyslexiaFont)
  root.classList.toggle('a11y-contrast-high', prefs.highContrast)
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<A11yPrefs>(DEFAULTS)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as Partial<A11yPrefs> | null
      if (saved) {
        const merged = { ...DEFAULTS, ...saved }
        setPrefs(merged)
        applyToDom(merged)
      }
    } catch { /* ignore corrupted prefs */ }
  }, [])

  function setPref(key: keyof A11yPrefs, value: boolean) {
    setPrefs(prev => {
      const next = { ...prev, [key]: value }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      applyToDom(next)
      return next
    })
  }

  return React.createElement(Ctx.Provider, { value: { ...prefs, setPref } }, children)
}

export function useAccessibility() { return useContext(Ctx) }
