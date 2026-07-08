import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { isDashboardUser, createSession } from '@/lib/auth'
import { getStudent, getStudentsByParent } from '@/lib/db'
import { redis } from '@/lib/redis'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'

export const runtime = 'nodejs'

// Admin generates a 6-char alphanumeric access code for a student. This code
// is a login credential for a child, so it's generated with a CSPRNG (not
// Math.random) and regenerating invalidates any previously issued code for
// the same student — a leaked old code can't be used alongside a new one.
export async function POST(req: NextRequest) {
  try {
    if (!await isDashboardUser()) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { studentId } = await req.json().catch(() => ({}))
    if (!studentId) return NextResponse.json({ error: 'studentId مطلوب' }, { status: 400 })

    const student = await getStudent(studentId)
    if (!student) return NextResponse.json({ error: 'الطالب غير موجود' }, { status: 404 })

    const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous 0/O/1/I
    const code = Array.from(crypto.randomBytes(6), b => ALPHABET[b % ALPHABET.length]).join('')

    const activeKey = `student_code_active:${studentId}`
    const prevCode = await redis.get<string>(activeKey)
    const cmds: unknown[][] = [
      ['SET', `student_code:${code}`, studentId, 'EX', String(7 * 24 * 3600)],
      ['SET', activeKey, code, 'EX', String(7 * 24 * 3600)],
    ]
    if (prevCode && prevCode !== code) cmds.push(['DEL', `student_code:${prevCode}`])
    await redis.pipeline(cmds)

    return NextResponse.json({ ok: true, code, expiresIn: '7 أيام' })
  } catch (e) {
    console.error('[student-access/post]', e)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

// Student uses the code to log in
export async function PUT(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rl = await isRateLimited(`student_code:${ip}`, 10, 3600)
    if (rl.limited) {
      return rl.unavailable
        ? NextResponse.json({ error: 'الخدمة غير متوفرة مؤقتًا، يرجى المحاولة بعد قليل' }, { status: 503 })
        : NextResponse.json({ error: 'حاول مجدداً بعد ساعة' }, { status: 429 })
    }
    const { code } = await req.json().catch(() => ({}))
    if (!code) return NextResponse.json({ error: 'أدخل رمز الدخول' }, { status: 400 })

    const studentId = await redis.get<string>(`student_code:${String(code).trim().toUpperCase()}`)
    if (!studentId) {
      return NextResponse.json({ error: 'رمز الدخول غير صحيح أو منتهي الصلاحية' }, { status: 401 })
    }

    const student = await getStudent(studentId)
    if (!student) return NextResponse.json({ error: 'الطالب غير موجود' }, { status: 404 })

    const sessionToken = await createSession(studentId, 'student')
    const res = NextResponse.json({ ok: true, firstName: student.firstName })
    res.cookies.set('student_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 3600,
      path: '/',
    })

    return res
  } catch (e) {
    console.error('[student-access/put]', e)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
