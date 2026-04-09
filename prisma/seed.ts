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
  console.log('🌱 Seeding database...')

  // 1. Create default admin
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

  // 2. Create default video
  const video = await prisma.video.upsert({
    where: { id: 'default-video' },
    update: {},
    create: {
      id: 'default-video',
      title: 'วิดีโออบรมการขับรถ EV7',
      url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      required_watch_percentage: 95,
      is_active: true,
    },
  })
  console.log('✅ Default video created')

  // 3. Create quiz config
  await prisma.quizConfig.upsert({
    where: { id: 'default-config' },
    update: {},
    create: {
      id: 'default-config',
      pass_score: 80,
      max_attempts: 3,
      num_questions: 10,
    },
  })
  console.log('✅ Quiz config created')

  // 4. Create sample questions
  const questions = [
    {
      question_text: 'ก่อนออกรถควรตรวจสอบอะไรเป็นอันดับแรก?',
      options: JSON.stringify(['ระบบแอร์', 'ระบบเบรกและยาง', 'วิทยุ', 'กระจกมองหลัง']),
      correct_answer: 1,
      order_num: 1,
    },
    {
      question_text: 'เมื่อผู้โดยสารขึ้นรถ สิ่งแรกที่ควรทำคืออะไร?',
      options: JSON.stringify(['เปิดวิทยุ', 'ทักทายและสอบถามจุดหมาย', 'ออกรถทันที', 'ล็อคประตู']),
      correct_answer: 1,
      order_num: 2,
    },
    {
      question_text: 'ความเร็วสูงสุดที่อนุญาตในเขตเมืองคือเท่าไร?',
      options: JSON.stringify(['60 กม./ชม.', '80 กม./ชม.', '90 กม./ชม.', '100 กม./ชม.']),
      correct_answer: 1,
      order_num: 3,
    },
    {
      question_text: 'หากผู้โดยสารลืมของไว้ในรถ ควรทำอย่างไร?',
      options: JSON.stringify(['เก็บไว้เอง', 'แจ้งศูนย์ทันที', 'ทิ้งไป', 'ส่งให้ตำรวจ']),
      correct_answer: 1,
      order_num: 4,
    },
    {
      question_text: 'ข้อใดเป็นมารยาทที่ดีของคนขับแท็กซี่?',
      options: JSON.stringify(['ใช้โทรศัพท์ขณะขับ', 'ปฏิเสธผู้โดยสาร', 'แต่งกายสุภาพ สะอาด', 'เปิดเพลงดังๆ']),
      correct_answer: 2,
      order_num: 5,
    },
    {
      question_text: 'เมื่อฝนตกหนักควรปฏิบัติอย่างไร?',
      options: JSON.stringify(['ขับเร็วเพื่อไปถึงเร็ว', 'ลดความเร็วและเปิดไฟ', 'จอดกลางถนน', 'ขับตามปกติ']),
      correct_answer: 1,
      order_num: 6,
    },
    {
      question_text: 'ค่ามิเตอร์เริ่มต้นของแท็กซี่คือเท่าไร?',
      options: JSON.stringify(['25 บาท', '35 บาท', '40 บาท', '50 บาท']),
      correct_answer: 1,
      order_num: 7,
    },
    {
      question_text: 'หากเกิดอุบัติเหตุ สิ่งแรกที่ควรทำคืออะไร?',
      options: JSON.stringify(['ขับหนี', 'ดูแลผู้บาดเจ็บและแจ้งเหตุ', 'ถ่ายรูปลง Social', 'โทรหาเพื่อน']),
      correct_answer: 1,
      order_num: 8,
    },
    {
      question_text: 'EV7 กำหนดให้ตรวจสภาพรถทุกกี่เดือน?',
      options: JSON.stringify(['ทุก 1 เดือน', 'ทุก 3 เดือน', 'ทุก 6 เดือน', 'ทุก 12 เดือน']),
      correct_answer: 1,
      order_num: 9,
    },
    {
      question_text: 'ข้อใดผิดเกี่ยวกับการชาร์จรถ EV?',
      options: JSON.stringify(['ชาร์จเมื่อแบตต่ำกว่า 20%', 'ใช้สายชาร์จที่กำหนด', 'ชาร์จในที่เปียกน้ำ', 'ถอดสายเมื่อชาร์จเต็ม']),
      correct_answer: 2,
      order_num: 10,
    },
    {
      question_text: 'คนขับ EV7 ต้องพกเอกสารอะไรบ้าง?',
      options: JSON.stringify(['บัตรประชาชนเท่านั้น', 'ใบขับขี่และบัตรประจำตัว EV7', 'หนังสือเดินทาง', 'ไม่ต้องพกอะไร']),
      correct_answer: 1,
      order_num: 11,
    },
    {
      question_text: 'หากมิเตอร์เสีย ควรทำอย่างไร?',
      options: JSON.stringify(['คิดราคาเอง', 'แจ้งศูนย์และหยุดรับผู้โดยสาร', 'ขับต่อไป', 'ต่อรองราคา']),
      correct_answer: 1,
      order_num: 12,
    },
    {
      question_text: 'ระยะทางที่ควรเว้นจากรถคันหน้าคือเท่าไร?',
      options: JSON.stringify(['1 เมตร', '2 วินาที', '5 เมตร', 'ชิดเท่าไรก็ได้']),
      correct_answer: 1,
      order_num: 13,
    },
    {
      question_text: 'หากผู้โดยสารไม่ยอมจ่ายค่าโดยสาร ควรทำอย่างไร?',
      options: JSON.stringify(['ทะเลาะ', 'จดทะเบียนรถแจ้งศูนย์', 'ปล่อยไป', 'ขู่ผู้โดยสาร']),
      correct_answer: 1,
      order_num: 14,
    },
    {
      question_text: 'ข้อใดคือข้อดีของรถ EV เทียบกับรถน้ำมัน?',
      options: JSON.stringify(['เสียงดัง', 'ไม่ปล่อยไอเสีย', 'ค่าซ่อมแพง', 'ชาร์จนาน']),
      correct_answer: 1,
      order_num: 15,
    },
  ]

  for (const q of questions) {
    await prisma.question.upsert({
      where: { id: `q-${q.order_num}` },
      update: { ...q },
      create: { id: `q-${q.order_num}`, ...q },
    })
  }
  console.log(`✅ ${questions.length} questions created`)

  // 5. Create demo drivers
  const drivers = [
    { full_name: 'สมชาย ใจดี', national_id: '1100100100001', date_of_birth: new Date('1985-03-15'), phone: '0812345678' },
    { full_name: 'สมหญิง รักเรียน', national_id: '1100100100002', date_of_birth: new Date('1990-07-22'), phone: '0823456789' },
    { full_name: 'วิชัย เก่งกาจ', national_id: '1100100100003', date_of_birth: new Date('1988-11-30'), phone: '0834567890' },
    { full_name: 'นภา สว่าง', national_id: '1100100100004', date_of_birth: new Date('1992-01-10'), phone: '0845678901' },
    { full_name: 'ประเสริฐ มั่นคง', national_id: '1100100100005', date_of_birth: new Date('1980-06-05'), phone: '0856789012' },
  ]

  for (const d of drivers) {
    await prisma.driver.upsert({
      where: { national_id: d.national_id },
      update: {},
      create: d,
    })
  }
  console.log(`✅ ${drivers.length} demo drivers created`)

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
