import Link from 'next/link'
import { GraduationCap, PlayCircle, ClipboardCheck, Award, ChevronRight, Shield, Users, Zap, BookOpen, BarChart3 } from 'lucide-react'

export default function HomePage() {
  const steps = [
    { icon: <Shield className="w-8 h-8" />, title: 'เข้าสู่ระบบ', desc: 'ใช้รหัสพนักงานเข้าสู่ระบบ' },
    { icon: <PlayCircle className="w-8 h-8" />, title: 'เรียนรู้ Online', desc: 'ดูวิดีโอและเนื้อหาอบรม' },
    { icon: <ClipboardCheck className="w-8 h-8" />, title: 'ทำแบบทดสอบ', desc: 'ทดสอบความรู้ ผ่านเกณฑ์ที่กำหนด' },
    { icon: <Award className="w-8 h-8" />, title: 'รับใบรับรอง', desc: 'ดาวน์โหลด Certificate เมื่อสอบผ่าน' },
  ]

  return (
    <div className="min-h-screen bg-[var(--color-surface-alt)]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-[var(--color-text)]">MKPI</span>
          </div>
          <Link
            href="/login"
            className="btn-primary text-sm py-2 px-4"
          >
            เข้าสู่ระบบ
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 overflow-hidden">
        <div className="gradient-bg min-h-[85vh] flex items-center relative">
          {/* Decorative circles */}
          <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-white/10 blur-sm" />
          <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute top-40 left-1/3 w-40 h-40 rounded-full bg-[var(--color-accent)]/20" />

          <div className="max-w-6xl mx-auto px-4 py-20 relative z-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 text-white text-sm mb-6 backdrop-blur-sm">
                <Zap className="w-4 h-4" />
                <span>ระบบอบรมออนไลน์แบบครบวงจร</span>
              </div>

              <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6">
                MC KPI
                <br />
                <span className="text-[var(--color-accent-light)]">Training System</span>
                <br />
                <span className="text-3xl md:text-4xl font-bold text-white/90">
                  พัฒนาศักยภาพพนักงาน
                </span>
              </h1>

              <p className="text-lg text-white/80 mb-8 leading-relaxed max-w-xl">
                ระบบบริหารจัดการการอบรมพนักงานแบบครบวงจร
                รองรับ Online, Offline และ External Training
                พร้อม KPI Dashboard สำหรับติดตามผล
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 bg-white text-primary font-bold py-4 px-8 rounded-2xl text-lg hover:bg-gray-50 transition-all hover:shadow-xl hover:-translate-y-1"
                >
                  เข้าสู่ระบบเพื่อเริ่มอบรม
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="mt-12 flex items-center gap-8 text-white/70">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span className="text-sm">Online & Offline</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  <span className="text-sm">KPI Tracking</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-4">
              ขั้นตอนการอบรม
            </h2>
            <p className="text-[var(--color-text-secondary)] text-lg max-w-2xl mx-auto">
              เพียง 4 ขั้นตอนง่ายๆ เข้าอบรมออนไลน์ได้ทุกที่ทุกเวลา
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div
                key={i}
                className="relative glass-card p-8 text-center group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {i + 1}
                </div>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 text-primary mb-4 group-hover:bg-red-100 transition-colors">
                  {step.icon}
                </div>
                <h3 className="text-lg font-bold text-[var(--color-text)] mb-2">{step.title}</h3>
                <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="stat-card text-center p-8">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-primary flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">Online Training</h3>
              <p className="text-[var(--color-text-secondary)] text-sm">เรียนผ่านวิดีโอ ทำแบบทดสอบออนไลน์ ดู Progress ได้ตลอด</p>
            </div>
            <div className="stat-card text-center p-8">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">Offline Classroom</h3>
              <p className="text-[var(--color-text-secondary)] text-sm">ลงทะเบียนอบรมในห้องเรียน พร้อมระบบเช็คชื่อ</p>
            </div>
            <div className="stat-card text-center p-8">
              <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">KPI Dashboard</h3>
              <p className="text-[var(--color-text-secondary)] text-sm">ติดตามผลอบรม Completion Rate, Pass Rate ได้แบบ Real-time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="gradient-bg-dark text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold">MKPI</div>
                <div className="text-sm text-white/60">Training Management System</div>
              </div>
            </div>
            <div className="flex gap-6 text-sm text-white/60">
              <Link href="/login" className="hover:text-white transition-colors">เข้าสู่ระบบ</Link>
              <Link href="/admin/login" className="hover:text-white transition-colors">สำหรับผู้ดูแล</Link>
            </div>
            <div className="text-sm text-white/40">
              © {new Date().getFullYear()} MKPI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
