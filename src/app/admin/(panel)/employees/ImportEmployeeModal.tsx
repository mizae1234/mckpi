'use client'

import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, UploadCloud, Download, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ImportEmployeeModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    created: number
    updated: number
    failed: number
    total: number
    errors: string[]
  } | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  if (!isOpen) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
      setErrorMessage('')
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    setErrorMessage('')
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/admin/employees/import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        setResult(data)
      } else {
        setErrorMessage(data.error || 'การนำเข้าล้มเหลว โปรดลองอีกครั้ง')
      }
    } catch (e) {
      setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์')
    } finally {
      setLoading(false)
      // reset file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    if (result) {
      router.refresh() // Refresh page to see changes
    }
    setFile(null)
    setResult(null)
    setErrorMessage('')
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-[var(--color-border)]">
          <h2 className="text-xl font-bold text-[var(--color-text)]">นำเข้าพนักงาน (Excel)</h2>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {!result ? (
            <div className="space-y-6">
              
              {/* Template Download Area */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">การเตรียมไฟล์เพื่อนำเข้า</p>
                  <p className="opacity-90 mb-3">กรุณาอัปเดตข้อมูลพนักงานของคุณในไฟล์ Template ให้ตรงกับรูปแบบที่กำหนด เพื่อให้ระบบนำเข้าได้อย่างถูกต้อง</p>
                  <a 
                    href="/api/admin/employees/import/template" 
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" /> ดาวน์โหลดไฟล์ Template (.xlsx)
                  </a>
                </div>
              </div>

              {/* Upload Area */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  อัปโหลดไฟล์ที่เตรียมไว้
                </label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    file ? 'border-primary bg-red-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                  }`}
                >
                  <input 
                    type="file" 
                    accept=".xlsx, .xls"
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                  />
                  <UploadCloud className={`w-12 h-12 mx-auto mb-3 ${file ? 'text-primary' : 'text-gray-400'}`} />
                  
                  {file ? (
                    <div className="text-[var(--color-text)]">
                      <p className="font-semibold">{file.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                      <button 
                        onClick={() => setFile(null)} 
                        className="text-primary text-sm mt-3 font-medium hover:underline"
                      >
                        เปลี่ยนไฟล์
                      </button>
                    </div>
                  ) : (
                    <div>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-secondary"
                      >
                        กดเลือกไฟล์
                      </button>
                      <p className="mt-2 text-xs text-gray-500">รองรับเฉพาะ .xlsx หรือ .xls</p>
                    </div>
                  )}
                </div>
              </div>

              {errorMessage && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {errorMessage}
                </div>
              )}

            </div>
          ) : (
            // Results View
            <div className="space-y-6">
              <div className="text-center">
                {result.failed === 0 ? (
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                ) : (
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 text-amber-600 rounded-full mb-4">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                )}
                <h3 className="text-lg font-bold">นำเข้าเสร็จสิ้น</h3>
                <p className="text-sm text-gray-500">ประมวลผลทั้งหมด {result.total} แถว</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-center">
                  <span className="block text-2xl font-bold text-green-600">{result.created}</span>
                  <span className="text-xs text-green-800 font-medium">เพิ่มใหม่</span>
                </div>
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
                  <span className="block text-2xl font-bold text-blue-600">{result.updated}</span>
                  <span className="text-xs text-blue-800 font-medium">อัปเดต</span>
                </div>
                <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-center">
                  <span className="block text-2xl font-bold text-red-600">{result.failed}</span>
                  <span className="text-xs text-red-800 font-medium">ไม่สำเร็จ</span>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 mt-4">
                  <h4 className="text-sm font-bold text-red-800 mb-2">ข้อผิดพลาดที่พบ ({result.errors.length} รายการ):</h4>
                  <ul className="text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">
                    {result.errors.map((err, idx) => <li key={idx}>• {err}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[var(--color-border)] bg-gray-50 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={handleClose}
            className="btn-secondary"
            disabled={loading}
          >
            {result ? 'ปิดหน้าต่าง' : 'ยกเลิก'}
          </button>
          {!result && (
            <button 
              type="button"
              onClick={handleUpload}
              className="btn-primary"
              disabled={!file || loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">ประมวลผล...</span>
              ) : 'เริ่มนำเข้าข้อมูล'}
            </button>
          )}
        </div>

      </div>
    </div>,
    document.body
  )
}
