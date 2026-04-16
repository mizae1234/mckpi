# MKPI Training System: AI Developer Skills & Guidelines

*This document serves as the "Skill" and "Context Knowledge" for AI assistants working on the `mckpi` project. Please read these rules and flow logic carefully before writing or modifying code in this codebase. Do not mix context from other projects.*

---

## 1. Authentication System
ระบบใช้ **Auth.js (NextAuth v5)** โดยแบ่งการล็อคอินออกเป็น 2 บทบาทอย่างชัดเจน (`Credentials` provider 2 ตัว):
- **Admin**: ล็อคอินด้วย Username / Password
- **Employee**: ล็อคอินด้วย รหัสพนักงาน (`employee_code`) และรหัสผ่านซึ่ง Default ค่าเริ่มต้นคือ **วันเดือนปีเกิด (DDMMYYYY)** 
- **ไฟล์สำคัญ**: 
  - `src/lib/auth.ts`: รวม Configuration ให้บริการ Session 
  - `src/lib/auth-edge.ts`, `src/middleware.ts`: สำหรับปกป้องเส้นทางหน้าเว็บ (Admin vs Employee)

## 2. Database Schema (Prisma) โครงสร้างหลัก
1. **Users**: `Employee` และ `Admin`
2. **Course Content**: `Course` (1) -> `CourseStep` (M) -> `Question` (M)
   - `StepType`: 'VIDEO', 'DOCUMENT', 'QUIZ', 'PRETEST', 'POSTTEST'
3. **Training Activity**: 
   - `CourseAssignment`: ตารางคุมการมอบหมายงานให้พนักงาน (มีกำหนดส่ง `due_date`)
   - `OfflineSession` & `OfflineRegistration`: รองรับการจัดคอร์สแบบสอนสด มีการรับลงทะเบียนและการเช็คอินเข้าร่วม
4. **Tracking & Progress (ตารางบันทึกการเรียน)**:
   - `StepProgress`: เก็บสถานะการดูวิดีโอ (`watch_percent`) ว่าดูถึงกี่เปอร์เซ็นแล้ว
   - `QuizAttempt`: เก็บประวัติการทำข้อสอบ (รวมถึงตัวเลือกที่ตอบ และคะแนนที่ได้)
   - `TrainingResult` และ `Certificate`: ระบบผลลัพธ์และใบรับรองเมื่อจบการศึกษาแล้ว (รับรองแหล่งที่มา ONLINE, OFFLINE, EXTERNAL, IMPORT)
6. **KPI Management**:
   - `Kpi`: จัดเก็บตัวชี้วัดผูกกับปี `year`
   - `KpiCourse` (ชื่อตาราง): ตารางเชื่อมแบบ Many-to-Many ระหว่าง Course และ Kpi — **ใช้ชื่อ `kpiCourse` ใน Prisma Client**
5. **Course Fields ที่ต้องรู้**:
   - `onboardingDeadlineDays: Int @default(14)` — กำหนดวันที่พนักงานใหม่ต้องเรียนให้เสร็จ (นับจาก `startDate`)
   - `isMandatory: Boolean` — หลักสูตรบังคับ, ถ้า `true` จะปรากฏในรายงาน Missing/Overdue
   - `trainingType`: `ONLINE | OFFLINE | EXTERNAL`

## 3. Core Logic & Flows (ต้องทำตามเมื่อพัฒนาระบบเรียน)

### 3.1 Course Progression (ลอจิกการปลดล็อคบทเรียน)
การประมวลผลการจบคอร์ส **ห้ามทำแยกเอง** ให้เรียกใช้ Utility: 
👉 `evaluateCourseCompletion(employeeId, courseId)` ใน `src/lib/course-eval.ts` เสมอ

**กฎของการปลดล็อค (Unlock Logic):**
- จะปลดล็อค Step ถัดไปได้ก็ต่อเมื่อ Step ก่อนหน้า ที่ตั้งค่า `is_required=true` ถูกทำสำเร็จ (`is_completed = true` สำหรับวิดีโอ หรือ `passed = true` สำหรับข้อสอบ)

