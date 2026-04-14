'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import CreateSessionModal from './CreateSessionModal'

export default function CreateSessionButton() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button onClick={() => setShowModal(true)} className="btn-primary">
        <Plus className="w-5 h-5" />
        สร้างรอบอบรม
      </button>
      {showModal && <CreateSessionModal onClose={() => setShowModal(false)} />}
    </>
  )
}
