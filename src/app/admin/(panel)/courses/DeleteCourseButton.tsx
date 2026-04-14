'use client'

import { Trash2 } from 'lucide-react'
import { useModal } from '@/components/ModalProvider'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteCourseButton({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const router = useRouter()
  const { showConfirm, showAlert } = useModal()
  const [loading, setLoading] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const ok = await showConfirm({
      title: 'ลบคอร์ส',
      message: `ต้องการลบคอร์ส "${courseTitle}" ใช่หรือไม่?\nข้อมูลทั้งหมดที่เกี่ยวข้อง (ขั้นตอน, เอกสาร) จะถูกลบไปด้วย`,
      type: 'danger',
      confirmText: 'ลบข้อมูล'
    })

    if (!ok) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('ลบไม่สำเร็จ')
      router.refresh()
    } catch (err) {
      showAlert({ message: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด', type: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors ${
        loading ? 'text-gray-400 bg-gray-50' : 'text-red-600 hover:bg-red-50 hover:text-red-700'
      }`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
      ) : (
        <Trash2 className="w-4 h-4 flex-shrink-0" />
      )}
      {loading ? 'กำลังลบ...' : 'ลบหลักสูตร'}
    </button>
  )
}
