type DataStatus = 'current' | 'stale' | 'missing'

function getStatus(dateStr: string | null): DataStatus {
  if (!dateStr) return 'missing'
  try {
    const ms = new Date().getTime() - new Date(dateStr).getTime()
    const days = ms / (1000 * 60 * 60 * 24)
    if (days < 90) return 'current'
    if (days < 180) return 'stale'
    return 'missing'
  } catch {
    return 'missing'
  }
}

const STATUS_COLORS: Record<DataStatus, string> = {
  current: 'bg-[#10B981]',
  stale: 'bg-[#F59E0B]',
  missing: 'bg-[#EF4444]',
}

const STATUS_TITLES: Record<DataStatus, string> = {
  current: 'Data is current',
  stale: 'Data is stale (90–180 days)',
  missing: 'No data',
}

export default function StatusDot({ date }: { date: string | null }) {
  const status = getStatus(date)
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${STATUS_COLORS[status]}`}
      title={STATUS_TITLES[status]}
    />
  )
}
