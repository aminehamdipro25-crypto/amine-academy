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

  // Strip passwordHash before it reaches the RSC payload — the client component
  // never needs it, but a raw prop is serialized to the browser regardless.
  const safeParents = parents.map(({ passwordHash, ...rest }) => rest)

  return <ClientsView parents={safeParents} error={error} />
}
