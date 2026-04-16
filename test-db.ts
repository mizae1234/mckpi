import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const employees = await prisma.employee.findMany({
    take: 5,
    include: { branch: true },
    orderBy: { employeeCode: 'asc' }
  });
  console.log("TEST EMPLOYEES:");
  console.dir(employees, { depth: null });
  
  const branches = await prisma.branch.findMany({
    take: 5
  });
  console.log("TEST BRANCHES:");
  console.dir(branches, { depth: null });
}

main().finally(() => prisma.$disconnect());
