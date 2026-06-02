import { useRef, useState } from 'react'
import { portfolioApi } from '../../api/client'
import type { UploadResult } from '../../types'

async function handleDownloadTemplate() {
  const res = await portfolioApi.downloadTemplate()
  const url = URL.createObjectURL(new Blob([res.data]))
  const a = document.createElement('a')
  a.href = url
  a.download = 'portfolio_template.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}

interface Props {
  onSuccess: () => void
}

export default function BulkUpload({ onSuccess }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Per-unmapped-name: raw_name → resolved symbol
  const [mappingInputs, setMappingInputs] = useState<Record<string, string>>({})
  const [savingMappings, setSavingMappings] = useState(false)
  const [mappingsDone, setMappingsDone] = useState(false)

  async function handleUpload(file: File) {
    setUploading(true)
    setResult(null)
    setError(null)
    setMappingsDone(false)
    setMappingInputs({})
    try {
      const res = await portfolioApi.upload(file)
      setResult(res.data)
      if (res.data.rows_successful > 0) onSuccess()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Upload failed'
      setError(msg)
    } finally {
      setUploading(false)
    }
  }

  async function saveMappings() {
    const entries = Object.entries(mappingInputs).filter(([, sym]) => sym.trim())
    if (!entries.length) return
    setSavingMappings(true)
    try {
      await Promise.all(entries.map(([raw, sym]) => portfolioApi.addMapping({ raw_name: raw, symbol: sym.trim().toUpperCase() })))
      setMappingsDone(true)
    } catch {
      alert('Failed to save some mappings')
    } finally {
      setSavingMappings(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-ink">Bulk Import Transactions</h3>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Template
          </button>
        </div>
        <p className="text-xs text-ink3 mb-3">
          Upload an Excel or CSV file with columns: <code className="bg-surface2 px-1 rounded">Date, Trans. Type, Asset, Qty, Price, Amount, Folio</code>
        </p>
        <p className="text-xs text-ink3">
          Trans. Type values: buy, sell, bonus, split, dividend, transfer in, transfer out.
          Date formats: DD-MM-YYYY, YYYY-MM-DD, DD/MM/YYYY. Column names are case-insensitive.
        </p>
      </div>

      <div
        className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent transition-colors"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const f = e.dataTransfer.files[0]
          if (f) handleUpload(f)
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleUpload(f)
          }}
        />
        <svg className="w-8 h-8 mx-auto text-ink3 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        {uploading ? (
          <p className="text-sm text-ink3">Uploading…</p>
        ) : (
          <>
            <p className="text-sm text-ink">Drop file here or click to browse</p>
            <p className="text-xs text-ink3 mt-1">.xlsx, .xls, .csv supported</p>
          </>
        )}
      </div>

      {error && (
        <div className="bg-red/10 border border-red/30 text-red rounded-lg p-3 text-sm">{error}</div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Processed', value: result.rows_processed },
              { label: 'Imported', value: result.rows_successful, color: result.rows_successful > 0 ? 'text-green' : '' },
              { label: 'Duplicates', value: result.rows_duplicate, color: 'text-ink2' },
              { label: 'Failed', value: result.rows_failed, color: result.rows_failed > 0 ? 'text-red' : '' },
            ].map((s) => (
              <div key={s.label} className="bg-surface border border-border rounded-lg p-3 text-center">
                <div className={`text-xl font-bold font-mono ${s.color ?? 'text-ink'}`}>{s.value}</div>
                <div className="text-xs text-ink3 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="bg-red/5 border border-red/20 rounded-lg p-3 space-y-1">
              <p className="text-xs font-medium text-red mb-2">Errors ({result.errors.length})</p>
              {result.errors.map((e, i) => (
                <p key={i} className="text-xs text-ink2 font-mono">{e}</p>
              ))}
            </div>
          )}

          {/* Unmapped names */}
          {result.unmapped_names.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-amber-800">
                {result.unmapped_names.length} company name{result.unmapped_names.length > 1 ? 's' : ''} could not be resolved to a ticker.
                Enter the NSE symbol for each and save to re-upload.
              </p>
              <div className="space-y-2">
                {result.unmapped_names.map((name) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-xs text-amber-800 flex-1 font-medium">{name}</span>
                    <span className="text-xs text-amber-600">→</span>
                    <input
                      type="text"
                      placeholder="NSE symbol e.g. INFY"
                      className="border border-amber-300 rounded px-2 py-1 text-xs w-36 uppercase bg-white"
                      value={mappingInputs[name] ?? ''}
                      onChange={(e) => setMappingInputs((prev) => ({ ...prev, [name]: e.target.value.toUpperCase() }))}
                    />
                  </div>
                ))}
              </div>
              {!mappingsDone ? (
                <button
                  onClick={saveMappings}
                  disabled={savingMappings || !Object.values(mappingInputs).some((v) => v.trim())}
                  className="mt-2 px-4 py-1.5 bg-amber-600 text-white text-xs rounded hover:bg-amber-700 disabled:opacity-50"
                >
                  {savingMappings ? 'Saving…' : 'Save Mappings'}
                </button>
              ) : (
                <p className="text-xs text-green font-medium">Mappings saved. Re-upload your file to import the remaining rows.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