**กฎการข้ามบทเรียน (Skip Logic - สำคัญมาก):**
- ถ้าระบบพบการสอบ `PRETEST` และพนักงานได้คะแนน `>= pass_score` ระบบจะถือว่า **"พนักงานมีความรู้แล้ว"**
- การประมวลผลจะทำการ "ข้าม (Skip)" โดนอัตโนมัติ ให้พนักงานสามารถกดเข้าไปสอบ `POSTTEST` หรือจบหลักสูตรได้เลย โดยไม่ต้องนั่งดู `VIDEO` หรือ `DOCUMENT` ที่คั่นอยู่ตรงกลาง

### 3.2 Employee Management (ระบบพนักงาน)
- **Import Flow**: เรามีระบบนำเข้าจาก Excel (`/api/admin/employees/import`). ข้อมูลวันที่ใน Excel ให้รองรับ `DD/MM/YYYY`. 
- ทันทีที่เพิ่มพนักงานใหม่ **ต้องนำเข้า Course บังคับอัตโนมัติ** `CourseAssignment.createMany` สำหรับคอร์สที่มี `is_mandatory = true` และตั้ง Due Date ให้ 30 วันนับจากเริ่มงาน (`start_date`)

### 3.3 Hybrid Classroom Learning & Offline Sessions (ระบบเรียนอบรมแบบมีรอบ)
ระบบจัดการการเรียนแบบ `Classroom (OFFLINE)` ถูกอัปเกรดให้รองรับแบบ Hybrid:
1. **การตั้งค่าคอร์ส**: แอดมินสามารถเปิด Course ขั้นตอน (Course Steps) เพื่อผูกแบบทดสอบออนไลน์ให้กับคอร์สแบบ Classroom ได้
2. **การลงทะเบียนและเก็บ Log**: พนักงานสามารถเลือกรอบและลงทะเบียนได้ หาก "กดยกเลิก" ข้อมูลจะไม่ถูกลบทิ้ง แต่จะเปลี่ยนสถานะลงฐานข้อมูลเป็น `CANCELLED` เพื่อเก็บประวัติการยกเลิกไว้เสมอ
3. **ระบบรักษาความปลอดภัย Meeting Link**: หากแอดมินใส่ `meetingUrl` ไว้ ปุ่มเข้าห้องเรียนของพนักงานจะล็อกเป็นสีเทาจนกว่าจะถึงเวลาที่กำหนด (`sessionDate`) เพื่อป้องกันการเข้าก่อนเวลา 
4. **กระบวนการตัดสินผล (Hybrid Passing Logic)**:
   - กรณี **ไม่ได้ผูกข้อสอบ (0 Steps)**: เมื่อแอดมินเข้าไปเช็คชื่อให้สถานะเป็น "เข้าร่วมแล้ว (ATTENDED)" ระบบจะบันทึกผลว่าให้พนักงาน "สอบผ่าน (PASSED 100%)" คอร์สนั้นอัตโนมัติ
   - กรณี **มีการผูกข้อสอบ / Post-test**: การที่แอดมินเช็คชื่อให้ "ATTENDED" จะทำหน้าที่เป็นแค่ **"การปลดล็อกสิทธิ์สอบ"** พนักงานต้องกดเข้าสู่หน้าต่างออนไลน์เพื่อทำข้อสอบออนไลน์ในระบบให้ผ่านเกณฑ์ ถึงจะได้รับสถานะ "สอบผ่าน (PASSED)"

### 3.4 KPI Mapping & Dashboard Reporting
- **ปีของตัวชี้วัด (Yearly KPIs)**: ข้อมูล KPI จะถูกแยกตามปี (Year) 
- **การนับข้อมูลรายปีบน Dashboard**: การดึงผลลัพธ์ Dashboard ข้ามปี (Annual Dashboard) จะใช้การ Filter ขอบเขตวันที่จากฟิลด์ `completedAt` เป็นหลัก เพื่อให้ครอบคลุม "หลักสูตรนอกเป้าหมาย (Extracurricular / นอก KPI)" ด้วยเสมอ ไม่ควร Join แค่ตาราง KpiCourse อย่างเดียว

