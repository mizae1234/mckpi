import NextAuth from 'next-auth'

// Edge-compatible auth config (no DB queries, just JWT verification)
export const { auth: authMiddleware } = NextAuth({
  providers: [], // No providers needed for middleware JWT check
  callbacks: {
    async jwt({ token }) {
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
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET,
})
