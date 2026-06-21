import { getAllParents } from '@/lib/db'
import ClientsView from './ClientsView'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function ClientsPage() {
  let parents: Awaited<ReturnType<typeof getAllParents>> = []
  let error = false

  try {
    parents = await getAllParents()
  } catch {
    error = true
  }

  return <ClientsView parents={parents} error={error} />
}
