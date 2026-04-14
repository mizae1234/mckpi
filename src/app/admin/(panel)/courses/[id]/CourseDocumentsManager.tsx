'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud, Trash2, FileText, Download, X } from 'lucide-react'
import { useModal } from '@/components/ModalProvider'

interface DocData {
  id: string
  filename: string
  fileUrl: string
  fileSize: number
  fileType: string
  createdAt: string
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function CourseDocumentsManager({ courseId, initialDocs }: { courseId: string; initialDocs: DocData[] }) {
  const router = useRouter()
  const { showAlert, showConfirm } = useModal()
  const [docs, setDocs] = useState(initialDocs)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/admin/courses/${courseId}/documents`, {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const newDoc = await res.json()
        setDocs(prev => [newDoc, ...prev])
      } else {
        const data = await res.json()
        showAlert({ message: data.error || 'อัปโหลดล้มเหลว', type: 'danger' })
      }
    } catch (err) {
      console.error(err)
      showAlert({ message: 'เกิดข้อผิดพลาดในการอัปโหลด', type: 'danger' })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (docId: string, filename: string) => {
    const ok = await showConfirm({ title: 'ลบเอกสาร', message: `ต้องการลบเอกสาร "${filename}"?`, type: 'danger', confirmText: 'ลบ' })
    if (!ok) return

    try {
      const res = await fetch(`/api/admin/courses/${courseId}/documents?docId=${docId}`, { method: 'DELETE' })
      if (res.ok) {
        setDocs(prev => prev.filter(d => d.id !== docId))
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-3">
      {docs.length === 0 && !uploading && (
        <p className="text-sm text-[var(--color-text-secondary)] py-2">ยังไม่มีเอกสารเพิ่มเติม</p>
      )}

      {docs.map(doc => (
        <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] transition-colors group">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-[var(--color-text)] truncate">{doc.filename}</div>
            <div className="text-xs text-[var(--color-text-secondary)]">
              {formatFileSize(doc.fileSize)} • {new Date(doc.createdAt).toLocaleDateString('th-TH')}
            </div>
          </div>
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all"
            title="ดาวน์โหลด"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={() => handleDelete(doc.id, doc.filename)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
            title="ลบ"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      {uploading && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-primary bg-red-50/50 animate-pulse">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-primary font-medium">กำลังอัปโหลด...</span>
        </div>
      )}

      <label className="w-full p-3 rounded-xl border-2 border-dashed border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer">
        <UploadCloud className="w-4 h-4" />
        อัปโหลดเอกสาร
        <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
      </label>
    </div>
  )
}
