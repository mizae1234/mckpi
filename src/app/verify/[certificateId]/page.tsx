import { prisma } from '@/lib/prisma'
import { maskNationalId, formatDate } from '@/lib/utils'
import { Car, CheckCircle2, XCircle, Award, Calendar, Hash, User, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function VerifyPage({ params }: { params: Promise<{ certificateId: string }> }) {
  const { certificateId } = await params

  const cert = await prisma.certificate.findUnique({
    where: { certificate_no: certificateId },
    include: { driver: { select: { full_name: true, national_id: true } } },
  })

  const isValid = cert && cert.status === 'VALID'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">EV7</span>
          </Link>
          <p className="text-gray-500 text-sm mt-2">ตรวจสอบใบ Certificate</p>
        </div>

        {/* Result Card */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden animate-fade-in">
          {/* Status Banner */}
          <div className={`p-6 text-center ${isValid ? 'gradient-bg' : 'bg-red-500'}`}>
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
              {isValid ? (
                <CheckCircle2 className="w-8 h-8 text-white" />
              ) : (
                <XCircle className="w-8 h-8 text-white" />
              )}
            </div>
            <h2 className="text-xl font-bold text-white">
              {isValid ? 'ใบรับรองถูกต้อง ✓' : 'ไม่พบใบรับรอง ✗'}
            </h2>
            <p className="text-white/80 text-sm mt-1">
              {isValid ? 'Certificate is Valid' : cert?.status === 'REVOKED' ? 'Certificate has been Revoked' : 'Certificate not found'}
            </p>
          </div>

          {/* Details */}
          {cert && (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-ev7-50 flex items-center justify-center">
                  <User className="w-5 h-5 text-ev7-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">ชื่อ-นามสกุล</p>
                  <p className="font-semibold text-gray-900">{cert.driver.full_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Hash className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">เลขบัตรประชาชน</p>
                  <p className="font-semibold text-gray-900">{maskNationalId(cert.driver.national_id)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">คะแนนสอบ</p>
                  <p className="font-semibold text-gray-900">{Math.round(cert.score)}%</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">วันที่ออกใบรับรอง</p>
                  <p className="font-semibold text-gray-900">{formatDate(cert.issued_at)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                  <Award className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">เลขที่ Certificate</p>
                  <p className="font-semibold text-gray-900 font-mono">{cert.certificate_no}</p>
                </div>
              </div>
            </div>
          )}

          {!cert && (
            <div className="p-6 text-center">
              <p className="text-gray-500">ไม่พบ Certificate หมายเลข</p>
              <p className="font-mono text-gray-700 font-semibold mt-1">{certificateId}</p>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
            ← กลับหน้าแรก EV7
          </Link>
        </div>
      </div>
    </div>
  )
}
