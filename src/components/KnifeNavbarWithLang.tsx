'use client'

import { useEffect, useState } from 'react'
import KnifeNavbar from './KnifeNavbar'
import { LANGUAGES, type LangCode } from '@/lib/constants'

const STORAGE_KEY = 'nelliy-lang'

export default function KnifeNavbarWithLang() {
  const [lang, setLangState] = useState<LangCode>('en')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as LangCode | null
    if (saved && LANGUAGES.some(l => l.code === saved)) setLangState(saved)
  }, [])

  const setLang = (code: string) => {
    setLangState(code as LangCode)
    localStorage.setItem(STORAGE_KEY, code)
  }

  return (
    <KnifeNavbar
      lang={lang}
      setLang={setLang}
      langOptions={LANGUAGES as unknown as { code: string; label: string; flag: string }[]}
    />
  )
}