### 3.5 Bulk Excel System (ระบบนำเข้าและส่งออกผลอบรม)
- ระบบรองรับการ Export และ Import ข้อมูล `TrainingResult` สำหรับแอดมิน 
- แหล่งที่มาของข้อมูล (ResultSource) สำหรับกรณีที่รังรวมจากภายนอก จะถูกกำกับด้วยสถานะ **`IMPORT`** ซึ่งหลังบ้านใช้วิธีนำไป `upsert` เพื่อประมวลผลทับของเก่าหรือสร้างสถิติใหม่ได้อย่างลื่นไหล

### 3.6 AI Smart Suggestion (เวทมนตร์วิเคราะห์เป้าหมายผู้เรียน)
ระบบผสานคุณสมบัติจาก **Gemini API** โดยตรง (รหัส `gemini-3-flash-preview` ณ ปี 2026) เพื่อเป็นผู้ช่วยให้กับฝ่าย HR ในการประเมินว่าหลักสูตรใด ควรตั้งค่าผู้เรียนไปที่ตำแหน่งหรือแผนกใด:
- วงจรการทำงาน: **(ส่งพารามิเตอร์ Course) -> (API ถาม Gemini) -> (ได้รับคำแนะนำ JSON โค้ดฝ่าย) -> (ดึงข้อมูลพนักงานขึ้นมาทำ Auto-Select ติ๊กถูกอัตโนมัติ)**

### 3.7 Course Analytics — Pass Rate คำนวณอย่างไร
- **สถิติหลัก** คำนวณจาก `TrainingResult` ของหลักสูตรนั้น (Backend: `api/admin/reports/courses/route.ts`)
- **Pass Rate Formula**: `passRate = Math.round((passedCount / totalTrained) * 100)`
  - `totalTrained` = จำนวนพนักงานที่มี TrainingResult ทั้งหมด (รวม `PASSED`, `FAILED`, `IN_PROGRESS`)
  - `passedCount` = นับเฉพาะ `status === 'PASSED'`
  - ⚠️ คนที่ "เพิ่งเปิดคอร์ส" แต่ยังสอบไม่เสร็จ (IN_PROGRESS) นับเป็นตัวหารด้วย — ทำให้ Pass Rate ต่ำลงตามธรรมชาติ
- **สถิติอื่น**: `avgScore` (ค่าเฉลี่ยจาก `score`), `avgPretest / avgPosttest` (Pre/Post test trend)
- **Missing/Overdue List**: สร้างเฉพาะ `isMandatory = true` เท่านั้น โดยนับคนที่ไม่มี `TrainingResult` ในหลักสูตรนั้น

### 3.8 onboardingDeadlineDays — ข้อควรระวัง
`onboardingDeadlineDays` มี `@default(14)` ใน Schema และค่า `0` ถือว่า "ไม่มีกำหนด" ในบริบทของระบบ
- **ปัญหาที่เคยเจอ**: ค่า `0` ถือเป็น Falsy ใน JS ทำให้ `|| 14` จะทับค่ากลับเป็น 14 อยู่เสมอ
- **วิธีแก้ที่ถูกต้อง**: ใช้ Nullish Coalescing `?? 14` แทน `|| 14` เสมอในทุก Component ที่แสดงค่านี้ และใน API ให้ `Number(val) || convert via explicit check: val === '' ? 0 : Number(val)` ไม่ใช้ `Number(val) || default`

