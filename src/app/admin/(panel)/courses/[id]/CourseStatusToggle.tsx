'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, EyeOff } from 'lucide-react'
import { useModal } from '@/components/ModalProvider'

export default function CourseStatusToggle({ courseId, currentStatus }: { courseId: string; currentStatus: string }) {
  const router = useRouter()
  const { showConfirm, showAlert } = useModal()
  const [loading, setLoading] = useState(false)

  const isPublished = currentStatus === 'PUBLISHED'

  const handleToggle = async () => {
    const newStatus = isPublished ? 'DRAFT' : 'PUBLISHED'
    const confirmed = await showConfirm({
      title: isPublished ? 'ยกเลิกเผยแพร่' : 'เผยแพร่คอร์ส',
      message: isPublished
        ? 'ต้องการเปลี่ยนสถานะกลับเป็น Draft?\nพนักงานจะไม่เห็นคอร์สนี้ในระบบ'
        : 'ต้องการเผยแพร่คอร์สนี้ให้พนักงานเห็น?',
      type: isPublished ? 'warning' : 'info',
      confirmText: isPublished ? 'ยกเลิกเผยแพร่' : 'เผยแพร่',
    })
    if (!confirmed) return

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

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        isPublished
          ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
          : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
      }`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isPublished ? (
        <EyeOff className="w-4 h-4" />
      ) : (
        <Globe className="w-4 h-4" />
      )}
      {isPublished ? 'ยกเลิกเผยแพร่' : 'เผยแพร่'}
    </button>
  )
}
