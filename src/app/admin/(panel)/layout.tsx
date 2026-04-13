'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  BarChart3,
  Award,
  FileSpreadsheet,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Building2,
} from 'lucide-react'
import { useState } from 'react'

const menuGroups = [
  {
    title: 'MAIN',
    items: [
      { href: '/admin', icon: LayoutDashboard, label: 'แดชบอร์ด' },
    ],
  },
  {
    title: 'CORE',
    items: [
      { href: '/admin/employees', icon: Users, label: 'จัดการพนักงาน' },
      { href: '/admin/departments', icon: Building2, label: 'จัดการแผนก' },
    ],
  },
  {
    title: 'TRAINING',
    items: [
      { href: '/admin/courses', icon: BookOpen, label: 'จัดการคอร์ส' },
      { href: '/admin/assignments', icon: ClipboardList, label: 'มอบหมายงาน' },
      { href: '/admin/sessions', icon: CalendarCheck, label: 'รอบอบรม Offline' },
      { href: '/admin/results', icon: BarChart3, label: 'ผลลัพธ์ & Import' },
      { href: '/admin/certificates', icon: Award, label: 'ใบรับรอง' },
    ],
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-alt)]">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-[var(--color-border)] lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-[var(--color-text)]">MKPI</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100">
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {sidebarOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50 animate-fade-in">
            <nav className="p-4 space-y-4">
              {menuGroups.map((group, i) => (
                <div key={i}>
                  <div className="px-4 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {group.title}
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          isActive(item.href)
                            ? 'bg-red-50 text-primary'
                            : 'text-gray-600 hover:bg-[var(--color-sidebar-hover)]'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={() => signOut({ redirectTo: '/admin/login' })}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 w-full"
                >
                  <LogOut className="w-5 h-5" />
                  ออกจากระบบ
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:min-h-screen bg-white border-r border-[var(--color-border)] p-6 sticky top-0">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-[var(--color-text)]">MKPI</div>
              <div className="text-xs text-[var(--color-text-secondary)]">Admin Panel</div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto mt-4">
            <div className="space-y-6">
              {menuGroups.map((group, i) => (
                <div key={i}>
                  {group.title !== 'MENU' && (
                    <div className="px-4 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      {group.title}
                    </div>
                  )}
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          isActive(item.href)
                            ? 'bg-red-50 text-primary shadow-sm'
                            : 'text-gray-600 hover:bg-[var(--color-sidebar-hover)] hover:text-[var(--color-text)]'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          <div className="border-t border-[var(--color-border)] pt-4 mt-4">
            <div className="flex items-center gap-3 px-4 py-2 mb-2">
              <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-sm font-bold">
                {session?.user?.name?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--color-text)] truncate">{session?.user?.name}</div>
                <div className="text-xs text-[var(--color-text-secondary)]">ผู้ดูแลระบบ</div>
              </div>
            </div>
            <button
              onClick={() => signOut({ redirectTo: '/admin/login' })}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
            >
              <LogOut className="w-5 h-5" />
              ออกจากระบบ
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
