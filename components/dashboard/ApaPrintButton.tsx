'use client'
// Print trigger for the APA planner page. Split out so the page itself can stay
// a server component and trim the exercise catalogue before it reaches the browser.
import { Printer } from 'lucide-react'

export default function ApaPrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 bg-gray-900 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors text-sm"
    >
      <Printer className="w-4 h-4" />
      طباعة خطة الحصة
    </button>
  )
}
