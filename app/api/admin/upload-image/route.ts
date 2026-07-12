import { NextRequest, NextResponse } from 'next/server'
import { isOwnerUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// Image upload for story pages, via Vercel Blob. Graceful degradation: if
// BLOB_READ_WRITE_TOKEN isn't configured (Blob storage not yet connected in
// the Vercel project), returns a clear error instead of a stack trace — the
// story editor still works fully with emoji/text-only pages until it's set up.
export async function POST(req: NextRequest) {
  try {
    if (!await isOwnerUser()) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: 'رفع الصور غير مُفعّل بعد — يحتاج ربط Vercel Blob Storage بالمشروع (BLOB_READ_WRITE_TOKEN)' },
        { status: 503 }
      )
    }

    const form = await req.formData().catch(() => null)
    const file = form?.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'لم يتم إرفاق ملف' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'نوع الملف غير مدعوم — استخدم JPG أو PNG أو WEBP أو GIF' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'حجم الصورة كبير جداً — الحد الأقصى 5 ميغابايت' }, { status: 400 })
    }

    const { put } = await import('@vercel/blob')
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-60)
    const blob = await put(`stories/${Date.now()}-${safeName}`, file, {
      access: 'public',
      addRandomSuffix: true,
    })

    return NextResponse.json({ url: blob.url })
  } catch (err) {
    console.error('[upload-image]', err)
    return NextResponse.json({ error: 'تعذّر رفع الصورة، حاول مجدداً' }, { status: 500 })
  }
}
