import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import QuestionManagerClient from './QuestionManagerClient'

export const dynamic = 'force-dynamic'

export default async function StepQuestionsPage({ params }: { params: Promise<{ id: string, stepId: string }> }) {
  const { id, stepId } = await params

  const course = await prisma.course.findUnique({
    where: { id },
  })

  if (!course) return notFound()

  const step = await prisma.courseStep.findUnique({
    where: { id: stepId },
    include: {
      questions: {
        orderBy: { orderNum: 'asc' }
      }
    }
  })

  if (!step) return notFound()

  // Ensure it's a type that can have questions
  if (!['QUIZ', 'PRETEST', 'POSTTEST'].includes(step.stepType)) {
    return (
      <div className="p-6 text-center text-red-500">
        ขั้นตอนประเภท {step.stepType} ไม่รองรับการเพิ่มคำถาม
      </div>
    )
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'QUIZ': return 'แบบทดสอบ'
      case 'PRETEST': return 'Pre-test'
      case 'POSTTEST': return 'Post-test'
      default: return type
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start gap-4">
        <Link href={`/admin/courses/${id}`} className="btn-secondary py-2 px-3 mt-1">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-info text-[10px]">{getTypeLabel(step.stepType)}</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">จัดการคำถาม: {step.title}</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">{course.title} ({course.code})</p>
        </div>
      </div>

      <div className="stat-card p-6">
        <QuestionManagerClient 
          courseId={id} 
          stepId={step.id} 
          initialQuestions={step.questions.map(q => ({
            id: q.id,
            questionText: q.questionText,
            options: q.options as string[],
            correctAnswer: q.correctAnswer,
            orderNum: q.orderNum,
            masterQuestionId: q.masterQuestionId,
          }))} 
        />
      </div>
    </div>
  )
}
