import { prisma } from "./src/lib/prisma"; async function main() { console.log(await prisma.kpi.findMany()); } main()
