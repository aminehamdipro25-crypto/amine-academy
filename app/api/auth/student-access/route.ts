import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminSession, createSession } from '@/lib/auth'
import { getStudent, getStudentsByParent } from '@/lib/db'
import { redis } from '@/lib/redis'
import { isRateLimited, getClientIp } from '@/lib/rateLimit'

export const runtime = 'nodejs'

// Admin generates a 6-char alphanumeric access code for a student
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value
    if (!await verifyAdminSession(token)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { studentId } = await req.json().catch(() => ({}))
    if (!studentId) return NextResponse.json({ error: 'studentId مطلوب' }, { status: 400 })

    const student = await getStudent(studentId)
    if (!student) return NextResponse.json({ error: 'الطالب غير موجود' }, { status: 404 })

    const code = Math.random().toString(36).slice(2, 8).toUpperCase()
    await redis.set(`student_code:${code}`, studentId, { ex: 7 * 24 * 3600 })

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
