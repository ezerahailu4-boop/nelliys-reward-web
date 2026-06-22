'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

export function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}

export { useSession as useAuth } from 'next-auth/react'
