import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { rateLimit } from '@/lib/rateLimit'
import '@/lib/validateEnv'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        identifier: { label: 'Email or Phone', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        try {
          if (!credentials?.identifier || !credentials?.password) return null

          // Rate limit by IP
          const ip = (req as any)?.headers?.['x-forwarded-for'] ?? 'unknown'
          if (!rateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) return null

          const identifier = credentials.identifier.trim()
          const user = await prisma.user.findFirst({
            where: { OR: [{ email: identifier }, { phone: identifier }] },
            select: { id: true, email: true, name: true, phone: true, password: true, role: true, tier: true, points: true, isActive: true, isVerified: true }
          })
          if (!user?.password || !user.isActive) return null
          const isValid = await bcrypt.compare(credentials.password, user.password)
          if (!isValid) return null
          return { id: user.id, email: user.email, name: user.name, role: user.role, tier: user.tier, points: user.points } as any
        } catch (err) {
          console.error('Auth error:', err)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.tier = (user as any).tier
        token.points = (user as any).points
      }
      // Refresh points/tier from DB on session update trigger
      if (trigger === 'update' && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { tier: true, points: true, role: true },
        })
        if (fresh) {
          token.tier = fresh.tier
          token.points = fresh.points
          token.role = fresh.role
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).tier = token.tier
        ;(session.user as any).points = token.points
      }
      return session
    },
  },
  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
}
