import { NextRequest, NextResponse } from 'next/server'
import { getStudent } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const student = await getStudent(params.id)
    return NextResponse.json({ student })
  } catch {
    return NextResponse.json({ student: null })
  }
}
