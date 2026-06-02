import { useRef, useState } from 'react'
import clsx from 'clsx'

interface Props {
  accept?: string
  onFile: (file: File) => void
  label?: string
  disabled?: boolean
}

export default function UploadZone({ accept = '.xlsx', onFile, label = 'Drop .xlsx file here, or click to browse', disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <div
      className={clsx(
        'border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors',
        dragging ? 'border-accent bg-accent-light' : 'border-border hover:border-accent-mid',
        disabled && 'opacity-50 pointer-events-none'
      )}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <svg className="w-10 h-10 mx-auto text-ink3 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
      <p className="text-sm text-ink2">{label}</p>
      <p className="text-xs text-ink3 mt-1">M3 model Excel files (.xlsx)</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }}
      />
    </div>
  )
}
