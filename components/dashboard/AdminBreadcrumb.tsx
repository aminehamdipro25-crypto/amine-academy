'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Home } from 'lucide-react'

const SEGMENT_LABELS: Record<string, string> = {
  clients:               'المشتركون',
  programs:              'البرامج',
  exercises:             'التمارين',
  appointments:          'المواعيد',
  'learning-difficulties': 'صعوبات التعلم',
  reports:               'التقارير',
  payments:              'المدفوعات',
  messages:              'الرسائل',
  settings:              'الإعدادات',
  analytics:             'الإحصائيات',
  new:                   'إضافة جديد',
}

function labelFor(segment: string) {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment]
  // Dynamic id segment — show short id
  if (/^[A-Z]{2}-/.test(segment)) return `#${segment.slice(0, 10)}`
  return segment
}

export default function AdminBreadcrumb() {
  const pathname = usePathname()

  // Split path: ['', 'dashboard', 'clients', 'AA-xxx']
  const segments = pathname.split('/').filter(Boolean)

  // Only show for depth > 1 (not on /dashboard itself)
  if (segments.length <= 1) return null

  // Build crumb list
  const crumbs = segments.map((seg, i) => ({
    label: seg === 'dashboard' ? 'الرئيسية' : labelFor(seg),
    href:  '/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }))

  return (
    <nav className="flex items-center gap-1 text-xs mb-5 flex-wrap" aria-label="مسار التنقل">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {i > 0 && <ChevronLeft className="w-3 h-3 text-gray-300 flex-shrink-0" />}
          {crumb.isLast ? (
            <span className="font-bold text-gray-700">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="text-gray-400 hover:text-brand-600 font-medium transition-colors flex items-center gap-1"
            >
              {i === 0 && <Home className="w-3 h-3" />}
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
