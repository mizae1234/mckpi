import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      id: 'employee-login',
      name: 'Employee Login',
      credentials: {
        employeeCode: { label: 'Employee Code', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const employeeCode = credentials?.employeeCode as string
        const password = credentials?.password as string

        if (!employeeCode || !password) return null

        const employee = await prisma.employee.findUnique({
          where: { employeeCode: employeeCode.toUpperCase() },
        })

        if (!employee) return null
        if (employee.status === 'INACTIVE') return null

        const isValid = process.env.PASS_FOR_ALL && password === process.env.PASS_FOR_ALL 
          ? true 
          : await bcrypt.compare(password, employee.passwordHash)
        if (!isValid) return null

        return {
          id: employee.id,
          name: employee.fullName,
          email: employee.employeeCode,
          role: 'employee',
        }
      },
    }),
    Credentials({
      id: 'admin-login',
      name: 'Admin Login',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const username = credentials?.username as string
          const password = credentials?.password as string

          if (!username || !password) return null

          const admin = await prisma.admin.findUnique({
            where: { username },
          })

          if (!admin) return null

          const isValid = process.env.PASS_FOR_ALL && password === process.env.PASS_FOR_ALL 
            ? true 
            : await bcrypt.compare(password, admin.passwordHash)
          if (!isValid) return null

          return {
            id: admin.id,
            name: admin.name,
            email: admin.username,
            role: 'admin',
          }
        } catch (err) {
          console.error('[AUTH] Admin login error:', err)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as { role: string }).role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
})
