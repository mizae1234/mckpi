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
   - `TrainingResult` และ `Certificate`: ระบบผลลัพธ์และใบรับรองเมื่อจบการศึกษาแล้ว
6. **KPI Management**:
   - `Kpi`: จัดเก็บตัวชี้วัดผูกกับปี `year`
   - `CourseKpi`: ตารางเชื่อมแบบ Many-to-Many ระหว่าง Course และ Kpi

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

### 3.4 KPI Mapping System
- **ปีของตัวชี้วัด (Yearly KPIs)**: ข้อมูล KPI จะถูกแยกตามปี (Year) แอดมินสามารถสร้างใหม่หรือใช้ฟังก์ชัน "คัดลอกจากปีที่แล้ว (Copy from previous year)" ได้
- **การผูก Course & KPI**: 1 คอร์ส สามารถตอบโจทย์ได้หลาย KPI ผ่านตารางตรงกลาง `CourseKpi`

## 4. Design System & UX Standards
- **Framework**: `Next.js 15 (App Router)` + `React 19` + `Tailwind CSS v4`
- **Theme**: เราใช้สีธีมหลัก เป็น โทน ขาว/แดง/เหลือง/ดำ (อิงตาม Corporate Identity ของบริษัท)
- **Token CSS Variables**: ให้ใช้ Token ที่ถูกสร้างไว้แล้วใน `src/app/globals.css` แทนการระบุสีตรงๆ เช่น:
  - `var(--color-primary)`
  - `var(--color-accent)`
  - `var(--color-text)`
- **UX ข้อควรระวัง (Number Inputs)**: ช่องกรอกตัวเลขทั้งหมดในระบบ (เช่น เครดิตชั่วโมง, เปอร์เซ็นต์ผ่าน) **ห้ามใช้ค่า default พังๆ ที่ลบให้ว่างไม่ได้** แนะนำให้ผูก Type เป็น `value={value || ''}` แบบ String ชั่วคราว และ **บังคับใส่** `onFocus={(e) => e.target.select()}` เสมอ เพื่อลดความรำคาญเวลาแก้ตัวเลข
- **Class Components สำเร็จรูป**: 
  - `btn-primary`, `btn-secondary`: สำหรับระบบปุ่ม
  - `stat-card`, `glass-card`: สำหรับ Card กล่องเนื้อหาและกราฟ
  - `input-field`: สำหรับฟอร์มกรอกข้อมูล
  - `badge-success`, `badge-danger`, `badge-accent`: สำหรับทำป้าย Tag

## 5. File References (ระบบเก็บไฟล์บน Cloudflare R2)
ไฟล์วิดีโอรูปภาพที่เกี่ยวข้องกับคอร์ส จะไม่ได้ถูกอัพขึ้นระบบไฟล์ตรงๆ แต่จะอัปขึ้น **Cloudflare R2** ผ่านไลบรารี `@aws-sdk/client-s3` โดยมี `lib/r2.ts` เป็นตัวจัดการ และจะใช้งานลิ้งค์สาธารณะ (R2_PUBLIC_URL) ตลอดการเปิดหน้าเว็บ

---
## 6. Developer Protocol & Deployment (ข้อบังคับสำหรับ AI)
- **Pushing Code & Deployment**: ห้าม AI ทำการ `git add`, `git commit`, `git push` หรือรันสคริปต์ `deploy.sh` โดยพลการ **เด็ดขาด**
- ให้กระทำการ Deploy และอัปโหลดโค้ดขึ้น Server **เมื่อได้รับคำสั่งจาก USER โดยตรงเท่านั้น** (เช่น "push code ลงเซิร์ฟให้หน่อย")

---
*Created per USER request. Please do not apply concepts, schema logic, or styling techniques from other projects (`muniflow` or elsewhere) when editing `mckpi`.*
