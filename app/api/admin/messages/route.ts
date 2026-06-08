export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminSession } from '@/lib/auth'
import {
  sendMessage,
  getThreadMessages,
  markThreadRead,
  getAllMessageThreads,
  getParent,
} from '@/lib/db'

async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  return verifyAdminSession(token)
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const threadId = searchParams.get('threadId')

    if (threadId) {
      // Return full thread messages and mark as read by admin
      const messages = await getThreadMessages(threadId)
      await markThreadRead(threadId, 'admin')
      return NextResponse.json({ messages })
    }

    // Return all threads with last message + unread counts
    const threads = await getAllMessageThreads()

    // Enrich with parent name
    const enriched = await Promise.all(
      threads.map(async (t) => {
        const parent = await getParent(t.parentId)
        return {
          ...t,
          parentName: parent ? `${parent.firstName} ${parent.lastName}` : t.parentId,
          parentEmail: parent?.email ?? '',
        }
      })
    )

    const totalUnread = enriched.reduce((sum, t) => sum + t.unreadForAdmin, 0)

    return NextResponse.json({ threads: enriched, totalUnread })
  } catch (err) {
    console.error('[api/admin/messages GET]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const threadId = (body?.threadId ?? '').trim()
    const content = (body?.content ?? '').trim()

    if (!threadId || !content || content.length > 1000) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
    }

    const message = await sendMessage({
      threadId,
      from: 'admin',
      senderName: 'الأستاذ أمين',
      content,
      read: false,
    })

    return NextResponse.json({ message })
  } catch (err) {
    console.error('[api/admin/messages POST]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
