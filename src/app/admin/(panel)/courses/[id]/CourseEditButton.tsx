'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import CourseEditModal from './CourseEditModal'

export default function CourseEditButton({ course }: { course: { id: string; title: string; description: string; passScore: number; isMandatory: boolean; trainingType: string; kpiIds?: string[] } }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
        title="แก้ไขรายละเอียดคอร์ส"
      >
        <Pencil className="w-4 h-4" />
      </button>

      {showModal && (
        <CourseEditModal course={course} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}
