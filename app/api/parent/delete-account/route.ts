import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { redis } from '@/lib/redis'
import { getParent, getStudentsByParent, deleteParentFull } from '@/lib/db'

export const runtime = 'nodejs'

export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('parent_token')?.value
    const payload = await verifyToken(token)

    if (!payload || payload.role !== 'parent') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    if (body?.confirm !== 'DELETE') {
      return NextResponse.json({ error: 'confirmation_required' }, { status: 400 })
    }

    const parentId = payload.id
    const parent = await getParent(parentId)
    if (!parent) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    // Gather IDs for deep cleanup BEFORE deleteParentFull removes the index lists
    const [students, messageIds, paymentIds] = await Promise.all([
      getStudentsByParent(parentId),
      redis.lrange(`messages:thread:${parentId}`, 0, -1),
      redis.lrange(`payments:parent:${parentId}`, 0, -1),
    ])

    // For each student, gather game result IDs (so we can delete individual records)
    const studentSubData = await Promise.all(
      students.map(async (s) => ({
        studentId: s.id,
        gameResultIds: await redis.lrange(`game-results:student:${s.id}`, 0, -1),
      }))
    )

    // Core deletion: parent record, students, appointments, reports, programs
    // (uses the existing deleteParentFull helper in lib/db.ts)
    await deleteParentFull(parentId)

    // Additional GDPR cleanup not covered by deleteParentFull
    const cmds: unknown[][] = [
      // Auth session
      ['DEL', `sess:${parentId}`],
      // Email-verification and password-reset tokens
      ['DEL', `activation:${parent.email}`],
      ['DEL', `pwd_reset:${parent.email}`],
      // Message thread list + counters + global index entry
      ['DEL', `messages:thread:${parentId}`],
      ['DEL', `messages:unread:parent:${parentId}`],
      ['DEL', `messages:unread:admin:${parentId}`],
      ['LREM', 'messages:threads:index', '0', parentId],
      // Payment list
      ['DEL', `payments:parent:${parentId}`],
    ]

    // Individual message records (have their own TTL but delete immediately)
    for (const id of messageIds) {
      cmds.push(['DEL', `message:${id}`])
    }

    // Individual payment records + remove from global payments:index
    for (const id of paymentIds) {
      cmds.push(['DEL', `payment:${id}`])
      cmds.push(['LREM', 'payments:index', '0', id])
    }

    // Per-student data not handled by deleteParentFull
    for (const { studentId, gameResultIds } of studentSubData) {
      cmds.push(['DEL', `homework:${studentId}`])
      cmds.push(['DEL', `assessment-profile:${studentId}`])
      cmds.push(['DEL', `assessments:student:${studentId}`])
      cmds.push(['DEL', `exercises:count:${studentId}`])
      cmds.push(['DEL', `game-results:student:${studentId}`])
      for (const id of gameResultIds) {
        cmds.push(['DEL', `game-result:${id}`])
      }
    }

    await redis.pipeline(cmds)

    // Clear auth cookie and respond
    const response = NextResponse.json({ ok: true })
    response.cookies.set('parent_token', '', { maxAge: 0, path: '/' })
    return response
  } catch (err) {
    console.error('[delete-account]', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
