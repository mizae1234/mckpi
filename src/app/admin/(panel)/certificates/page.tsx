import { prisma } from '@/lib/prisma'
import { Award } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CertificatesPage() {
  const certificates = await prisma.certificate.findMany({
    include: {
      employee: { select: { employeeCode: true, fullName: true } },
      course: { select: { code: true, title: true } },
    },
    orderBy: { issuedAt: 'desc' },
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">ใบรับรอง</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">รายการ Certificate ทั้งหมด</p>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>เลขที่</th>
              <th>พนักงาน</th>
              <th>คอร์ส</th>
              <th>คะแนน</th>
              <th>วันที่ออก</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {certificates.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-[var(--color-text-secondary)]">ยังไม่มีใบรับรอง</p>
                </td>
              </tr>
            ) : (
              certificates.map((cert) => (
                <tr key={cert.id}>
                  <td className="font-mono font-semibold text-primary">{cert.certificateNo}</td>
                  <td>
                    <div className="font-medium">{cert.employee.fullName}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">{cert.employee.employeeCode}</div>
                  </td>
                  <td>{cert.course.title}</td>
                  <td className="font-semibold">{cert.score}%</td>
                  <td>{cert.issuedAt.toLocaleDateString('th-TH')}</td>
                  <td>
                    <span className={`badge ${cert.status === 'VALID' ? 'badge-success' : 'badge-danger'}`}>
                      {cert.status === 'VALID' ? 'ใช้งานได้' : 'ถูกเพิกถอน'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
