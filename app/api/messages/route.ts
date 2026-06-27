export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { sendMessage, getThreadMessages, markThreadRead, getUnreadCount } from '@/lib/db'
import { getParent } from '@/lib/db'
import { sendEmail, newMessageAdminEmail } from '@/lib/mailer'

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

    // Read the unread count BEFORE marking as read, otherwise it's always 0
    const unreadFromAdmin = await getUnreadCount(parentId, 'parent')

    // Mark as read by parent (admin messages now seen)
    await markThreadRead(parentId, 'parent')

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

    const adminEmail = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL || process.env.GMAIL_USER
    if (adminEmail) {
      sendEmail({
        to: adminEmail,
        subject: `💬 رسالة جديدة من ${senderName} — أكاديمية أمين`,
        html: newMessageAdminEmail(senderName, content.slice(0, 300)),
      }).catch(e => console.error('[api/messages POST] admin notify email failed', e))
    }

    return NextResponse.json({ message })
  } catch (err) {
    console.error('[api/messages POST]', err)
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 })
  }
}
