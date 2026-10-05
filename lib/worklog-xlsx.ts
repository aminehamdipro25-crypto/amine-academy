// The ledger as a real Excel workbook (.xlsx), built by hand: the format is a
// zip of a handful of XML files, and writing them directly costs one small
// dependency (fflate) instead of a spreadsheet library several hundred KB
// large with a security-advisory history.
//
// Choices that matter when the file is opened:
//   • Dates are real Excel dates (serial numbers with a date format), so the
//     sheet sorts and filters by date — text "2026-10-04" would not.
//   • Money and hours are numbers, so SUM works on them.
//   • Every sheet is right-to-left, as an Arabic reader expects.
//   • Text is written inline and escaped: a family name containing "<" or "&"
//     must not produce a file Excel refuses to open.

import { zipSync, strToU8 } from 'fflate'
import {
  CURRENCY_LABEL, EXPENSE_LABEL, PAYMENT_METHOD_LABEL, STATUS_META,
  clientBalances, endTime, isBillable, periodStats, sortLessons,
  type WorkClient, type WorkExpense, type WorkLesson, type WorkPayment, type WorkSettings,
} from './worklog'

type Cell =
  | { t: 's'; v: string; bold?: boolean }
  | { t: 'n'; v: number; fmt?: 'money' | 'hours' | 'int' }
  | { t: 'd'; v: string } // YYYY-MM-DD
  | null

interface Sheet { name: string; widths: number[]; rows: Cell[][] }

// Style indexes into cellXfs below.
const STYLE = { text: 0, header: 1, date: 2, money: 3, hours: 4, int: 5, bold: 6 }

function esc(s: string): string {
  return s
    // XML 1.0 forbids most control characters outright.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** 0 → A, 25 → Z, 26 → AA. */
function colName(i: number): string {
  let s = ''
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s
  return s
}

/** Excel's date serial (days since 1899-12-30), computed in UTC so no zone can shift a day. */
export function excelDate(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 864e5)
}

function cellXml(c: Cell, ref: string): string {
  if (!c) return ''
  if (c.t === 's') return `<c r="${ref}" t="inlineStr"${c.bold ? ` s="${STYLE.bold}"` : ''}><is><t xml:space="preserve">${esc(c.v)}</t></is></c>`
  if (c.t === 'd') return `<c r="${ref}" s="${STYLE.date}"><v>${excelDate(c.v)}</v></c>`
  const s = c.fmt === 'money' ? STYLE.money : c.fmt === 'hours' ? STYLE.hours : c.fmt === 'int' ? STYLE.int : STYLE.text
  return `<c r="${ref}" s="${s}"><v>${Number.isFinite(c.v) ? c.v : 0}</v></c>`
}

function sheetXml(sh: Sheet): string {
  const cols = sh.widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')
  const rows = sh.rows.map((r, ri) => {
    const cells = r.map((c, ci) => {
      // The first row of every table sheet is its header.
      if (ri === 0 && c && c.t === 's') return `<c r="${colName(ci)}1" t="inlineStr" s="${STYLE.header}"><is><t xml:space="preserve">${esc(c.v)}</t></is></c>`
      return cellXml(c, `${colName(ci)}${ri + 1}`)
    }).join('')
    return `<row r="${ri + 1}">${cells}</row>`
  }).join('')
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<sheetViews><sheetView workbookViewId="0" rightToLeft="1"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
    `<cols>${cols}</cols><sheetData>${rows}</sheetData></worksheet>`
}

const STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<numFmts count="3"><numFmt numFmtId="164" formatCode="yyyy-mm-dd"/><numFmt numFmtId="165" formatCode="#,##0.00"/><numFmt numFmtId="166" formatCode="0.0"/></numFmts>' +
  '<fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><name val="Arial"/></font></fonts>' +
  '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
  '<fill><patternFill patternType="solid"><fgColor rgb="FFEDE9FE"/><bgColor indexed="64"/></patternFill></fill></fills>' +
  '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="7">' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
  '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
  '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '<xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '<xf numFmtId="1" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
  '</cellXfs></styleSheet>'

