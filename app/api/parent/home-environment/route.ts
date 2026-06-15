import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getStudentsByParent, getStudent, updateStudent } from '@/lib/db'
import type { HomeEnvironment } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('parent_token')?.value
    const payload = await verifyToken(token)

    if (!payload || payload.role !== 'parent') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const childId = searchParams.get('childId')

    let student = null
    if (childId) {
      const s = await getStudent(childId)
      if (s && s.parentId === payload.id) student = s
    } else {
      const children = await getStudentsByParent(payload.id)
      student = children[0] ?? null
    }

    if (!student) {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }

    return NextResponse.json({
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      homeEnvironment: student.homeEnvironment ?? null,
    })
  } catch (err) {
    console.error('[home-environment GET]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('parent_token')?.value
    const payload = await verifyToken(token)

    if (!payload || payload.role !== 'parent') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { childId, homeEnvironment } = body as { childId?: string; homeEnvironment: HomeEnvironment }

    if (!homeEnvironment) {
      return NextResponse.json({ error: 'homeEnvironment is required' }, { status: 400 })
    }

    let student = null
    if (childId) {
      const s = await getStudent(childId)
      if (s && s.parentId === payload.id) student = s
    } else {
      const children = await getStudentsByParent(payload.id)
      student = children[0] ?? null
    }

    if (!student) {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }

    await updateStudent(student.id, { homeEnvironment })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[home-environment POST]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
