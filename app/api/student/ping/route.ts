import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { redis } from '@/lib/redis'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const token = cookies().get('student_token')?.value
    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ ok: false }, { status: 401 })
    await redis.set(`client_last:${payload.id}`, Date.now(), { ex: 600 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[student-ping]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
