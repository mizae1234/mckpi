import TranscriptClient from './TranscriptClient'

export const dynamic = 'force-dynamic'

export default async function TranscriptPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const params = await searchParams
  return <TranscriptClient initialEmployeeId={params.id || ''} />
}
