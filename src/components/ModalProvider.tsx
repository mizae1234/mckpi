'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, X, Trash2 } from 'lucide-react'

// ─── Types ───────────────────────────────────────────
type ModalType = 'info' | 'success' | 'warning' | 'danger'

interface AlertOptions {
  title?: string
  message: string
  type?: ModalType
  confirmText?: string
}

interface ConfirmOptions {
  title?: string
  message: string
  type?: ModalType
  confirmText?: string
  cancelText?: string
}

interface ModalContextType {
  showAlert: (options: AlertOptions) => Promise<void>
  showConfirm: (options: ConfirmOptions) => Promise<boolean>
}

// ─── Context ─────────────────────────────────────────
const ModalContext = createContext<ModalContextType | null>(null)

export function useModal() {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used within ModalProvider')
  return ctx
}

// ─── Style Helpers ───────────────────────────────────
const iconMap: Record<ModalType, ReactNode> = {
  info: <Info className="w-6 h-6 text-blue-500" />,
  success: <CheckCircle2 className="w-6 h-6 text-green-500" />,
  warning: <AlertTriangle className="w-6 h-6 text-amber-500" />,
  danger: <Trash2 className="w-6 h-6 text-red-500" />,
}

const iconBgMap: Record<ModalType, string> = {
  info: 'bg-blue-50',
  success: 'bg-green-50',
  warning: 'bg-amber-50',
  danger: 'bg-red-50',
}

const confirmBtnMap: Record<ModalType, string> = {
  info: 'bg-blue-600 hover:bg-blue-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  warning: 'bg-amber-500 hover:bg-amber-600 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
}

// ─── Provider ────────────────────────────────────────
export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<{
    mode: 'alert' | 'confirm'
    title: string
    message: string
    type: ModalType
    confirmText: string
    cancelText: string
    resolve: (value: boolean) => void
  } | null>(null)

  const showAlert = useCallback((options: AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      setModal({
        mode: 'alert',
        title: options.title || 'แจ้งเตือน',
        message: options.message,
        type: options.type || 'info',
        confirmText: options.confirmText || 'ตกลง',
        cancelText: '',
        resolve: () => resolve(),
      })
    })
  }, [])

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setModal({
        mode: 'confirm',
        title: options.title || 'ยืนยันการดำเนินการ',
        message: options.message,
        type: options.type || 'warning',
        confirmText: options.confirmText || 'ยืนยัน',
        cancelText: options.cancelText || 'ยกเลิก',
        resolve,
      })
    })
  }, [])

  const handleClose = (result: boolean) => {
    modal?.resolve(result)
    setModal(null)
  }

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* ─── Modal Overlay ─── */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => handleClose(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'modalPop 0.2s ease-out' }}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-2 flex items-start gap-4">
              <div className={`flex-shrink-0 w-11 h-11 rounded-xl ${iconBgMap[modal.type]} flex items-center justify-center`}>
                {iconMap[modal.type]}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h3 className="font-bold text-[var(--color-text)] text-base">{modal.title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1 whitespace-pre-line leading-relaxed">
                  {modal.message}
                </p>
              </div>
              <button
                onClick={() => handleClose(false)}
                className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg text-gray-400 -mt-1 -mr-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex justify-end gap-2 mt-2">
              {modal.mode === 'confirm' && (
                <button
                  onClick={() => handleClose(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-gray-50 transition-colors"
                >
                  {modal.cancelText}
                </button>
              )}
              <button
                onClick={() => handleClose(true)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${confirmBtnMap[modal.type]}`}
                autoFocus
              >
                {modal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes modalPop {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </ModalContext.Provider>
  )
}
