const SECTOR_COLORS: Record<string, string> = {
  industrials: 'bg-amber-100 text-amber-800',
  bfsi: 'bg-blue-100 text-blue-800',
  banking: 'bg-blue-100 text-blue-800',
  finance: 'bg-indigo-100 text-indigo-800',
  nbfc: 'bg-indigo-100 text-indigo-800',
  pharma: 'bg-green-100 text-green-800',
  healthcare: 'bg-green-100 text-green-800',
  diagnostics: 'bg-pink-100 text-pink-800',
  it: 'bg-purple-100 text-purple-800',
  technology: 'bg-purple-100 text-purple-800',
  fmcg: 'bg-orange-100 text-orange-800',
  consumer: 'bg-orange-100 text-orange-800',
  qsr: 'bg-red-100 text-red-800',
  chemicals: 'bg-emerald-100 text-emerald-800',
  agri: 'bg-lime-100 text-lime-800',
}

function getSectorColor(sector: string | null): string {
  if (!sector) return 'bg-gray-100 text-gray-600'
  const key = sector.toLowerCase().split(' ')[0]
  return SECTOR_COLORS[key] || 'bg-gray-100 text-gray-600'
}

export default function SectorChip({ sector }: { sector: string | null }) {
  if (!sector) return null
  return (
    <span className={`inline-block text-2xs font-medium px-2 py-0.5 rounded-full ${getSectorColor(sector)}`}>
      {sector}
    </span>
  )
}
