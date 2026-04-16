import { prisma } from './src/lib/prisma';
async function run() {
  const c = await prisma.course.findFirst();
  if(!c) return console.log('no course');
  const res = await prisma.course.update({
    where: { id: c.id },
    data: { onboardingDeadlineDays: 0 }
  });
  console.log('Updated to:', res.onboardingDeadlineDays);
}
run().catch(console.error).finally(() => prisma.$disconnect());