## 4. Design System & UX Standards
- **Framework**: `Next.js 15 (App Router)` + `React 19` + `Tailwind CSS v4`
- **Theme**: เราใช้สีธีมหลัก เป็น โทน ขาว/แดง/เหลือง/ดำ (อิงตาม Corporate Identity ของบริษัท)
- **Token CSS Variables**: ให้ใช้ Token ที่ถูกสร้างไว้แล้วใน `src/app/globals.css` แทนการระบุสีตรงๆ ได้แก่ `var(--color-primary)`, `var(--color-accent)`, `var(--color-text)`
- **UX ข้อควรระวัง (Alert UI)**: 
  - **ห้ามเรียกใช้งาน `window.alert()`, `confirm()` หรือ แจ้งเตือนของเบราว์เซอร์เด็ดขาด!** 
  - ให้เรียกใช้งานอินเทอร์เฟซ `useModal()` จาก `@/components/ModalProvider` แทนเสมอ (เช่น `showAlert({ type: 'success', message: '...' })` เพื่อความคล่องตัวและสวยงาม
  - ข้อผิดพลาดในการบันทึกให้ใช้ Error Label สีแดง (`setError('...')`) แทรกลงใน UI ตรงๆ 
- **UX ข้อควรระวัง (Number Inputs)**: ช่องกรอกตัวเลขทั้งหมดในระบบ **ห้ามใช้ค่า default พังๆ ที่ลบให้ว่างไม่ได้**
  - ใช้ `useState<number | string>(value ?? defaultVal)` — **ต้องใช้ `??` ไม่ใช่ `||`** เสมอสำหรับค่าที่อาจเป็น 0
  - ใช้ `onChange={(e) => setVal(e.target.value === '' ? '' : Number(e.target.value))}`
  - **บังคับใส่** `onFocus={(e) => e.target.select()}` เสมอ 
- **Class Components สำเร็จรูป**: 
  - `btn-primary`, `btn-secondary`: สำหรับระบบปุ่ม
  - `stat-card`, `glass-card`: สำหรับ Card กล่องเนื้อหาและกราฟ
  - `input-field`: สำหรับฟอร์มกรอกข้อมูล

## 5. File References (ระบบเก็บไฟล์บน Cloudflare R2)
ไฟล์วิดีโอรูปภาพที่เกี่ยวข้องกับคอร์ส จะไม่ได้ถูกอัพขึ้นระบบไฟล์ตรงๆ แต่จะอัปขึ้น **Cloudflare R2** ผ่านไลบรารี `@aws-sdk/client-s3` โดยมี `lib/r2.ts` เป็นตัวจัดการ และจะใช้งานลิ้งค์สาธารณะ (R2_PUBLIC_URL) ตลอดการเปิดหน้าเว็บ

---

## 6. Data Seed (prisma/seed.ts)
**คำสั่งรัน**: `bash -lc "npx tsx prisma/seed.ts"` (ต้องรันด้วย `bash -lc` เสมอ เพราะ PATH)

**Seed จะทำสิ่งเหล่านี้ตามลำดับ:**
1. ลบ Transaction ทั้งหมดก่อน (TrainingResult, QuizAttempt, CourseAssignment, Certificate ฯลฯ)
2. ลบ Question, CourseStep, Course (clean หลักสูตรเดิมออก)
3. ลบ Employee, Branch แล้วสร้างใหม่
4. สร้าง Admin (`admin / admin123`)
5. สร้าง Branch (สาขา 20 แห่ง — dev mode ใช้ `devBranchesData`, production ใช้ `productionBranchesData`)
6. สร้าง Employee 50 คน พร้อม Logic แยกตำแหน่งตามประเภทสาขา:
   - **สาขา (Branch)**: Barista, Cashier, Service Crew, Shift Supervisor, Store Manager, แม่บ้าน
   - **HQ (isHeadOffice=true)**: IT Support, HR Executive, Marketing Officer, Manager, Director
7. สร้าง Course 3 หลักสูตร (Cafe Theme): CRS-001 (Online/บังคับ), CRS-002 (Online), CRS-003 (Offline/บังคับ)
8. สร้าง Steps + Questions เนื้อหาธีมร้านกาแฟ
9. สุ่มผลการอบรม (TrainingResult) บางส่วน

**สลับ Mode สาขา**: แก้ `const activeBranches = devBranchesData` → `productionBranchesData`

---

## 7. Developer Protocol & Deployment (ข้อบังคับสำหรับ AI)
- **Pushing Code & Deployment**: ห้าม AI ทำการ `git add`, `git commit`, `git push` หรือรันสคริปต์ `deploy.sh` โดยพลการ **เด็ดขาด**
- ให้กระทำการ Deploy และอัปโหลดโค้ดขึ้น Server **เมื่อได้รับคำสั่งจาก USER โดยตรงเท่านั้น** (เช่น "push code ลงเซิร์ฟให้หน่อย")
- **pushcode = `git add . && git commit -m "..." && git push`** เท่านั้น ไม่ต้อง `npm run build` หรือรัน deploy script เพิ่มเติม เว้นแต่ USER จะสั่ง

---
*Created per USER request. Please do not apply concepts, schema logic, or styling techniques from other projects (`muniflow` or elsewhere) when editing `mckpi`.*
