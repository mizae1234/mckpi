'use client'

import { useState } from 'react'
import { FileUp } from 'lucide-react'
import ImportEmployeeModal from './ImportEmployeeModal'

export default function ImportEmployeeButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="btn-secondary flex items-center gap-2 text-sm font-medium border-gray-300 shadow-sm"
      >
        <FileUp className="w-5 h-5" />
        นำเข้าจาก Excel
      </button>

      {isOpen && (
        <ImportEmployeeModal 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </>
  )
}
