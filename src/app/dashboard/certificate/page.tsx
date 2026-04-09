'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Award, Download, QrCode, Loader2, ExternalLink } from 'lucide-react'
import { formatDate, maskNationalId } from '@/lib/utils'

interface CertData {
  certificate_no: string
  score: number
  issued_at: string
  driver_name: string
  national_id: string
}

export default function CertificatePage() {
  const router = useRouter()
  const [cert, setCert] = useState<CertData | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetchCertificate()
  }, [])

  const fetchCertificate = async () => {
    try {
      const res = await fetch('/api/certificate/mine')
      if (res.ok) {
        const data = await res.json()
        setCert(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async () => {
    setDownloading(true)
    try {
      const res = await fetch('/api/certificate/generate')
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `EV7-Certificate-${cert?.certificate_no}.pdf`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error(err)
      alert('เกิดข้อผิดพลาดในการดาวน์โหลด')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-ev7-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!cert) {
    return (
      <div className="max-w-md mx-auto text-center py-12 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
          <Award className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">ยังไม่มี Certificate</h2>
        <p className="text-gray-500 mb-6">คุณต้องสอบผ่านแบบทดสอบก่อนจึงจะได้รับ Certificate</p>
        <button onClick={() => router.push('/dashboard')} className="btn-secondary py-3 px-8">
          กลับแดชบอร์ด
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">ใบ Certificate</h1>
        <p className="text-gray-500 text-sm">ใบรับรองการผ่านการอบรม EV7</p>
      </div>

      {/* Certificate Preview */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ev7-600 via-ev7-500 to-emerald-400 p-8 text-white shadow-2xl">
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -mr-8 -mt-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 -ml-6 -mb-6" />
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xl font-bold">EV7 Training</div>
              <div className="text-sm text-white/70">Certificate of Completion</div>
            </div>
          </div>

          {/* Name */}
          <div className="mb-6">
            <p className="text-white/60 text-xs uppercase tracking-wider mb-1">ชื่อ-นามสกุล</p>
            <p className="text-2xl font-bold">{cert.driver_name}</p>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">เลขบัตรประชาชน</p>
              <p className="font-semibold">{maskNationalId(cert.national_id)}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">คะแนน</p>
              <p className="font-semibold">{Math.round(cert.score)}%</p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">วันที่ออก</p>
              <p className="font-semibold text-sm">{formatDate(cert.issued_at)}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">เลขที่</p>
              <p className="font-semibold text-sm">{cert.certificate_no}</p>
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 text-sm backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
            ใบรับรองถูกต้อง
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={downloadPDF}
          disabled={downloading}
          className="btn-primary w-full py-4 text-lg rounded-2xl"
        >
          {downloading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              กำลังสร้าง PDF...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              ดาวน์โหลด Certificate (PDF)
            </>
          )}
        </button>

        <a
          href={`/verify/${cert.certificate_no}`}
          target="_blank"
          className="btn-secondary w-full py-3 flex items-center justify-center gap-2"
        >
          <QrCode className="w-5 h-5" />
          ตรวจสอบ Certificate
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  )
}
