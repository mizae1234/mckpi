'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, FileSpreadsheet, Calendar, BookOpen, UserCircle, Briefcase, RefreshCcw } from 'lucide-react'
import { useModal } from '@/components/ModalProvider'

export default function ResultsFilterClient({
  kpis,
}: {
  kpis: { id: string; code: string; name: string; year: number }[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showAlert } = useModal()

  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [courseSearch, setCourseSearch] = useState(searchParams.get('courseQ') || '')
  const [kpiId, setKpiId] = useState(searchParams.get('kpiId') || '')
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '')
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '')
  const [trainingType, setTrainingType] = useState(searchParams.get('type') || '')
  const [isMandatory, setIsMandatory] = useState(searchParams.get('mandatory') || '')
  const [selectedYear, setSelectedYear] = useState(searchParams.get('year') || '')

  const uniqueYears = Array.from(new Set(kpis.map(k => k.year).filter(Boolean))).sort((a, b) => b - a)
  const filteredKpis = selectedYear ? kpis.filter(k => k.year && k.year.toString() === selectedYear) : kpis

  const buildQuery = () => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (courseSearch) params.set('courseQ', courseSearch)
    if (kpiId) params.set('kpiId', kpiId)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    if (trainingType) params.set('type', trainingType)
    if (isMandatory) params.set('mandatory', isMandatory)
    if (selectedYear) params.set('year', selectedYear)
    return params.toString()
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = buildQuery()
    router.push(`/admin/results${query ? `?${query}` : ''}`)
  }

  const handleReset = () => {
    setSearch('')
    setCourseSearch('')
    setKpiId('')
    setStartDate('')
    setEndDate('')
    setTrainingType('')
    setIsMandatory('')
    setSelectedYear('')
    router.push('/admin/results')
  }

  const [importing, setImporting] = useState(false)

  const handleDownloadTemplate = () => {
    window.open('/api/admin/results/template', '_blank')
  }

  const handleExport = () => {
    const query = buildQuery()
    // Open in new tab so it downloads natively
    window.open(`/api/admin/results/export${query ? `?${query}` : ''}`, '_blank')
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/admin/results/import', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        await showAlert({
          title: 'สำเร็จ',
          message: `นำเข้าข้อมูลสำเร็จแล้ว ${data.importedCount} รายการ!\n${data.errors ? '\nพบข้อผิดพลาดบางจุด (ข้ามรายการเหล่านั้นไป):\n' + data.errors.slice(0, 5).join('\n') : ''}`,
          type: 'success'
        })
        router.refresh()
      } else {
        await showAlert({ title: 'ข้อผิดพลาด', message: 'เกิดข้อผิดพลาด: ' + data.error, type: 'danger' })
      }
    } catch (err) {
      await showAlert({ title: 'ข้อผิดพลาด', message: 'Network error', type: 'danger' })
    } finally {
      setImporting(false)
      // Reset input
      e.target.value = ''
    }
  }

  return (
    <form onSubmit={handleSearch} className="bg-white p-5 rounded-2xl border border-[var(--color-border)] shadow-sm space-y-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-[var(--color-text)] flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          คัดกรองข้อมูล
        </h3>
        <div className="flex gap-2">
          <button type="button" onClick={handleReset} className="btn-secondary text-sm px-3 py-1.5 gap-1">
            <RefreshCcw className="w-4 h-4" />
            ล้างค่า
          </button>
          
          <div className="relative">
            <input 
              type="file" 
              accept=".xlsx, .xls"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              disabled={importing}
            />
            <button type="button" disabled={importing} className="btn-primary bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 text-sm px-3 py-1.5 gap-1 shadow-sm">
              <FileSpreadsheet className="w-4 h-4" />
              {importing ? 'กำลังประมวลผล...' : 'Import'}
            </button>
          </div>

          <button type="button" onClick={handleDownloadTemplate} className="btn-secondary text-sm px-3 py-1.5 gap-1 shadow-sm opacity-80 hover:opacity-100" title="โหลดแบบฟอร์มนำเข้า">
            <FileSpreadsheet className="w-4 h-4" />
            Template
          </button>

          <button type="button" onClick={handleExport} className="btn-accent text-sm px-3 py-1.5 gap-1 border border-green-600 shadow-sm">
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Import Format Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm space-y-3">
        <div className="font-bold text-blue-800 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          คู่มือการ Import Excel — รูปแบบที่ระบบรองรับ
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-semibold text-blue-700 mb-1.5">📋 คอลัมน์ที่จำเป็น (ชื่อต้องตรงทุกตัวอักษร)</p>
            <div className="overflow-auto rounded-lg border border-blue-200">
              <table className="text-xs text-blue-900 w-full border-collapse">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="text-left px-2 py-1.5 border-b border-blue-200">ชื่อคอลัมน์</th>
                    <th className="text-left px-2 py-1.5 border-b border-blue-200">ตัวอย่าง</th>
                    <th className="text-left px-2 py-1.5 border-b border-blue-200">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  <tr><td className="px-2 py-1.5 font-mono font-bold">รหัสพนักงาน</td><td className="px-2 py-1.5 font-mono">EMP-001</td><td className="px-2 py-1.5">ต้องตรงกับในระบบ</td></tr>
                  <tr className="bg-white/50"><td className="px-2 py-1.5 font-mono font-bold">รหัสหลักสูตร</td><td className="px-2 py-1.5 font-mono">CRS-001</td><td className="px-2 py-1.5">ต้องตรงกับในระบบ</td></tr>
                  <tr><td className="px-2 py-1.5 font-mono font-bold">สถานะ</td><td className="px-2 py-1.5 font-mono text-emerald-700">ผ่าน</td><td className="px-2 py-1.5">ดูค่าที่รองรับ →</td></tr>
                  <tr className="bg-white/50"><td className="px-2 py-1.5 font-mono font-bold">วันที่สำเร็จ</td><td className="px-2 py-1.5 font-mono text-blue-700">1/4/2568</td><td className="px-2 py-1.5">วัน/เดือน/ปี <strong>พ.ศ.</strong></td></tr>
                  <tr><td className="px-2 py-1.5 font-mono">คะแนนแบบทดสอบ</td><td className="px-2 py-1.5 font-mono">85</td><td className="px-2 py-1.5">0-100 (ไม่บังคับ)</td></tr>
                  <tr className="bg-white/50"><td className="px-2 py-1.5 font-mono">คะแนน Pretest</td><td className="px-2 py-1.5 font-mono">70</td><td className="px-2 py-1.5">ไม่บังคับ</td></tr>
                  <tr><td className="px-2 py-1.5 font-mono">คะแนน Posttest</td><td className="px-2 py-1.5 font-mono">90</td><td className="px-2 py-1.5">ไม่บังคับ</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-blue-700 mb-1.5">✅ ค่าคอลัมน์ &quot;สถานะ&quot; ที่รองรับ</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded font-bold font-mono min-w-[60px] text-center">ผ่าน</span>
                  <span className="text-blue-800">→ สอบผ่าน / อบรมสำเร็จ (PASSED)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded font-bold font-mono min-w-[60px] text-center">ไม่ผ่าน</span>
                  <span className="text-blue-800">→ สอบไม่ผ่าน (FAILED)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded font-bold font-mono min-w-[60px] text-center">(ว่าง)</span>
                  <span className="text-blue-800">→ กำลังดำเนินการ (IN_PROGRESS)</span>
                </div>
              </div>
            </div>
            <div>
              <p className="font-semibold text-blue-700 mb-1.5">📅 รูปแบบวันที่ (ใส่เป็น พ.ศ. — ระบบแปลงเอง)</p>
              <div className="text-xs text-blue-800 space-y-1 bg-white/60 rounded-lg p-2.5 border border-blue-200">
                <div>✅ <span className="font-mono bg-white px-1 rounded border border-blue-200">1/4/2568</span> — วัน/เดือน/ปี พ.ศ.</div>
                <div>✅ <span className="font-mono bg-white px-1 rounded border border-blue-200">01/04/2568</span> — มีศูนย์นำหน้า</div>
                <div>✅ <span className="font-mono bg-white px-1 rounded border border-blue-200">2568-04-01</span> — แบบ ISO ปี พ.ศ.</div>
                <div className="pt-1 text-blue-600 font-medium">⚠️ ระบบตรวจว่าถ้าปี ≥ 2400 จะแปลงเป็น ค.ศ. อัตโนมัติ<br/>เช่น 2568 → 2025</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Row 1 */}
        <div className="relative">
          <label className="block text-xs font-semibold text-gray-500 mb-1">ค้นหาพนักงาน</label>
          <div className="relative">
            <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="รหัส, ชื่อ-สกุล, สาขา, ตำแหน่ง..." 
              className="input-field pl-9 w-full text-sm py-2"
            />
          </div>
        </div>

        <div className="relative">
          <label className="block text-xs font-semibold text-gray-500 mb-1">ค้นหาหลักสูตร</label>
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={courseSearch} 
              onChange={e => setCourseSearch(e.target.value)} 
              placeholder="รหัส หรือ ชื่อหลักสูตร..." 
              className="input-field pl-9 w-full text-sm py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">ปีประเมิน KPI (Year)</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select 
              value={selectedYear} 
              onChange={e => { setSelectedYear(e.target.value); setKpiId('') }} 
              className="input-field pl-9 w-full text-sm py-2"
            >
              <option value="">-- ทุกปี --</option>
              {uniqueYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">KPI ที่เกี่ยวข้อง</label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select 
              value={kpiId} 
              onChange={e => setKpiId(e.target.value)} 
              className="input-field pl-9 w-full text-sm py-2"
            >
              <option value="">-- ทุก KPI --</option>
              {filteredKpis.map(kpi => (
                <option key={kpi.id} value={kpi.id}>[{kpi.code}] {kpi.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2 */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">ประเภทการอบรม</label>
          <select 
            value={trainingType} 
            onChange={e => setTrainingType(e.target.value)} 
            className="input-field w-full text-sm py-2"
          >
            <option value="">-- ทุกประเภท --</option>
            <option value="ONLINE">Online</option>
            <option value="OFFLINE">Classroom (Offline)</option>
            <option value="EXTERNAL">External</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">สถานะบังคับเรียน</label>
          <select 
            value={isMandatory} 
            onChange={e => setIsMandatory(e.target.value)} 
            className="input-field w-full text-sm py-2"
          >
            <option value="">-- ทั้งหมด --</option>
            <option value="true">หลักสูตรบังคับ</option>
            <option value="false">เลือกเรียน (ไม่บังคับ)</option>
          </select>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 mb-1">ตั้งแต่วันที่</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className="input-field pl-9 w-full text-sm py-2"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 mb-1">ถึงวันที่</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                className="input-field pl-9 w-full text-sm py-2"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-[var(--color-border)] mt-4">
        <button type="submit" className="btn-primary w-full md:w-auto px-8 py-2">
          ค้นหาข้อมูล
        </button>
      </div>
    </form>
  )
}
