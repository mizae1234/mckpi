'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, EyeOff, CheckCircle2, Archive } from 'lucide-react'
import { useModal } from '@/components/ModalProvider'

export default function CourseStatusToggle({ courseId, currentStatus }: { courseId: string; currentStatus: string }) {
  const router = useRouter()
  const { showConfirm, showAlert } = useModal()
  const [loading, setLoading] = useState(false)

  const updateStatus = async (newStatus: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('อัปเดตสถานะไม่สำเร็จ')
      router.refresh()
    } catch (err) {
      showAlert({ message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', type: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    const confirmed = await showConfirm({
      title: 'เผยแพร่คอร์ส',
      message: 'ต้องการเผยแพร่คอร์สนี้ให้พนักงานเห็น?',
      type: 'info',
      confirmText: 'เผยแพร่',
    })
    if (confirmed) updateStatus('PUBLISHED')
  }

  const handleUnpublish = async () => {
    const confirmed = await showConfirm({
      title: 'ยกเลิกเผยแพร่',
      message: 'ต้องการเปลี่ยนสถานะกลับเป็น Draft?\nพนักงานจะไม่เห็นคอร์สนี้ในระบบ',
      type: 'warning',
      confirmText: 'ยกเลิกเผยแพร่',
    })
    if (confirmed) updateStatus('DRAFT')
  }

  const handleComplete = async () => {
    const confirmed = await showConfirm({
      title: 'ปิดคอร์ส (เสร็จสิ้น)',
      message: 'ต้องการปิดคอร์สนี้?\nคอร์สจะถูกทำเครื่องหมายว่า "เสร็จสิ้น" และจะไม่รับลงทะเบียนเพิ่มอีก',
      type: 'warning',
      confirmText: 'ปิดคอร์ส',
    })
    if (confirmed) updateStatus('COMPLETED')
  }

  const handleReopen = async () => {
    const confirmed = await showConfirm({
      title: 'เปิดคอร์สอีกครั้ง',
      message: 'ต้องการเปลี่ยนสถานะกลับเป็น Published?',
      type: 'info',
      confirmText: 'เปิดใหม่',
    })
    if (confirmed) updateStatus('PUBLISHED')
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-50 text-gray-400 border border-gray-200">
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        กำลังอัปเดต...
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {currentStatus === 'DRAFT' && (
        <button
          onClick={handlePublish}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-all"
        >
          <Globe className="w-4 h-4" />
          เผยแพร่
        </button>
      )}

      {currentStatus === 'PUBLISHED' && (
        <>
          <button
            onClick={handleComplete}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            ปิดคอร์ส
          </button>
          <button
            onClick={handleUnpublish}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all"
          >
            <EyeOff className="w-4 h-4" />
            ยกเลิกเผยแพร่
          </button>
        </>
      )}

      {currentStatus === 'COMPLETED' && (
        <button
          onClick={handleReopen}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-all"
        >
          <Globe className="w-4 h-4" />
          เปิดคอร์สอีกครั้ง
        </button>
      )}

      {currentStatus === 'ARCHIVED' && (
        <button
          onClick={handleReopen}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-all"
        >
          <Archive className="w-4 h-4" />
          กู้คืน
        </button>
      )}
    </div>
  )
}
