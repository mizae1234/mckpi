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
  // ─── 0. CLEAN TRANSACTIONS (For Demo) ──────────────
  console.log('🧹 Cleaning old transactions...')
  await prisma.trainingResult.deleteMany({})
  await prisma.stepProgress.deleteMany({})
  await prisma.quizAttempt.deleteMany({})
  await prisma.courseAssignment.deleteMany({})
  await prisma.offlineRegistration.deleteMany({})
  await prisma.certificate.deleteMany({})
  await prisma.kpiCourse.deleteMany({})
  await prisma.kpi.deleteMany({})
  
  await prisma.question.deleteMany({})
  await prisma.courseStep.deleteMany({})
  await prisma.course.deleteMany({})

  // ─── 1. Admin ──────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10)
  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      name: 'ผู้ดูแลระบบ',
      role: 'SUPER_ADMIN',
    },
  })
  console.log('✅ Admin created (admin / admin123)')

  // ─── 1.5. Branches ──────────────────────────────
  // เก็บ Script สาขาเดิมไว้เผื่อใช้ตอนขึ้น Production
  const productionBranchesData = [
    { code: '5', name: 'โรบินสัน สุขุมวิท' },
    { code: '6', name: 'แมกซ์ แวลู ศรีนครินทร์ (ไดร์ฟ ทรู)' },
    { code: '12', name: 'อิมพีเรียล สำโรง' },
    { code: '16', name: 'มาบุญครอง' },
    { code: '19', name: 'ซีคอน บางแค' },
    { code: '21', name: 'เซ็นทรัล ชลบุรี' },
    { code: '25', name: 'พาต้า ปิ่นเกล้า' },
    { code: '26', name: 'ซีคอน สแควร์ 1' },
    { code: '27', name: 'พหลโยธิน เพลส' },
    { code: '28', name: 'ฟิวเจอร์ พาร์ค รังสิต' },
    { code: '30', name: 'เชียงใหม่ ไนท์บาซ่าร์' },
    { code: '34', name: 'เซ็นเตอร์วัน' },
    { code: '36', name: 'เมเจอร์ ซีเนเพล็กซ์ ปิ่นเกล้า' },
    { code: '39', name: 'เพลินจิต เซ็นเตอร์' },
    { code: '41', name: 'เอส ซี บี พาร์ค' },
    { code: '46', name: 'ภูเก็ต' },
    { code: '48', name: 'สาทรนคร' },
    { code: '49', name: 'รพ.บำรุงราษฎร์' },
    { code: '51', name: 'แพชชั่น ช้อปปิ้ง เดสติเนชั่น ระยอง' },
    { code: '53', name: 'หาดป่าตอง ภูเก็ต' },
    { code: '55', name: 'เซ็นทรัล พระราม 3' },
    { code: '57', name: 'เมเจอร์ซีเนเพล็กซ์ สุขุมวิท 61(เอกมัย)' },
    { code: '60', name: 'เซียร์ รังสิต (ไดร์ฟ ทรู)' },
    { code: '61', name: 'ราชดำเนิน' },
    { code: '62', name: 'บางจาก บางนา - กม.6.5 (ไดร์ฟ ทรู)' },
    { code: '64', name: 'เมเจอร์ซีเนเพล็กซ์ รัชโยธิน' },
    { code: '66', name: 'แปซิฟิค พาร์ค ศรีราชา' },
    { code: '68', name: 'โลตัส ศรีนครินทร์' },
    { code: '69', name: 'ไอที มอลล์ ฟอร์จูน ทาวน์' },
    { code: '70', name: 'พีทีที มอเตอร์เวย์ ฝั่งขาออก' },
    { code: '73', name: 'ลีการ์เด้นส์ หาดใหญ่' },
    { code: '74', name: 'โลตัส พระราม 4' },
    { code: '75', name: 'โลตัส แจ้งวัฒนะ' },
    { code: '76', name: 'โลตัส สุขุมวิท 50 (อ่อนนุช)' },
    { code: '77', name: 'โลตัส หลักสี่' },
    { code: '79', name: 'พีทีที มอเตอร์เวย์ ฝั่งขาเข้า (ไดร์ฟ ทรู)' },
    { code: '81', name: 'เดอะมอลล์ โคราช' },
    { code: '85', name: 'หาดเฉวง เกาะสมุย' },
    { code: '88', name: 'แฟรี่ พลาซ่า ขอนแก่น' },
    { code: '91', name: 'มินิ สยาม (ไดร์ฟ ทรู)' },
    { code: '92', name: 'โลตัส พระราม 3' },
    { code: '94', name: 'โลตัส ประชาชื่น' },
    { code: '96', name: 'พีทีที อยุธยา (ไดร์ฟ ทรู)' },
    { code: '98', name: 'หาดละไม เกาะสมุย' },
    { code: '99', name: 'โลตัส ภูเก็ต' },
    { code: '100', name: 'โลตัส บางกะปิ' },
    { code: '104', name: 'บิ๊กซี ติวานนท์' },
    { code: '107', name: 'กระบี่ 1' },
    { code: '108', name: 'สยามพารากอน 1' },
    { code: '109', name: 'เอสพละนาด รัชดาฯ' },
    { code: '111', name: 'ดิ อเวนิว พัทยา' },
    { code: '115', name: 'ทไวไลท์ ออฟ บางลา ภูเก็ต' },
    { code: '116', name: 'พาซีโอ ลาดกระบัง (ไดร์ฟทรู)' },
    { code: '120', name: 'เฉวง การ์เด้นท์ เกาะสมุย' },
    { code: '121', name: 'โลตัส ทาวน์ อิน ทาวน์' },
    { code: '122', name: 'เยส บางพลี' },
    { code: '124', name: 'แมกซ์ แวลู หลักสี่ (ไดร์ฟทรู)' },
    { code: '126', name: 'แมกซ์ แวลู นวมินทร์ (ไดร์ฟทรู)' },
    { code: '127', name: 'เอ็ม พาร์ค รังสิต คลอง 3 (ไดร์ฟทรู)' },
    { code: '128', name: 'นวมินทร์ ซิตี้ อเวนิว (ไดร์ฟทรู)' },
    { code: '129', name: 'บิ๊กซี เอ็กซ์ตร้า สุขาภิบาล 5 (ไดร์ฟทรู)' },
    { code: '130', name: 'จังซีลอน 1 ป่าตอง ภูเก็ต' },
    { code: '131', name: 'เขาหลัก พลาซ่า พังงา' },
    { code: '132', name: 'เซ็นทรัล ปิ่นเกล้า' },
    { code: '134', name: 'บิ๊กซี เอ๊กซ์ตร้า ลำลูกกา คลอง 4 (ไดร์ฟทรู)' },
    { code: '135', name: 'เอสพละนาด รัตนาธิเบศร์' },
    { code: '136', name: 'ยูดีทาวน์ อุดรธานี (ไดร์ฟทรู)' },
    { code: '137', name: 'เซ็นทรัล ขอนแก่น' },
    { code: '138', name: 'อิมม์ ท่าแพ เชียงใหม่' },
    { code: '140', name: 'พัทยากลาง (ไดร์ฟทรู)' },
    { code: '141', name: 'กาญจนาภิเษก - กัลปพฤกษ์ (ไดร์ฟทรู)' },
    { code: '142', name: 'ราชพฤกษ์ รัตนาธิเบศร์ (ไดร์ฟทรู)' },
    { code: '143', name: 'เดอะเซอร์เคิล ราชพฤกษ์ (ไดร์ฟทรู)' },
    { code: '144', name: 'โลตัส เชิงทะเล ภูเก็ต' },
    { code: '146', name: 'ซูพรีม สามเสน' },
    { code: '147', name: 'เซ็นทรัล เฟสติวัล ภูเก็ต' },
    { code: '148', name: 'เดอะมาร์เก็ต วิลเลจ เขาใหญ่ (ไดร์ฟทรู)' },
    { code: '149', name: 'อมอรินี่ สวนสยาม (ไดร์ฟทรู)' },
    { code: '150', name: 'มีโชค เชียงใหม่ (ไดร์ฟทรู)' },
    { code: '151', name: 'พีทีที พระราม 2 กม.35 (ไดร์ฟทรู)' },
    { code: '152', name: 'แพลททินั่ม โนโวเทล' },
    { code: '153', name: 'เซ็นทรัล เชียงราย' },
    { code: '156', name: 'เดอะไนน์ พระราม 9' },
    { code: '158', name: 'ถนนข้าวสาร 2' },
    { code: '160', name: 'นครชัยศรี นครปฐม (ไดร์ฟทรู)' },
    { code: '161', name: 'เอ็ม พาร์ค พระราม 2 - ท่าข้าม (ไดร์ฟทรู)' },
    { code: '162', name: 'เซ็นทรัล พิษณุโลก' },
    { code: '163', name: 'เซ็นทรัล พระราม 9' },
    { code: '165', name: 'ชิบูญ่า ประตูน้ำ' },
    { code: '166', name: 'พอร์โต้ ชิโน่ พระราม 2 กม.25 (ไดร์ฟทรู)' },
    { code: '168', name: 'เซ็นทรัล อุดรธานี' },
    { code: '169', name: 'ไอบิซ นครศรีธรรมราช (ไดร์ฟทรู)' },
    { code: '170', name: 'เมกา บางนา 1' },
    { code: '171', name: 'เดอะโคสต์ บางนา' },
    { code: '172', name: 'เมก้า วังบูรพา' },
    { code: '173', name: 'ไดอาน่า หาดใหญ่' },
    { code: '174', name: 'กาญจนาภิเษก บางใหญ่ (ไดร์ฟทรู)' },
    { code: '175', name: 'สตาร์ อเวนิว เชียงใหม่ (ไดร์ฟทรู)' },
    { code: '176', name: 'พหลโยธิน วังน้อย อยุธยา (ไดร์ฟทรู)' },
    { code: '178', name: 'แกรนด์ไฟว์ นานา' },
    { code: '179', name: 'หัวหิน มาร์เก็ต วิลเลจ' },
    { code: '180', name: 'เซ็นทรัล ลำปาง' },
    { code: '181', name: 'อุบลสแควร์ (ไดร์ฟทรู)' },
    { code: '182', name: 'ชิค รีพับบลิค ราชพฤกษ์ (ไดร์ฟทรู)' },
    { code: '183', name: 'พาซีโอ สุขาภิบาล 3 (ไดร์ฟทรู)' },
    { code: '186', name: 'พหลโยธิน รังสิต (ไดร์ฟทรู ดูอัลเลน)' },
    { code: '187', name: 'วิคตอเรีย การ์เด้น - เพชรเกษม 69 (ไดร์ฟทรู)' },
    { code: '188', name: 'บีบี บางใหญ่ มาร์เก็ต (ไดร์ฟทรู)' },
    { code: '189', name: 'เอ็ม พาร์ค กาญจนบุรี (ไดร์ฟทรู)' },
    { code: '191', name: 'ราชบุรี เพชรเกษม (ไดร์ฟทรู)' },
    { code: '192', name: 'สตาร์ มหิดล เชียงใหม่ (ไดร์ฟทรู)' },
    { code: '193', name: 'เซ็นทรัล หาดใหญ่' },
    { code: '194', name: 'วีซี พัทยา' },
    { code: '195', name: 'พีทีที นครสวรรค์ (ไดร์ฟทรู)' },
    { code: '196', name: 'พีทีที 345 ฝั่งขาออก (ไดร์ฟทรู)' },
    { code: '197', name: 'หางดง เชียงใหม่ (ไดร์ฟทรู)' },
    { code: '198', name: 'กลาสเฮ้าส์ รัชดา 17 (ไดร์ฟทรู)' },
    { code: '199', name: 'เอ็ม พาร์ค นครสวรรค์ (ไดร์ฟทรู)' },
    { code: '200', name: 'รพ.สวนดอก เชียงใหม่' },
    { code: '203', name: 'นิชดาธานี ปากเกร็ด' },
    { code: '204', name: 'พีทีที 345 ฝั่งขาเข้า (ไดร์ฟทรู)' },
    { code: '207', name: 'เมโทร เวสต์ ทาวน์ กัลปพฤกษ์' },
    { code: '208', name: 'กาดฝรั่ง เชียงใหม่ (ไดร์ฟทรู)' },
    { code: '210', name: 'บางจาก ชะอำ (ไดร์ฟทรู)' },
    { code: '211', name: 'พีทีที วังน้อย อยุธยา ฝั่งขาเข้า (ไดร์ฟทรู)' },
    { code: '212', name: 'พาซีโอ พาร์ค (ไดร์ฟทรู)' },
    { code: '213', name: 'โลตัส หาดใหญ่ (ไดร์ฟทรู)' },
    { code: '214', name: 'โลตัส เลียบด่วนรามอินทรา (ไดร์ฟทรู)' },
    { code: '215', name: 'พีทีที สุพรรณบุรี (ไดร์ฟทรู)' },
    { code: '216', name: 'สวนลุม ไนท์บาซาร์ รัชดา' },
    { code: '217', name: 'เอ็มควอเทียร์' },
    { code: '218', name: 'มาร์เก็ตวิลเลจ สุวรรณภูมิ' },
    { code: '219', name: 'ทิวลิป สแควร์ (ไดร์ฟทรู)' },
    { code: '220', name: 'พีทีที ทุ่งสง (ไดร์ฟทรู)' },
    { code: '222', name: 'อู้ฟู่ ขอนแก่น (ไดร์ฟทรู)' },
    { code: '223', name: 'พัทยา โพสต์ ออฟฟิศ' },
    { code: '224', name: 'ยูเนี่ยนมอลล์' },
    { code: '225', name: 'บางจาก บ้านโพธิ์ 1 ฝั่งขาออก (ไดร์ฟทรู)' },
    { code: '226', name: 'บางจาก ระยอง (ไดร์ฟทรู)' },
    { code: '227', name: 'พีทีที วังมะนาว (ไดร์ฟทรู)' },
    { code: '228', name: 'เสริมไทย คอมเพล็กซ์ มหาสารคาม (ไดร์ฟทรู)' },
    { code: '229', name: 'แกลง ระยอง (ไดร์ฟทรู)' },
    { code: '230', name: 'บิ๊กซี บางพลี (ไดร์ฟทรู)' },
    { code: '231', name: 'บุรีรัมย์ คาสเซิล (ไดร์ฟทรู)' },
    { code: '232', name: 'บิ๊กซี ลพบุรี' },
    { code: '233', name: 'พีทีที นครชัยศรี (ไดร์ฟทรู)' },
    { code: '234', name: 'บูกิส ภูเก็ต (ไดร์ฟทรู)' },
    { code: '235', name: 'บางจาก ปากช่อง (ไดร์ฟทรู)' },
    { code: '238', name: 'เอซี มาร์เก็ต สายไหม' },
    { code: '241', name: 'ถนนนิมมานเหมินทร์ เชียงใหม่' },
    { code: '242', name: 'เดอะเบย์ พัทยา' },
    { code: '244', name: 'เฟิร์ส อเวนิว - ซูเลียน (ไดร์ฟทรู)' },
    { code: '245', name: 'บางจาก บางนา-ตราด กม.17 (ไดร์ฟทรู)' },
    { code: '246', name: 'ริมชายหาด กระบี่' },
    { code: '247', name: 'โรบินสัน ศรีสมาน (ไดร์ฟทรู)' },
    { code: '248', name: 'โชว์ ดีซี พระราม 9' },
    { code: '250', name: 'โรบินสัน เพชรบุรี (ไดร์ฟทรู)' },
    { code: '251', name: 'ฮาร์เบอร์มอลล์ แหลมฉบัง' },
    { code: '252', name: 'พัทยา ซอยบัวขาว' },
    { code: '253', name: 'บางแสน' },
    { code: '254', name: 'เซ็นจูรี่ อ่อนนุช' },
    { code: '255', name: 'บางจาก ชลบุรี บายพาส (ไดร์ฟทรู)' },
    { code: '256', name: 'บางจาก ศรีนครินทร์ (ไดร์ฟทรู)' },
    { code: '258', name: 'พอร์โต้ โก บางปะอิน (ไดร์ฟทรู)' },
    { code: '260', name: 'บิ๊กซี นครปฐม' },
    { code: '261', name: 'ตึกคอม พัทยา' },
    { code: '264', name: 'โลตัส จันทบุรี' },
    { code: '265', name: 'พาลาเดียม' },
    { code: '266', name: 'มาร์เก็ต เพลส ดุสิต' },
    { code: '267', name: 'เชลล์ รามอินทรา (ไดร์ฟทรู)' },
    { code: '268', name: 'วิสซ์ดอม (วัน-โอ-วัน เดอะเทิร์ดเพลส)' },
    { code: '269', name: 'บางจาก วังมะนาว (ไดร์ฟทรู)' },
    { code: '270', name: 'สีลม 64' },
    { code: '271', name: 'แอคทีฟ พาร์ค เมืองทองธานี' },
    { code: '272', name: 'เดอะมอลล์ ท่าพระ' },
    { code: '273', name: 'มาร์เก็ต เพลส ประชาอุทิศ' },
    { code: '274', name: 'มาร์เก็ต เพลส กรุงเทพกรีฑา' },
    { code: '275', name: 'ธนบุรี มาร์เก็ตเพลส' },
    { code: '276', name: 'พีที ศาลายา ถนนบรมราชชนนี' },
    { code: '277', name: 'มหิดล ศาลายา' },
    { code: '278', name: 'บางจาก สระบุรี อินทาวน์' },
    { code: '279', name: 'สุวรรณภูมิ อินเตอร์ แอร์ไซด์ (คอนคอร์ส ดี)' },
    { code: '280', name: 'สุวรรณภูมิ อินเตอร์ แอร์ไซด์ (คอนคอร์ส เอฟ)' },
    { code: '281', name: 'สุวรรณภูมิ แลนด์ไซด์' },
    { code: '283', name: 'ลิโด้พัทยา' },
    { code: '284', name: 'เดอะมอลล์บางกะปิ' },
    { code: '285', name: 'วอล์กกิ้ง สตรีท พัทยา' },
    { code: '286', name: 'เดอะมอลล์ บางแค' },
    { code: '287', name: 'สุวรรณภูมิ อินเตอร์ แอร์ไซด์ (SAT-1)' },
    { code: '288', name: 'สุวรรณภูมิ โดเมสติก แอร์ไซด์' },
    { code: '289', name: 'พีทีที บรมราชชนนี ขาออก' },
    { code: '290', name: 'เลียบคลองสอง' },
    { code: '291', name: 'บิ๊กซี ราชดำริห์ (ชั้น 1)' },
    { code: '292', name: 'จังซีลอน 2 (สาย 3) ป่าตอง ภูเก็ต' },
    { code: '293', name: 'นครธน พระราม 2' },
    { code: '294', name: 'ฮอลิเดย์ อินน์ เอ็กซ์เพรส' },
    { code: '296', name: 'เอส-พาร์ค คลองหลวง (ไดร์ฟทรู)' },
    { code: '298', name: 'เซ็นทรัล บางรัก' },
    { code: '299', name: 'สนามบินเชียงใหม่' },
    { code: '300', name: 'ดอนเมือง อินเตอร์ แอร์ไซด์' },
    { code: '302', name: 'บีบี บิวดิ้ง อโศก' },
    { code: '303', name: 'หาดบางรัก สมุย' },
    { code: '305', name: 'ฟิชเชอร์แมน วิลเลจ เกาะสมุย' },
    { code: '306', name: 'ท็อป กมลา ภูเก็ต' },
    { code: '307', name: 'พระราม 3' },
    { code: '308', name: 'หาดจอมเทียน พัทยา (รร. ซันไลท์)' },
    { code: '309', name: 'สุวินทวงศ์' },
    { code: '310', name: 'พารากอน ซีนีเพล็กซ์ ชั้น 5' },
    { code: '311', name: 'เมเจอร์รังสิต' },
    { code: '312', name: 'บางจาก สุขาภิบาล 3' },
    { code: '313', name: 'สุขุมวิท 11' },
    { code: '314', name: 'หาดราไวย์ ภูเก็ต' },
    { code: '315', name: 'พีทีที เกษตรนวมินทร์' },
    { code: '316', name: 'สุวรรณภูมิ อินเตอร์ แอร์ไซด์ (คอนคอร์ส บี)' },
    { code: '317', name: 'บูกิส พอยด์ พัทยา' },
    { code: '318', name: 'หาดริ้น เกาะพะงัน' },
    { code: '319', name: 'สนามบินภูเก็ต โดเมสติกส์ แอร์ไซด์' },
    { code: '320', name: 'ดอนเมือง โดเมสติก แอร์ไซด์ 2' },
    { code: '10021', name: 'โลตัส อมตะนคร' },
    { code: '10053', name: 'ลา ฟลอร่า ป่าตอง ภูเก็ต' },
    { code: '19400', name: 'บริษัท แมคไทย จำกัด (สำนักงานใหญ่) HR' },
    { code: '40027', name: 'พีทีที วิภาวดีรังสิต ราบ 1' },
  ]

  // สาขาใหม่สำหรับ Development (20 สาขา)
  const devBranchesData = [
    { code: '001', name: 'สาขา สยาม', isHeadOffice: false },
    { code: '002', name: 'สาขา สุขุมวิท', isHeadOffice: false },
    { code: '003', name: 'สาขา สีลม', isHeadOffice: false },
    { code: '004', name: 'สาขา สาทร', isHeadOffice: false },
    { code: '005', name: 'สาขา อโศก', isHeadOffice: false },
    { code: '006', name: 'สาขา รัชดาภิเษก', isHeadOffice: false },
    { code: '007', name: 'สาขา ลาดพร้าว', isHeadOffice: false },
    { code: '008', name: 'สาขา บางนา', isHeadOffice: false },
    { code: '009', name: 'สาขา ปิ่นเกล้า', isHeadOffice: false },
    { code: '010', name: 'สาขา พระราม 9', isHeadOffice: false },
    { code: '011', name: 'สาขา พญาไท', isHeadOffice: false },
    { code: '012', name: 'สาขา เยาวราช', isHeadOffice: false },
    { code: '013', name: 'สาขา ทองหล่อ', isHeadOffice: false },
    { code: '014', name: 'สาขา เอกมัย', isHeadOffice: false },
    { code: '015', name: 'สาขา พร้อมพงษ์', isHeadOffice: false },
    { code: '016', name: 'สาขา พระโขนง', isHeadOffice: false },
    { code: '017', name: 'สาขา อ่อนนุช', isHeadOffice: false },
    { code: '018', name: 'สาขา จตุจักร', isHeadOffice: false },
    { code: '019', name: 'สาขา อนุสาวรีย์ชัยฯ', isHeadOffice: false },
    { code: 'HQ', name: 'สำนักงานใหญ่ (Head Office)', isHeadOffice: true },
  ]

  // ลบข้อมูลสาขาเดิมเพื่อเคลียร์ของเก่า (ปลดล็อก FK ข้อมูลพนักงานก่อน)
  await prisma.employee.deleteMany({})
  await prisma.branch.deleteMany({})

  const activeBranches = devBranchesData // เปลี่ยนเป็น productionBranchesData เมื่อจะขึ้นระบบจริง

  const branchMap: Record<string, string> = {}
  for (const b of activeBranches) {
    const branch = await prisma.branch.upsert({
      where: { code: b.code },
      update: { name: b.name, isHeadOffice: b.isHeadOffice },
      create: { code: b.code, name: b.name, isHeadOffice: b.isHeadOffice },
    })
    branchMap[b.name] = branch.code
  }
  console.log(`✅ ${activeBranches.length} branches created`)

  // ─── 2. Employees ─────────────────────────────────
  const firstNames = ['สมชาย', 'สมหญิง', 'วิชัย', 'นภา', 'ประเสริฐ', 'มาลี', 'ศักดิ์ชัย', 'พรทิพย์', 'สายัณห์', 'สุชาติ', 'วิไล', 'ธิดา', 'ณรงค์', 'วีระ', 'อารีย์']
  const lastNames = ['ใจดี', 'รักเรียน', 'เก่งกาจ', 'สว่างศรี', 'มั่นคง', 'มีสุข', 'สุขสันต์', 'พิทักษ์', 'บุญมา', 'เจริญดี', 'สิงห์คำ', 'อิ่มแจ่ม']
  const branchPositions = [
    { name: 'Barista', level: 2 },
    { name: 'Cashier', level: 2 },
    { name: 'Service Crew', level: 2 },
    { name: 'Shift Supervisor', level: 6 },
    { name: 'Store Manager', level: 10 },
    { name: 'แม่บ้าน / ทำความสะอาด', level: 1 },
  ]
  const hqPositions = [
    { name: 'IT Support', level: 4 },
    { name: 'HR Executive', level: 4 },
    { name: 'Marketing Officer', level: 4 },
    { name: 'Manager', level: 10 },
    { name: 'Director', level: 11 },
  ]
  const departments = ['ฝ่ายปฏิบัติการ', 'ฝ่ายขาย', 'ฝ่าย IT', 'ฝ่ายบุคคล', 'ฝ่ายผลิต']

  const employees: any[] = []
  
  for (let i = 1; i <= 50; i++) {
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    // Give 20% to Head Office
    let randomBranchData
    if (Math.random() < 0.2) {
      randomBranchData = activeBranches.find(b => b.isHeadOffice) || activeBranches[0]
    } else {
      const nonHqBranches = activeBranches.filter(b => !b.isHeadOffice)
      randomBranchData = nonHqBranches[Math.floor(Math.random() * nonHqBranches.length)]
    }
    const randomBranch = randomBranchData.name
    
    // Assign position based on branch type
    let randomPositionObj;
    if (randomBranchData.isHeadOffice) {
      randomPositionObj = hqPositions[Math.floor(Math.random() * hqPositions.length)]
    } else {
      randomPositionObj = branchPositions[Math.floor(Math.random() * branchPositions.length)]
    }

    const randomDepartment = randomBranchData.isHeadOffice 
      ? departments[Math.floor(Math.random() * departments.length)] 
      : 'ปฏิบัติการหน้าร้าน (สาขา)'

    const startYear = 1980
    const endYear = 2000
    const randomYear = Math.floor(Math.random() * (endYear - startYear + 1)) + startYear
    const randomMonth = Math.floor(Math.random() * 12) + 1
    const randomDay = Math.floor(Math.random() * 28) + 1
    const dob = new Date(`${randomYear}-${String(randomMonth).padStart(2, '0')}-${String(randomDay).padStart(2, '0')}`)

    const startYearHire = 2020
    const endYearHire = 2024
    const randomYearHire = Math.floor(Math.random() * (endYearHire - startYearHire + 1)) + startYearHire
    const randomMonthHire = Math.floor(Math.random() * 12) + 1
    const randomDayHire = Math.floor(Math.random() * 28) + 1
    const startDate = new Date(`${randomYearHire}-${String(randomMonthHire).padStart(2, '0')}-${String(randomDayHire).padStart(2, '0')}`)

    employees.push({
      employeeCode: `E${String(i).padStart(5, '0')}`,
      fullName: `${randomFirstName} ${randomLastName}`,
      positionCode: randomPositionObj.name,
      positionLevel: randomPositionObj.level,
      departmentCode: randomDepartment,
      branch: randomBranch,
      dateOfBirth: dob,
      startDate: startDate,
    })
  }

  for (const emp of employees) {
    // Default password = ddmmyyyy of dateOfBirth
    const dob = emp.dateOfBirth
    const dd = String(dob.getDate()).padStart(2, '0')
    const mm = String(dob.getMonth() + 1).padStart(2, '0')
    const yyyy = String(dob.getFullYear())
    const defaultPassword = `${dd}${mm}${yyyy}`
    const passwordHash = await bcrypt.hash(defaultPassword, 10)

    await prisma.employee.upsert({
      where: { employeeCode: emp.employeeCode },
      update: {
        positionCode: emp.positionCode,
        positionLevel: emp.positionLevel,
        branchCode: branchMap[emp.branch],
        departmentCode: emp.departmentCode,
      },
      create: {
        ...emp,
        branch: undefined, // remove string field
        branchCode: branchMap[emp.branch],
        passwordHash: passwordHash,
      },
    })
  }
  console.log(`✅ ${employees.length} employees created`)

  // ─── 3. Courses ────────────────────────────────────
  const onlineCourse = await prisma.course.upsert({
    where: { code: 'CRS-001' },
    update: { 
      title: 'มาตรฐานการบริการและชงเครื่องดื่มเบื้องต้น',
      description: 'เรียนรู้มาตรฐานการต้อนรับลูกค้า การใช้เครื่องชงกาแฟเอสเพรสโซ โดสซิ่ง การสตรีมนม และมาตรฐานสูตรเครื่องดื่ม',
      onboardingDeadlineDays: 14 
    },
    create: {
      code: 'CRS-001',
      title: 'มาตรฐานการบริการและชงเครื่องดื่มเบื้องต้น',
      description: 'เรียนรู้มาตรฐานการต้อนรับลูกค้า การใช้เครื่องชงกาแฟเอสเพรสโซ โดสซิ่ง การสตรีมนม และมาตรฐานสูตรเครื่องดื่ม',
      trainingType: 'ONLINE',
      passScore: 80,
      isMandatory: true,
      onboardingDeadlineDays: 14,
      status: 'PUBLISHED',
    },
  })

  await prisma.course.upsert({
    where: { code: 'CRS-002' },
    update: {
      title: 'สุขอนามัยและความปลอดภัยด้านอาหาร (Food Safety)',
      description: 'มาตรฐานความสะอาดส่วนบุคคล การจัดเก็บวัตถุดิบ (FIFO) การเช็ดล้างฆ่าเชื้อ',
    },
    create: {
      code: 'CRS-002',
      title: 'สุขอนามัยและความปลอดภัยด้านอาหาร (Food Safety)',
      description: 'มาตรฐานความสะอาดส่วนบุคคล การจัดเก็บวัตถุดิบ (FIFO) การเช็ดล้างฆ่าเชื้อ',
      trainingType: 'ONLINE',
      passScore: 70,
      isMandatory: false,
      status: 'PUBLISHED',
    },
  })

  await prisma.course.upsert({
    where: { code: 'CRS-003' },
    update: {
      title: 'ศิลปะการชงกาแฟขั้นสูง และลาเต้อาร์ต (Advanced)',
      description: 'คลาสเรียนเชิงปฏิบัติการ ณ ศูนย์ฝึกอบรม (Head Office) ทดสอบการเทลาย',
    },
    create: {
      code: 'CRS-003',
      title: 'ศิลปะการชงกาแฟขั้นสูง และลาเต้อาร์ต (Advanced)',
      description: 'คลาสเรียนเชิงปฏิบัติการ ณ ศูนย์ฝึกอบรม (Head Office) ทดสอบการเทลาย',
      trainingType: 'OFFLINE',
      passScore: 60,
      isMandatory: true,
      status: 'PUBLISHED',
    },
  })
  console.log('✅ 3 courses created (ONLINE, OFFLINE)')

  // ─── 4. Course Steps (for ONLINE course) ──────────
  const videoStep = await prisma.courseStep.upsert({
    where: { id: 'step-video-1' },
    update: {},
    create: {
      id: 'step-video-1',
      courseId: onlineCourse.id,
      stepType: 'VIDEO',
      title: 'วิดีโอ: ความปลอดภัยเบื้องต้น',
      contentUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      orderIndex: 1,
      isRequired: true,
      minWatchPercent: 95,
    },
  })

  const quizStep = await prisma.courseStep.upsert({
    where: { id: 'step-quiz-1' },
    update: {},
    create: {
      id: 'step-quiz-1',
      courseId: onlineCourse.id,
      stepType: 'QUIZ',
      title: 'แบบทดสอบ: ความปลอดภัย',
      orderIndex: 2,
      isRequired: true,
    },
  })
  console.log('✅ 2 course steps created (VIDEO + QUIZ)')

  // ─── 5. Questions for Quiz Step ───────────────────
  const questions = [
    { questionText: 'อุณหภูมิที่เหมาะสมที่สุดในการสตรีมนมสำหรับเครื่องดื่มร้อนคือเท่าใด?', options: ['40-50 องศาเซลเซียส', '60-65 องศาเซลเซียส', '80-90 องศาเซลเซียส', 'เดือดจนมีฟองปุดๆ'], correctAnswer: 1 },
    { questionText: 'สิ่งที่ควรทำเป็นอันดับแรกเมื่อลูกค้ายื่นบัตรสะสมคะแนนให้คือข้อใด?', options: ['บอกโปรโมชั่น', 'รับออเดอร์ก่อนแล้วค่อยแสกน', 'รับบัตร กล่าวทักทาย และสะสมคะแนนให้ตอนคิดเงิน', 'ปฏิเสธหากสั่งไม่ถึง 100 บาท'], correctAnswer: 2 },
    { questionText: 'หลักการ FIFO (First In First Out) ในการจัดเก็บวัตถุดิบหมายถึงการทำสิ่งใด?', options: ['เก็บของใหญ่ไว้ในสุด', 'นำของที่เข้ามาก่อนมาใช้ก่อนตามวันหมดอายุ', 'ใช้ของใหม่ที่เพิ่งมาส่งก่อนเสมอ', 'ใครเข้ากะก่อนมีสิทธิ์เลือกวัตถุดิบก่อน'], correctAnswer: 1 },
    { questionText: 'ช็อตเอสเพรสโซ่ (Espresso) ที่สกัดออกมาสมบูรณ์ควรมีลักษณะใด?', options: ['น้ำใสๆ จางๆ', 'ไหลเร็วมากภายใน 10 วินาที', 'มีคริมา (Crema) สีน้ำตาลทองอยู่ด้านบน', 'ดำสนิทและมีรสขมจัด'], correctAnswer: 2 },
    { questionText: 'หากมีลูกค้าแพ้นมวัว พนักงานควรเสนอทางเลือกใด?', options: ['แจ้งว่าไม่สามารถขายให้ได้', 'แนะนำให้ใส่น้ำเปล่าแทน', 'แนะนำให้เปลี่ยนเป็นนมอัลมอนด์หรือนมถั่วเหลือง (ธัญพืช)', 'ผสมนมวัวครึ่งหนึ่งให้รสชาติไม่เปลี่ยน'], correctAnswer: 2 },
    { questionText: 'เมื่อทำน้ำเชื่อม (Syrup) หกลงบนพื้น สิ่งแรกที่ควรทำเพื่อความปลอดภัยคืออะไร?', options: ['ปล่อยไว้จนกว่าจะหมดกะ', 'นำป้ายเตือน "ระวังพื้นลื่น" มาตั้ง และเช็ดทำความสะอาดทันที', 'บอกให้พนักงานคนอื่นเดินเลี่ยงไปชั่วคราว', 'รอให้ลูกค้าเดินผ่านไปก่อนแล้วค่อยเช็ด'], correctAnswer: 1 },
    { questionText: 'เวลาทำความสะอาดหัวสตีมนมเครื่องชงกาแฟ (Steam Wand) ควรทำเมื่อใด?', options: ['ทำความสะอาดทันทีทุกครั้งหลังสตรีมนมเสร็จสิ้น', 'ทำความสะอาดก่อนปิดร้านเท่านั้น', 'ทำความสะอาดเมื่อเห็นคราบนมแห้งติด', 'ทำความสะอาดเช้าวันถัดไป'], correctAnswer: 0 },
    { questionText: 'เครื่องดื่มเมนู Americano แตกต่างจาก Latte อย่างไร?', options: ['Americano ผสมนมเยอะกว่า', 'Americano คือช็อตกาแฟผสมน้ำเปล่า ส่วน Latte คือช็อตกาแฟผสมนม', 'Americano ใช้เมล็ดคั่วอ่อนเท่านั้น', 'ไม่มีความแตกต่างในสูตรตั้งต้น'], correctAnswer: 1 },
    { questionText: 'ระยะเวลาสกัด(สับช็อต) เอสเพรสโซเพอร์เฟกต์ช็อต (Perfect Shot) ควรอยู่ประมาณกี่วินาที', options: ['10-15 วินาที', '20-30 วินาที', '45-60 วินาที', 'มากกว่า 1 นาที'], correctAnswer: 1 },
    { questionText: 'ก่อนเสิร์ฟเครื่องดื่ม สิ่งสุดท้ายที่พนักงานต้อนรับควรทำคืออะไร?', options: ['ตรวจดูความสะอาดแก้วและตะโกนเรียกคิวลูกค้า', 'พูดขอบคุณลูกค้าด้วยรอยยิ้มหลังจากส่งมอบเครื่องดื่ม', 'เช็ดเคาน์เตอร์ด้วยกระดาษแห้ง', 'รีบกดช็อตใหม่เตรียมไว้'], correctAnswer: 1 },
  ]

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    await prisma.question.upsert({
      where: { id: `q-${i + 1}` },
      update: { ...q, options: JSON.stringify(q.options), orderNum: i + 1 },
      create: {
        id: `q-${i + 1}`,
        stepId: quizStep.id,
        questionText: q.questionText,
        options: JSON.stringify(q.options),
        correctAnswer: q.correctAnswer,
        orderNum: i + 1,
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
        courseId: offlineCourse.id,
        sessionDate: new Date('2026-05-01T09:00:00'),
        location: 'ห้องประชุม A ชั้น 3',
        capacity: 30,
        trainerName: 'อ.สมศักดิ์ วิชาการ',
      },
    })
    console.log('✅ 1 offline session created')
  }

  // ─── 7. Sample Training Results for Onboarding Report ──
  // Seed ข้อมูลผลอบรมตัวอย่าง เพื่อให้หน้ารายงาน KPI พนักงานใหม่มีข้อมูลแสดง
  const allEmps = await prisma.employee.findMany({
    select: { id: true, employeeCode: true, startDate: true, branchCode: true },
    orderBy: { employeeCode: 'asc' },
  })

  let onboardingResultCount = 0
  for (let i = 0; i < allEmps.length; i++) {
    const emp = allEmps[i]
    // สุ่มให้บางคนมีผล บางคนไม่มี
    const rand = Math.random()
    if (rand < 0.3) continue // 30% ยังไม่ได้อบรม

    const startDate = new Date(emp.startDate)
    let daysAfter: number
    if (rand < 0.55) {
      // 25% อบรมทัน (ภายใน 14 วัน)
      daysAfter = Math.floor(Math.random() * 13) + 1 // 1-13 วัน
    } else if (rand < 0.8) {
      // 25% อบรมพอดี deadline
      daysAfter = 14
    } else {
      // 20% อบรมเกินกำหนด
      daysAfter = Math.floor(Math.random() * 20) + 15 // 15-34 วัน
    }

    const completedAt = new Date(startDate.getTime() + daysAfter * 24 * 60 * 60 * 1000)
    const score = Math.floor(Math.random() * 21) + 80 // 80-100
    const source = i % 5 === 0 ? 'IMPORT' : 'ONLINE' // บางคน Import จาก LMS

    try {
      await prisma.trainingResult.upsert({
        where: {
          employeeId_courseId_source: {
            employeeId: emp.id,
            courseId: onlineCourse.id,
            source: source as any,
          },
        },
        update: {
          status: 'PASSED',
          score,
          completedAt,
        },
        create: {
          employeeId: emp.id,
          courseId: onlineCourse.id,
          source: source as any,
          status: 'PASSED',
          score,
          completedAt,
        },
      })
      onboardingResultCount++
    } catch {
      // skip duplicates
    }
  }
  console.log(`✅ ${onboardingResultCount} onboarding training results seeded`)

  // ─── Print Credentials ─────────────────────────────
  console.log('')
  console.log('📋 === Login Credentials ===')
  console.log('────────────────────────────────────────')
  console.log('🔑 Admin: admin / admin123')
  console.log('')
  const sampleEmployees = employees.slice(0, 5)
  for (const emp of sampleEmployees) {
    const dob = emp.dateOfBirth
    const dd = String(dob.getDate()).padStart(2, '0')
    const mm = String(dob.getMonth() + 1).padStart(2, '0')
    const yyyy = String(dob.getFullYear())
    console.log(`👤 ${emp.fullName}`)
    console.log(`   รหัส: ${emp.employeeCode} / รหัสผ่าน: ${dd}${mm}${yyyy}`)
    console.log(`   แผนก: ${emp.departmentCode} | สาขา: ${emp.branch}`)
    console.log('')
  }
  console.log(`   ... และพนักงานอื่นๆ อีก ${employees.length - 5} คน`)
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