export function buildXlsx(sheets: Sheet[]): Uint8Array {
  const wbSheets = sheets.map((s, i) => `<sheet name="${esc(s.name.slice(0, 31))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')
  const wbRels = sheets.map((_, i) =>
    `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('') +
    `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`
  const files: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') +
      '</Types>'),
    '_rels/.rels': strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>'),
    'xl/workbook.xml': strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      `<bookViews><workbookView rightToLeft="1"/></bookViews><sheets>${wbSheets}</sheets></workbook>`),
    'xl/_rels/workbook.xml.rels': strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${wbRels}</Relationships>`),
    'xl/styles.xml': strToU8(STYLES),
  }
  sheets.forEach((s, i) => { files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(sheetXml(s)) })
  return zipSync(files, { level: 6 })
}

// ── The ledger's workbook ────────────────────────────────────────────────────

const S = (v: string | undefined, bold = false): Cell => (v ? { t: 's', v, bold } : null)
const N = (v: number, fmt?: 'money' | 'hours' | 'int'): Cell => ({ t: 'n', v, fmt })
const D = (v: string): Cell => ({ t: 'd', v })
const hours = (min: number) => Math.round((min / 60) * 100) / 100

export function ledgerSheets(
  data: { clients: WorkClient[]; lessons: WorkLesson[]; payments: WorkPayment[]; expenses: WorkExpense[]; settings: WorkSettings },
  from: string, to: string, today: string,
): Sheet[] {
  const { clients, lessons, payments, expenses, settings } = data
  const cur = CURRENCY_LABEL[settings.currency]
  const byId = new Map(clients.map(c => [c.id, c]))
  const who = (id: string) => { const c = byId.get(id); return c ? (c.childName ? `${c.childName} (${c.name})` : c.name) : 'عائلة محذوفة' }
  const st = periodStats(lessons, payments, expenses, from, to)
  const inRange = <T extends { date: string }>(xs: T[]) => xs.filter(x => x.date >= from && x.date <= to)

  const summary: Sheet = {
    name: 'ملخص',
    widths: [34, 18],
    rows: [
      [S('البند'), S('القيمة')],
      [S('من'), D(from)],
      [S('إلى'), D(to)],
      [S('ساعات منجزة'), N(hours(st.minutesDone), 'hours')],
      [S('حصص منجزة'), N(st.lessonsDone, 'int')],
      [S('ساعات ملغاة'), N(hours(st.minutesCancelled), 'hours')],
      [S('حصص ملغاة'), N(st.lessonsCancelled, 'int')],
      [S('ساعات مجدولة لم تُنجز بعد'), N(hours(st.minutesScheduled), 'hours')],
      [S(`قيمة العمل المنجز (${cur})`), N(st.earned, 'money')],
      [S(`المستلم فعلاً (${cur})`), N(st.collected, 'money')],
      [S(`المصاريف (${cur})`), N(st.expenses, 'money')],
      [S(`الصافي = المستلم − المصاريف (${cur})`, true), N(st.net, 'money')],
      [S(`ضاع بسبب الإلغاء (${cur})`), N(st.lostToCancellations, 'money')],
      [S('نسبة الإلغاء (%)'), st.cancellationRate === null ? S('—') : N(Math.round(st.cancellationRate * 1000) / 10, 'hours')],
      [S(`متوسط سعر الساعة (${cur})`), st.avgHourly === null ? S('—') : N(st.avgHourly, 'money')],
    ],
  }

  const lessonsSheet: Sheet = {
    name: 'الحصص',
    widths: [12, 8, 8, 28, 10, 12, 16, 12, 30],
    rows: [
      [S('التاريخ'), S('البداية'), S('النهاية'), S('العائلة'), S('الساعات'), S(`السعر (${cur})`), S('الحالة'), S(`المحتسب (${cur})`), S('ملاحظة')],
      ...sortLessons(inRange(lessons)).map(l => [
        D(l.date), S(l.start), S(endTime(l.start, l.durationMin)), S(who(l.clientId)), N(hours(l.durationMin), 'hours'),
        N(l.price, 'money'),
        S(STATUS_META[l.status].label + (l.status === 'cancelled' ? (l.cancelledBy === 'me' ? ' (منّي)' : ' (العائلة)') + (l.charged ? ' · محتسبة' : '') : '')),
        N(isBillable(l) ? l.price : 0, 'money'), S([l.status === 'cancelled' && l.cancelReason ? `سبب الإلغاء: ${l.cancelReason}` : '', l.note ?? ''].filter(Boolean).join(' · ')),
      ]),
    ],
  }

  const paymentsSheet: Sheet = {
    name: 'الدفعات',
    widths: [12, 28, 14, 10, 30],
    rows: [
      [S('التاريخ'), S('العائلة'), S(`المبلغ (${cur})`), S('الطريقة'), S('ملاحظة')],
      ...inRange(payments).sort((a, b) => a.date.localeCompare(b.date)).map(p => [
        D(p.date), S(who(p.clientId)), N(p.amount, 'money'), S(PAYMENT_METHOD_LABEL[p.method]), S(p.note),
      ]),
    ],
  }

  const expensesSheet: Sheet = {
    name: 'المصاريف',
    widths: [12, 18, 14, 30],
    rows: [
      [S('التاريخ'), S('الفئة'), S(`المبلغ (${cur})`), S('ملاحظة')],
      ...inRange(expenses).sort((a, b) => a.date.localeCompare(b.date)).map(e => [
        D(e.date), S(EXPENSE_LABEL[e.category]), N(e.amount, 'money'), S(e.note),
      ]),
    ],
  }

  // Balances are all-time on purpose: what a family owes does not reset with the period.
  const balances = clientBalances(clients, lessons, payments, today)
  const familiesSheet: Sheet = {
    name: 'العائلات',
    widths: [28, 16, 14, 14, 16, 14, 30],
    rows: [
      [S('العائلة'), S('الهاتف'), S(`سعر الساعة (${cur})`), S(`المستحق الكلي (${cur})`), S(`المدفوع الكلي (${cur})`), S(`الرصيد حتى اليوم (${cur})`), S('العنوان')],
      ...clients.map(c => {
        const b = balances.find(x => x.clientId === c.id)!
        return [S(who(c.id) + (c.archived ? ' — مؤرشفة' : '')), S(c.phone), N(c.hourlyRate, 'money'), N(b.billed, 'money'), N(b.paid, 'money'), N(b.balance, 'money'), S(c.address)]
      }),
    ],
  }

  return [summary, lessonsSheet, paymentsSheet, expensesSheet, familiesSheet]
}
