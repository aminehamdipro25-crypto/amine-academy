'use client'
import type { WorkData } from './useWorkLog'

/**
 * Build the workbook in the browser and hand it to the viewer as a download.
 * The builder (and fflate) load only when the button is pressed, so the
 * page itself does not carry them.
 */
export async function downloadLedgerXlsx(data: WorkData, from: string, to: string, today: string): Promise<void> {
  const { buildXlsx, ledgerSheets } = await import('@/lib/worklog-xlsx')
  const bytes = buildXlsx(ledgerSheets(data, from, to, today))
  const blob = new Blob([bytes as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    // ASCII on purpose: several browsers (iOS Safari among them) drop a non-ASCII download name.
    a.download = `work-log_${from}_${to}.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    // Give the browser a moment to start the download before releasing it.
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }
}
