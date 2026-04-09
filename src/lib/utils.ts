import { clsx, ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maskNationalId(id: string): string {
  if (id.length < 4) return '****'
  return id.slice(0, 1) + '-xxxx-xxxxx-' + id.slice(-2) + '-x'
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function generateCertificateNo(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(100000 + Math.random() * 900000)
  return `EV7-${year}-${random}`
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`
}
