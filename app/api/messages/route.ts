export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { sendMessage, getThreadMessages, markThreadRead, getUnreadCount } from '@/lib/db'
import { getParent } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('parent_token')?.value
    const payload = await verifyToken(token)

    if (!payload || payload.role !== 'parent') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const parentId = payload.id
    const messages = await getThreadMessages(parentId)

    // Mark as read by parent (admin messages now seen)
    await markThreadRead(parentId, 'parent')

    const unreadFromAdmin = await getUnreadCount(parentId, 'parent')

    return NextResponse.json({ messages, unreadFromAdmin })
  } catch (err) {
    console.error('[api/messages GET]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('parent_token')?.value
    const payload = await verifyToken(token)

    if (!payload || payload.role !== 'parent') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const parentId = payload.id
    const body = await req.json()
    const content = (body?.content ?? '').trim()

    if (!content || content.length > 1000) {
      return NextResponse.json({ error: 'محتوى الرسالة غير صالح' }, { status: 400 })
    }

    // Get parent name for sender display
    const parent = await getParent(parentId)
    const senderName = parent ? `${parent.firstName} ${parent.lastName}` : 'ولي الأمر'

    const message = await sendMessage({
      threadId: parentId,
      from: 'parent',
      senderName,
      content,
      read: false,
    })

    return NextResponse.json({ message })
  } catch (err) {
    console.error('[api/messages POST]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
