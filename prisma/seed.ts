import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL!
console.log('Connecting to:', connectionString.replace(/:[^:@]+@/, ':***@'))

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding MKPI Database...')

  // ─── 1. Admin ──────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10)
  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password_hash: adminPassword,
      name: 'ผู้ดูแลระบบ',
      role: 'SUPER_ADMIN',
    },
  })
  console.log('✅ Admin created (admin / admin123)')

  // ─── 2. Employees ─────────────────────────────────
  const employees = [
    {
      employee_code: 'E00001',
      full_name: 'สมชาย ใจดี',
      position: 'พนักงาน',
      department: 'ฝ่ายปฏิบัติการ',
      branch: 'สำนักงานใหญ่',
      date_of_birth: new Date('2000-01-01'),
      start_date: new Date('2024-01-15'),
    },
    {
      employee_code: 'E00002',
      full_name: 'สมหญิง รักเรียน',
      position: 'เจ้าหน้าที่',
      department: 'ฝ่ายขาย',
      branch: 'สาขาเชียงใหม่',
      date_of_birth: new Date('1995-06-15'),
      start_date: new Date('2024-03-01'),
    },
    {
      employee_code: 'E00003',
      full_name: 'วิชัย เก่งกาจ',
      position: 'Programmer',
      department: 'ฝ่าย IT',
      branch: 'สำนักงานใหญ่',
      date_of_birth: new Date('1988-11-22'),
      start_date: new Date('2023-06-01'),
    },
    {
      employee_code: 'E00004',
      full_name: 'นภา สว่างศรี',
      position: 'ผู้จัดการ',
      department: 'ฝ่ายบุคคล',
      branch: 'สำนักงานใหญ่',
      date_of_birth: new Date('1992-03-10'),
      start_date: new Date('2022-01-10'),
    },
    {
      employee_code: 'E00005',
      full_name: 'ประเสริฐ มั่นคง',
      position: 'หัวหน้างาน',
      department: 'ฝ่ายผลิต',
      branch: 'สาขาระยอง',
      date_of_birth: new Date('1985-12-25'),
      start_date: new Date('2020-08-15'),
    },
  ]

  for (const emp of employees) {
    // Default password = ddmmyyyy of date_of_birth
    const dob = emp.date_of_birth
    const dd = String(dob.getDate()).padStart(2, '0')
    const mm = String(dob.getMonth() + 1).padStart(2, '0')
    const yyyy = String(dob.getFullYear())
    const defaultPassword = `${dd}${mm}${yyyy}`
    const passwordHash = await bcrypt.hash(defaultPassword, 10)

    await prisma.employee.upsert({
      where: { employee_code: emp.employee_code },
      update: {},
      create: {
        ...emp,
        password_hash: passwordHash,
      },
    })
  }
  console.log(`✅ ${employees.length} employees created`)

  // ─── 3. Courses ────────────────────────────────────
  const onlineCourse = await prisma.course.upsert({
    where: { code: 'CRS-001' },
    update: {},
    create: {
      code: 'CRS-001',
      title: 'ความปลอดภัยในการทำงาน',
      description: 'หลักสูตรอบรมเรื่องความปลอดภัยในสถานที่ทำงาน พร้อมวิดีโอและแบบทดสอบ',
      training_type: 'ONLINE',
      pass_score: 80,
      is_mandatory: true,
      status: 'PUBLISHED',
    },
  })

  await prisma.course.upsert({
    where: { code: 'CRS-002' },
    update: {},
    create: {
      code: 'CRS-002',
      title: 'พัฒนาทักษะการสื่อสาร',
      description: 'อบรมเชิงปฏิบัติการเรื่องการสื่อสารในองค์กร',
      training_type: 'OFFLINE',
      pass_score: 70,
      is_mandatory: false,
      status: 'PUBLISHED',
    },
  })

  await prisma.course.upsert({
    where: { code: 'CRS-003' },
    update: {},
    create: {
      code: 'CRS-003',
      title: 'Compliance & Ethics (External)',
      description: 'หลักสูตร Compliance จากระบบภายนอก นำเข้าผ่าน Excel',
      training_type: 'EXTERNAL',
      pass_score: 60,
      is_mandatory: true,
      status: 'PUBLISHED',
    },
  })
  console.log('✅ 3 courses created (ONLINE, OFFLINE, EXTERNAL)')

  // ─── 4. Course Steps (for ONLINE course) ──────────
  const videoStep = await prisma.courseStep.upsert({
    where: { id: 'step-video-1' },
    update: {},
    create: {
      id: 'step-video-1',
      course_id: onlineCourse.id,
      step_type: 'VIDEO',
      title: 'วิดีโอ: ความปลอดภัยเบื้องต้น',
      content_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      order_index: 1,
      is_required: true,
      min_watch_percent: 95,
    },
  })

  const quizStep = await prisma.courseStep.upsert({
    where: { id: 'step-quiz-1' },
    update: {},
    create: {
      id: 'step-quiz-1',
      course_id: onlineCourse.id,
      step_type: 'QUIZ',
      title: 'แบบทดสอบ: ความปลอดภัย',
      order_index: 2,
      is_required: true,
    },
  })
  console.log('✅ 2 course steps created (VIDEO + QUIZ)')

  // ─── 5. Questions for Quiz Step ───────────────────
  const questions = [
    { question_text: 'อุปกรณ์ PPE ย่อมาจากอะไร?', options: ['Personal Protective Equipment', 'Private Protection Essentials', 'Public Protection Equipment', 'Primary Protection Element'], correct_answer: 0 },
    { question_text: 'เมื่อเกิดเหตุเพลิงไหม้ สิ่งแรกที่ต้องทำคืออะไร?', options: ['วิ่งหนี', 'กดสัญญาณแจ้งเหตุ', 'ดับเพลิงเอง', 'โทรแจ้งเพื่อน'], correct_answer: 1 },
    { question_text: 'สีแดงบนป้ายความปลอดภัยหมายถึงอะไร?', options: ['ข้อมูลทั่วไป', 'คำเตือน', 'ห้ามกระทำ / อันตราย', 'ปลอดภัย'], correct_answer: 2 },
    { question_text: 'ถังดับเพลิงชนิด CO2 เหมาะกับไฟประเภทใด?', options: ['ไม้ กระดาษ', 'น้ำมัน ไขมัน', 'อุปกรณ์ไฟฟ้า', 'โลหะ'], correct_answer: 2 },
    { question_text: 'ข้อใดคือหลัก 5ส ในที่ทำงาน?', options: ['สะสาง สะดวก สะอาด สุขลักษณะ สร้างนิสัย', 'สวย สะอาด สดใส สุข สำเร็จ', 'เสียง สี สัมผัส สุข สงบ', 'สร้าง ส่ง เสริม สอน สั่ง'], correct_answer: 0 },
    { question_text: 'เครื่องหมาย ☣️ หมายถึงอะไร?', options: ['สารเคมี', 'กัมมันตรังสี', 'อันตรายทางชีวภาพ', 'ไฟฟ้าแรงสูง'], correct_answer: 2 },
    { question_text: 'ข้อใดเป็นการปฏิบัติที่ถูกต้องเมื่อยกของหนัก?', options: ['ก้มหลังยก', 'ย่อเข่าแล้วยก', 'บิดตัวยก', 'ยกด้วยมือข้างเดียว'], correct_answer: 1 },
    { question_text: 'ทางหนีไฟควรตรวจสอบทุกกี่เดือน?', options: ['1 เดือน', '3 เดือน', '6 เดือน', '12 เดือน'], correct_answer: 0 },
    { question_text: 'หากพบสายไฟชำรุด ควรทำอย่างไร?', options: ['ใช้เทปพันไว้', 'แจ้งหัวหน้างานทันที', 'ถอดปลั๊กแล้วใช้ต่อ', 'ไม่ต้องทำอะไร'], correct_answer: 1 },
    { question_text: 'การฝึกซ้อมอพยพหนีไฟควรจัดทุกปีอย่างน้อยกี่ครั้ง?', options: ['1 ครั้ง', '2 ครั้ง', '4 ครั้ง', 'ไม่จำเป็นต้องจัด'], correct_answer: 0 },
  ]

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    await prisma.question.upsert({
      where: { id: `q-${i + 1}` },
      update: { ...q, options: JSON.stringify(q.options), order_num: i + 1 },
      create: {
        id: `q-${i + 1}`,
        step_id: quizStep.id,
        question_text: q.question_text,
        options: JSON.stringify(q.options),
        correct_answer: q.correct_answer,
        order_num: i + 1,
      },
    })
  }
  console.log(`✅ ${questions.length} questions created for quiz step`)

  // ─── 6. Offline Session ────────────────────────────
  const offlineCourse = await prisma.course.findUnique({ where: { code: 'CRS-002' } })
  if (offlineCourse) {
    await prisma.offlineSession.upsert({
      where: { id: 'session-1' },
      update: {},
      create: {
        id: 'session-1',
        course_id: offlineCourse.id,
        session_date: new Date('2026-05-01T09:00:00'),
        location: 'ห้องประชุม A ชั้น 3',
        capacity: 30,
        trainer_name: 'อ.สมศักดิ์ วิชาการ',
      },
    })
    console.log('✅ 1 offline session created')
  }

  // ─── Print Credentials ─────────────────────────────
  console.log('')
  console.log('📋 === Login Credentials ===')
  console.log('────────────────────────────────────────')
  console.log('🔑 Admin: admin / admin123')
  console.log('')
  for (const emp of employees) {
    const dob = emp.date_of_birth
    const dd = String(dob.getDate()).padStart(2, '0')
    const mm = String(dob.getMonth() + 1).padStart(2, '0')
    const yyyy = String(dob.getFullYear())
    console.log(`👤 ${emp.full_name}`)
    console.log(`   รหัส: ${emp.employee_code} / รหัสผ่าน: ${dd}${mm}${yyyy}`)
    console.log(`   แผนก: ${emp.department} | สาขา: ${emp.branch}`)
    console.log('')
  }
  console.log('────────────────────────────────────────')
  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
