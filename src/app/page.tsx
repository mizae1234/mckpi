import Link from 'next/link'
import { Car, PlayCircle, ClipboardCheck, Award, ChevronRight, Shield, Users, Zap } from 'lucide-react'

export default function HomePage() {
  const steps = [
    { icon: <Shield className="w-8 h-8" />, title: 'เข้าสู่ระบบ', desc: 'ใช้เลขบัตรประชาชนและวันเกิดเข้าสู่ระบบ' },
    { icon: <PlayCircle className="w-8 h-8" />, title: 'ดูวิดีโออบรม', desc: 'เรียนรู้กฎระเบียบและวิธีการให้บริการ' },
    { icon: <ClipboardCheck className="w-8 h-8" />, title: 'ทำแบบทดสอบ', desc: 'ทดสอบความรู้ ผ่านเกณฑ์ 80%' },
    { icon: <Award className="w-8 h-8" />, title: 'รับใบ Certificate', desc: 'ดาวน์โหลด Certificate พร้อม QR Code' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">EV7</span>
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
          <div className="absolute top-40 left-1/3 w-40 h-40 rounded-full bg-white/10" />
          
          <div className="max-w-6xl mx-auto px-4 py-20 relative z-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 text-white text-sm mb-6 backdrop-blur-sm">
                <Zap className="w-4 h-4" />
                <span>เปิดรับสมัครคนขับแล้ววันนี้</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6">
                สมัครขับ Taxi
                <br />
                กับ <span className="text-emerald-200">EV7</span>
                <br />
                <span className="text-3xl md:text-5xl font-bold text-white/90">
                  รายได้ดี เริ่มได้ทันที
                </span>
              </h1>
              
              <p className="text-lg text-white/80 mb-8 leading-relaxed max-w-xl">
                เข้าร่วมทีมคนขับ EV7 พร้อมระบบอบรมออนไลน์ที่ทันสมัย 
                เรียนรู้ได้ทุกที่ทุกเวลาผ่านมือถือ
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/login" 
                  className="inline-flex items-center justify-center gap-2 bg-white text-ev7-700 font-bold py-4 px-8 rounded-2xl text-lg hover:bg-gray-50 transition-all hover:shadow-xl hover:-translate-y-1"
                >
                  เข้าสู่ระบบเพื่อเริ่มอบรม
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="mt-12 flex items-center gap-8 text-white/70">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span className="text-sm">คนขับ 500+ คน</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm">ปลอดภัย 100%</span>
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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ขั้นตอนการอบรม
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              เพียง 4 ขั้นตอนง่ายๆ คุณก็พร้อมเป็นคนขับ EV7 มืออาชีพ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div 
                key={i} 
                className="relative glass-card p-8 text-center group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {i + 1}
                </div>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ev7-50 text-ev7-600 mb-4 group-hover:bg-ev7-100 transition-colors">
                  {step.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
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
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">รถ EV ทันสมัย</h3>
              <p className="text-gray-500 text-sm">ขับรถไฟฟ้า EV รุ่นใหม่ล่าสุด ประหยัดค่าใช้จ่าย</p>
            </div>
            <div className="stat-card text-center p-8">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">ระบบอบรมออนไลน์</h3>
              <p className="text-gray-500 text-sm">เรียนรู้ผ่านวิดีโอ ทำแบบทดสอบ รับ Certificate ออนไลน์</p>
            </div>
            <div className="stat-card text-center p-8">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">รายได้มั่นคง</h3>
              <p className="text-gray-500 text-sm">รายได้ดี มีสวัสดิการครบถ้วน พร้อมทีมสนับสนุน</p>
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
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold">EV7</div>
                <div className="text-sm text-white/60">Driver Onboarding System</div>
              </div>
            </div>
            <div className="flex gap-6 text-sm text-white/60">
              <Link href="/login" className="hover:text-white transition-colors">เข้าสู่ระบบ</Link>
              <Link href="/admin/login" className="hover:text-white transition-colors">สำหรับแอดมิน</Link>
            </div>
            <div className="text-sm text-white/40">
              © {new Date().getFullYear()} EV7 Taxi. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
