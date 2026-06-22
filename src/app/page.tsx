'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Coffee, 
  Scan, 
  Gift, 
  Star, 
  MapPin, 
  Phone, 
  Mail,
  ArrowRight,
  ChevronDown,
  Menu,
  X,
  Users,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  Sparkles,
  Zap,
  Crown,
  Wallet,
  QrCode,
  Camera,
  Bell,
  Globe,
  Smartphone,
  ExternalLink,
  Trophy,
  Medal,
  Gem,
  Flame,
  Moon,
  Sun
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const LANG_OPTIONS = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'am', label: 'አማርኛ', flag: '🇪🇹' },
  { code: 'or', label: 'Afaan Oromo', flag: '🇪🇹' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
]

const translations = {
  en: {
    heroTitle: "Nelliy's Coffee",
    heroSubtitle: "Addis Ababa's Finest Coffee & Loyalty Rewards",
    scanEarn: "Scan & Earn Rewards",
    scanDesc: "Scan QR codes from receipts, cups, or tables to earn points instantly",
    uploadReceipt: "Upload Receipt",
    uploadDesc: "Upload your receipt and earn points automatically with AI-powered OCR",
    rewards: "Rewards",
    rewardsDesc: "Redeem your hard-earned points for free coffees, pastries & more",
    orderAhead: "Order Ahead",
    orderAheadDesc: "Order your favorite coffee before you arrive",
    howItWorks: "How It Works",
    step1Title: "Scan or Upload",
    step1Desc: "Scan a QR code or upload your receipt",
    step2Title: "Earn Points",
    step2Desc: "Get 1 point for every 10 ETB spent",
    step3Title: "Redeem Rewards",
    step3Desc: "Use points for free drinks & treats",
    tiers: "Membership Tiers",
    bronze: "Bronze",
    silver: "Silver",
    gold: "Gold",
    vip: "VIP",
    features: "Why Choose Nelliy's?",
    feature1: "Earn points on every purchase",
    feature2: "Exclusive member-only promotions",
    feature3: "Free birthday drinks",
    feature4: "Referral bonuses",
    feature5: "Order ahead & skip the line",
    feature6: "Track rewards on your phone",
    download: "Download App",
    branches: "Our Location",
    contact: "Contact Us",
    language: "Language",
  },
  am: {
    heroTitle: "ነሊይ'ስ ቡና",
    heroSubtitle: "የአዲስ አበባ ምርጥ ቡና እና ሽልማት ፕሮግራም",
    scanEarn: "ስካን እና ሽልማት ተቀበል",
    scanDesc: "ከገበያ ደረሰጎት፣ ኩባያ ወይም ጠረጴዛ ኪዩር ኮድ ስካን ማድረግ ነጥብ ያገኛሉ",
    uploadReceipt: "ደረሰጎት ላይስድ",
    uploadDesc: "ደረሰጎትዎን ላይስድን እና AI-powered OCR በራስ-ሰር ነጥብ ያገኛሉ",
    rewards: "ሽልማቶች",
    rewardsDesc: "ነጥቦችዎን ለነጻ ቡና፣ ፓስትሪ እና ሌሎች ይቀይሩ",
    orderAhead: "በፊት ይዘዙ",
    orderAheadDesc: "ከመምጣትዎ በፊት የሚወዷትን ቡና ይዘዙ",
    howItWorks: "እንዴት ይሰራል?",
    step1Title: "ስካን ወይም ላይስድ",
    step1Desc: "ኪዩር ኮድ ስካን ወይም ደረሰጎትዎን ላይስድ",
    step2Title: "ነጥብ ያገኛሉ",
    step2Desc: "ለሚያገኙት አስር ETB 1 ነጥብ ያገኛሉ",
    step3Title: "ሽልማት ተቀበል",
    step3Desc: "ነጻ መጠጦች እና መክሰስ ለመስጠት ነጥብ ይጠቀሙ",
    tiers: "አባልነት ደረጃዎች",
    bronze: "እርስያ",
    silver: "ብር",
    gold: "ወርቅ",
    vip: "VIP",
    features: "ነሊይ'ስን ለምን ይምረጡ?",
    feature1: "በሚገዙት ላይ ነጥብ ያገኛሉ",
    feature2: "ለአባላት ብቻ የተለዩ ማስተዋወቂያዎች",
    feature3: "ነጻ የልደት መጠጥ",
    feature4: "ማስተዋወቂያ ሽልማቶች",
    feature5: "በፊት ይዘዙ መስመሩን ይትረፉ",
    feature6: "ሽልማቶችዎን በስልክዎ ይከታተሉ",
    download: "አፕሊኬሽን ያውርዱ",
    branches: "አካባቢያችን",
    contact: "ያግኙን",
    language: "ቋንቋ",
  },
  or: {
    heroTitle: "Nelliy's Coffee",
    heroSubtitle: "Bunaa fi Badhaasaa Addis Ababa",
    scanEarn: "Scan & Qabsi Reewards",
    scanDesc: "QR code kee kee fi cup kee fi meeshaa irra scan gochuu dhiyaatu qabda",
    uploadReceipt: "Galmee Booduu",
    uploadDesc: "Galmee kee boduu fi AI OCRtti qabda argachuuf",
    rewards: "Qabda",
    rewardsDesc: "Qabda kee fayyadamiin dhugaatii bilisaa fi wantoota biraa argachuuf",
    orderAhead: "Dursee Order",
    orderAheadDesc: "Furmaata kee yeroo dhufuun dursee order goi",
    howItWorks: "Akkaataa ishee",
    step1Title: "Scan yookiin Boodi",
    step1Desc: "QR code scan yookiin galmee kee bodi",
    step2Title: "Qabda Argachuu",
    step2Desc: "10 ETB hundaatti 1 qabda argachuu",
    step3Title: "Qabda Fayyadami",
    step3Desc: "Qabda fayyadamiin dhugaatii bilisaa fi wantoota biraa argachuuf",
    tiers: "Giddugaleessa",
    bronze: "Muka",
    silver: "Zinjibiraa",
    gold: "Waaqaa",
    vip: "VIP",
    features: "Maaliif Nelliy's filattu?",
    feature1: "Qabda argachuu guutummaa",
    feature2: "Kaffaltii guddinaa",
    feature3: "Dhugaatii guyyaa dhalootaa",
    feature4: "Qabda qusachuu",
    feature5: "Dursee order gochuu fi safarrii dhiisuu",
    feature6: "Qabda kee foon kee irraa ilaali",
    download: "App boodi",
    branches: "Bakka Keenya",
    contact: "Nu qunnami",
    language: "Afaan",
  },
  ar: {
    heroTitle: "قهوة نيلي",
    heroSubtitle: "أفضل قهوة وبرنامج مكافآت في أديس أبابا",
    scanEarn: "امسح واكسب المكافآت",
    scanDesc: "امسح رمز QR من الإيصال أو الكوب أو الطاولة لكسب النقاط فوراً",
    uploadReceipt: "رفع الإيصال",
    uploadDesc: "ارفع إيصالك واكسب النقاط تلقائياً بتقنية OCR الذكية",
    rewards: "المكافآت",
    rewardsDesc: "استبدل نقاطك بقهوة مجانية وحلويات والمزيد",
    orderAhead: "اطلب مسبقاً",
    orderAheadDesc: "اطلب قهوتك المفضلة قبل وصولك",
    howItWorks: "كيف يعمل؟",
    step1Title: "امسح أو ارفع",
    step1Desc: "امسح رمز QR أو ارفع إيصالك",
    step2Title: "اكسب النقاط",
    step2Desc: "نقطة واحدة لكل 10 بر إثيوبي",
    step3Title: "استبدل المكافآت",
    step3Desc: "استخدم نقاطك للحصول على مشروبات وحلويات مجانية",
    tiers: "مستويات العضوية",
    bronze: "برونز",
    silver: "فضة",
    gold: "ذهب",
    vip: "VIP",
    features: "لماذا تختار نيلي؟",
    feature1: "اكسب نقاطاً على كل عملية شراء",
    feature2: "عروض حصرية للأعضاء فقط",
    feature3: "مشروب مجاني في عيد ميلادك",
    feature4: "مكافآت الإحالة",
    feature5: "اطلب مسبقاً وتجنب الانتظار",
    feature6: "تتبع مكافآتك من هاتفك",
    download: "تحميل التطبيق",
    branches: "موقعنا",
    contact: "تواصل معنا",
    language: "اللغة",
  },
  fr: {
    heroTitle: "Nelliy's Coffee",
    heroSubtitle: "Le meilleur café et programme de fidélité d'Addis-Abeba",
    scanEarn: "Scanner & Gagner des Récompenses",
    scanDesc: "Scannez le QR code sur votre reçu, tasse ou table pour gagner des points instantanément",
    uploadReceipt: "Télécharger le Reçu",
    uploadDesc: "Téléchargez votre reçu et gagnez des points automatiquement grâce à l'OCR IA",
    rewards: "Récompenses",
    rewardsDesc: "Échangez vos points contre des cafés gratuits, pâtisseries et plus encore",
    orderAhead: "Commander à l'Avance",
    orderAheadDesc: "Commandez votre café préféré avant d'arriver",
    howItWorks: "Comment ça marche ?",
    step1Title: "Scanner ou Télécharger",
    step1Desc: "Scannez un QR code ou téléchargez votre reçu",
    step2Title: "Gagner des Points",
    step2Desc: "1 point pour chaque 10 ETB dépensé",
    step3Title: "Échanger des Récompenses",
    step3Desc: "Utilisez vos points pour des boissons et friandises gratuites",
    tiers: "Niveaux d'Adhésion",
    bronze: "Bronze",
    silver: "Argent",
    gold: "Or",
    vip: "VIP",
    features: "Pourquoi choisir Nelliy's ?",
    feature1: "Gagnez des points sur chaque achat",
    feature2: "Promotions exclusives aux membres",
    feature3: "Boisson gratuite pour votre anniversaire",
    feature4: "Bonus de parrainage",
    feature5: "Commandez à l'avance et évitez la file",
    feature6: "Suivez vos récompenses sur votre téléphone",
    download: "Télécharger l'App",
    branches: "Notre Emplacement",
    contact: "Contactez-nous",
    language: "Langue",
  }
}

import Image from 'next/image'
import dynamic from 'next/dynamic'

const NelliyMap = dynamic(() => import('@/components/ui/NelliyMap'), { ssr: false })

const GOOGLE_REVIEW_URL = 'https://www.google.com/maps/place/Nelliy%27s+Coffee/@9.0012867,38.7672743,3a,75y,90t/data=!3m8!1e2!3m6!1sCIABIhC1snQdltRynRnnEDKZgB11!2e10!3e12!6shttps:%2F%2Flh3.googleusercontent.com%2Fgps-cs-s%2FAHVAweqBodE_O19FkhdZYXCmpyG465nOROVlhp66yD0_AfkblhukvbPrjtD7x6SNKSnLpbIDecly1Q8BD_Vf8Q3tC-Dggf0kVd0N7cZJGvl-Guk0-HW7V1gwqGCMKz9xaij-ONOaP743mWH3a7yl%3Dw203-h270-k-no!7i3464!8i4618!4m7!3m6!1s0x164b850055638aad:0xfeef3167f87e10e3!8m2!3d9.0012587!4d38.7673834!10e5!16s%2Fg%2F11yjl_9sly'

export default function HomePage() {
  const [lang, setLangState] = useState('en')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const t = translations[lang as keyof typeof translations]
  const isRtl = lang === 'ar'

  const setLang = (code: string) => {
    setLangState(code)
    localStorage.setItem('nelliy-lang', code)
  }

  useEffect(() => {
    const saved = localStorage.getItem('nelliy-lang')
    if (saved && translations[saved as keyof typeof translations]) setLangState(saved)
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/leaderboard/public', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setLeaderboard(Array.isArray(data?.leaderboard) ? data.leaderboard : [])
      } catch {
        if (!cancelled) setLeaderboard([])
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const currentLangOption = LANG_OPTIONS.find(l => l.code === lang) || LANG_OPTIONS[0]

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <img src="/Nelliys Logo Coffee-01.png" alt="Nelliy's Coffee" className="h-12 lg:h-14 w-auto object-contain" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              <Link href="#how-it-works" className="text-amber-800 dark:text-amber-200 hover:text-amber-600 dark:hover:text-amber-300 font-medium transition-colors">
                {t.howItWorks}
              </Link>
              <Link href="#tiers" className="text-amber-800 dark:text-amber-200 hover:text-amber-600 dark:hover:text-amber-300 font-medium transition-colors">
                {t.tiers}
              </Link>
              <Link href="/leaderboard" className="text-amber-800 dark:text-amber-200 hover:text-amber-600 dark:hover:text-amber-300 font-medium transition-colors flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" /> Leaderboard
              </Link>
              <Link href="#rate-us" className="text-amber-800 dark:text-amber-200 hover:text-amber-600 dark:hover:text-amber-300 font-medium transition-colors">
                Rate Us
              </Link>
              <Link href="#contact" className="text-amber-800 dark:text-amber-200 hover:text-amber-600 dark:hover:text-amber-300 font-medium transition-colors">
                {t.contact}
              </Link>
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="text-amber-800 dark:text-amber-200 hover:text-amber-600 dark:hover:text-amber-300"
                aria-label="Toggle dark mode"
              >
                <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>

              {/* Language Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-amber-800 dark:text-amber-200 hover:text-amber-600 gap-1.5">
                    <span className="text-base leading-none">{currentLangOption.flag}</span>
                    <span className="text-xs font-semibold">{currentLangOption.label}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[160px]">
                  {LANG_OPTIONS.map(l => (
                    <DropdownMenuItem key={l.code} onClick={() => setLang(l.code)}
                      className={`gap-2 ${lang === l.code ? 'bg-amber-50 text-amber-700 font-semibold' : ''}`}>
                      <span className="text-base">{l.flag}</span>
                      <span>{l.label}</span>
                      {lang === l.code && <span className="ml-auto text-amber-500">✓</span>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Login Buttons */}
              <div className="hidden lg:flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" className="text-amber-800 hover:text-amber-600">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg">
                    Join Now
                  </Button>
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden text-amber-900 dark:text-amber-200"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-card border-t border-amber-100 dark:border-zinc-700"
            >
              <div className="px-4 py-4 space-y-3">
                <Link href="#how-it-works" className="block py-2 text-amber-800 dark:text-amber-200 font-medium">
                  {t.howItWorks}
                </Link>
                <Link href="#tiers" className="block py-2 text-amber-800 dark:text-amber-200 font-medium">
                  {t.tiers}
                </Link>
                <Link href="/leaderboard" className="block py-2 text-amber-800 dark:text-amber-200 font-medium">
                  🏆 Leaderboard
                </Link>
                <Link href="#rate-us" className="block py-2 text-amber-800 dark:text-amber-200 font-medium">
                  Rate Us
                </Link>
                <Link href="#contact" className="block py-2 text-amber-800 dark:text-amber-200 font-medium">
                  {t.contact}
                </Link>
                <div className="pt-3 border-t border-amber-100 flex flex-col gap-2">
                  <Link href="/login">
                    <Button variant="outline" className="w-full border-amber-300 text-amber-800">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                      Join Now
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">

        {/* === BACKGROUND PHOTO (back1.jpg) with Ken Burns zoom === */}
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/back1.jpg)' }}
          initial={{ scale: 1 }}
          animate={{ scale: 1.08 }}
          transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
        />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

        {/* === CONTENT === */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-0">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left — Text */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9 }}
              className="text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Badge className="bg-amber-500/20 backdrop-blur-sm text-amber-300 border-amber-400/30 mb-5 px-4 py-1.5 text-sm">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Addis Ababa's Finest Coffee
                </Badge>
              </motion.div>

              <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-5 leading-none drop-shadow-2xl break-words">
                {t.heroTitle}
              </h1>

              <p className="text-lg sm:text-xl text-white/75 mb-10 max-w-lg leading-relaxed">
                {t.heroSubtitle}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/scan">
                  <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all group px-8">
                    <Scan className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    {t.scanEarn}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" className="bg-white/10 backdrop-blur-md border border-white/30 text-white hover:bg-white/20 transition-all px-8">
                    Join Free
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-14 flex flex-wrap gap-10 justify-center lg:justify-start">
                {[['2K+', 'Happy Members'], ['1', 'Branch'], ['10K+', 'Points Earned']].map(([val, label]) => (
                  <div key={label} className="text-center">
                    <div className="text-3xl font-bold text-white">{val}</div>
                    <div className="text-white/50 text-sm mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right — placeholder to keep grid balance on mobile */}
            <div className="hidden lg:block" />
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        >
          <span className="text-white/40 text-xs tracking-widest uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronDown className="w-6 h-6 text-white/40" />
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-amber-100 text-amber-700 mb-4">
              <Zap className="w-3 h-3 mr-1" />
              Easy Steps
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-amber-900">
              {t.howItWorks}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Scan, title: t.step1Title, desc: t.step1Desc, number: '01' },
              { icon: Wallet, title: t.step2Title, desc: t.step2Desc, number: '02' },
              { icon: Gift, title: t.step3Title, desc: t.step3Desc, number: '03' },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 text-center border border-amber-100 hover:border-amber-200 transition-all hover:shadow-xl"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-6xl font-display font-bold text-amber-200 absolute top-4 right-4">
                    {step.number}
                  </div>
                  <h3 className="font-display text-xl font-bold text-amber-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-amber-700/70">
                    {step.desc}
                  </p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-amber-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Membership Tiers */}
      <section id="tiers" className="py-20 bg-gradient-to-b from-amber-50 to-orange-50 dark:from-zinc-950 dark:to-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-orange-100 text-orange-700 mb-4">
              <Crown className="w-3 h-3 mr-1" />
              Exclusive Benefits
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-amber-900">
              {t.tiers}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { tier: t.bronze, color: 'from-amber-700 to-amber-900', points: '0–500', benefits: ['1 point per 10 ETB', 'Birthday reward', 'Member promotions'], icon: Medal },
              { tier: t.silver, color: 'from-gray-300 to-gray-500', points: '501–2000', benefits: ['1.25x points', 'Priority ordering', 'Exclusive deals', 'Free add-ons'], icon: Star },
              { tier: t.gold, color: 'from-yellow-400 to-amber-600', points: '2001–5000', benefits: ['1.5x points', 'Free birthday drink', 'Early access', 'Quarterly bonus'], icon: Crown },
              { tier: t.vip, color: 'from-purple-500 to-pink-500', points: '5000+', benefits: ['2x points', 'Personal concierge', 'Exclusive events', 'Free delivery', 'Anniversary bonus'], icon: Gem },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`relative bg-gradient-to-br ${item.color} rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1`}
              >
                {i === 3 && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-purple-600">
                    <Flame className="w-3 h-3 mr-1" />
                    Most Exclusive
                  </Badge>
                )}
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-8 h-8" />
                  </div>
                  <h3 className="font-display text-2xl font-bold mb-2">{item.tier}</h3>
                  <div className="text-white/80 text-sm mb-4">{item.points} points</div>
                  <ul className="space-y-2 text-sm text-white/90">
                    {item.benefits.map((benefit, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-white/70" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-amber-100 text-amber-700 mb-4">
              <Award className="w-3 h-3 mr-1" />
              Benefits
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-amber-900">
              {t.features}
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Video */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-amber-500/10 rounded-3xl blur-2xl" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-amber-100 aspect-video">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster="/back1.jpg"
                  className="w-full h-full object-cover"
                  src="/back.mp4"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="bg-black/40 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/10 flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Coffee className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Nelliy's Coffee</p>
                      <p className="text-white/60 text-xs">Gazebo, Addis Ababa</p>
                    </div>
                    <div className="ml-auto flex gap-0.5">
                      {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Features grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: TrendingUp, text: t.feature1 },
                { icon: Star, text: t.feature2 },
                { icon: Gift, text: t.feature3 },
                { icon: Users, text: t.feature4 },
                { icon: Clock, text: t.feature5 },
                { icon: Smartphone, text: t.feature6 },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-4 p-5 bg-amber-50 rounded-xl border border-amber-100 hover:border-amber-300 hover:shadow-md transition-all"
                >
                  <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-amber-900 font-medium text-sm">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section id="leaderboard" className="py-20 bg-gradient-to-b from-amber-900 via-amber-800 to-orange-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-white/10 text-amber-300 border-white/20 mb-4">
              <Trophy className="w-3 h-3 mr-1" /> Hall of Fame
            </Badge>
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-white mb-3">Top Coffee Earners</h2>
            <p className="text-amber-300/80 max-w-md mx-auto">Our most loyal members. Earn points, climb the ranks.</p>
          </div>

          {leaderboard.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="w-16 h-16 text-amber-400/40 mx-auto mb-4" />
              <p className="text-amber-300">No members yet — be the first!</p>
              <Link href="/register" className="inline-block mt-4">
                <Button className="bg-white text-amber-700 hover:bg-amber-50">Join Now</Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Podium */}
              {leaderboard.length >= 3 && (
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  className="flex items-end justify-center gap-4 mb-10 max-w-lg mx-auto">
                  {/* 2nd */}
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-300 to-slate-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-xl ring-4 ring-slate-300/30">
                      {leaderboard[1]?.name?.[0]?.toUpperCase()}
                    </div>
                    <p className="text-white font-semibold text-sm truncate w-full text-center">{leaderboard[1]?.name?.split(' ')[0]}</p>
                    <p className="text-amber-300 text-xs">{leaderboard[1]?.points?.toLocaleString()} pts</p>
                    <div className="bg-gradient-to-b from-slate-300 to-slate-500 h-24 w-full rounded-t-2xl flex flex-col items-center justify-center shadow-xl">
                      <Medal className="w-5 h-5 text-white mb-1" />
                      <span className="text-white font-bold text-sm">2nd</span>
                    </div>
                  </div>
                  {/* 1st */}
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}
                      className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-2xl ring-4 ring-yellow-400/50">
                      {leaderboard[0]?.name?.[0]?.toUpperCase()}
                    </motion.div>
                    <p className="text-white font-bold truncate w-full text-center">{leaderboard[0]?.name?.split(' ')[0]}</p>
                    <p className="text-yellow-300 text-sm font-bold">{leaderboard[0]?.points?.toLocaleString()} pts</p>
                    <div className="bg-gradient-to-b from-yellow-400 to-amber-500 h-36 w-full rounded-t-2xl flex flex-col items-center justify-center shadow-2xl">
                      <Crown className="w-7 h-7 text-white mb-1" />
                      <span className="text-white font-bold">1st</span>
                    </div>
                  </div>
                  {/* 3rd */}
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-xl ring-4 ring-amber-600/30">
                      {leaderboard[2]?.name?.[0]?.toUpperCase()}
                    </div>
                    <p className="text-white font-semibold text-sm truncate w-full text-center">{leaderboard[2]?.name?.split(' ')[0]}</p>
                    <p className="text-amber-300 text-xs">{leaderboard[2]?.points?.toLocaleString()} pts</p>
                    <div className="bg-gradient-to-b from-amber-600 to-amber-800 h-16 w-full rounded-t-2xl flex flex-col items-center justify-center shadow-xl">
                      <Award className="w-4 h-4 text-white mb-0.5" />
                      <span className="text-white font-bold text-sm">3rd</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Ranks 4-5 preview */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="space-y-2 max-w-lg mx-auto mb-8">
                {leaderboard.slice(3, 5).map((u, i) => (
                  <div key={u.id} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/10">
                    <span className="text-amber-400 font-bold w-8">#{i + 4}</span>
                    <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <p className="flex-1 text-white font-medium truncate">{u.name}</p>
                    <span className="text-amber-300 font-bold text-sm">{u.points?.toLocaleString()} pts</span>
                  </div>
                ))}
              </motion.div>

              <div className="text-center">
                <Link href="/leaderboard">
                  <Button size="lg" className="bg-white text-amber-800 hover:bg-amber-50 font-bold shadow-2xl px-10">
                    <Trophy className="w-4 h-4 mr-2" />
                    View Full Leaderboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Rate Us on Google */}
      <section id="rate-us" className="py-20 bg-gradient-to-b from-orange-50 to-amber-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-amber-100 text-amber-700 mb-4">
              <Star className="w-3 h-3 mr-1" />
              Earn Points
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-amber-900 mb-4">
              Rate Us on Google
            </h2>
            <p className="text-amber-700/70 text-lg max-w-xl mx-auto">
              Love your coffee? Leave us a Google review and earn <span className="font-bold text-amber-600">50 bonus points</span> instantly!
            </p>
          </div>

          {/* Review CTA Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-8 shadow-2xl border border-amber-100 mb-10"
          >
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Stars visual */}
              <div className="flex-shrink-0 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-xl">
                  <Star className="w-12 h-12 text-white fill-white" />
                </div>
                <div className="flex gap-1 justify-center">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className="w-6 h-6 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-amber-600 text-sm mt-1 font-medium">4.8 on Google</p>
              </div>

              {/* Steps */}
              <div className="flex-1">
                <h3 className="font-display text-2xl font-bold text-amber-900 mb-4">How to earn your 50 points</h3>
                <div className="space-y-3">
                  {[
                    { step: '1', text: 'Sign in to your Nelliy\'s account' },
                    { step: '2', text: 'Click the button below to open Google Maps' },
                    { step: '3', text: 'Leave an honest review (any star rating)' },
                    { step: '4', text: 'Come back and submit your Google username to claim points' },
                  ].map(item => (
                    <div key={item.step} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <span className="text-white font-bold text-xs">{item.step}</span>
                      </div>
                      <p className="text-amber-800 text-sm">{item.text}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <a
                    href={GOOGLE_REVIEW_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    <Star className="w-5 h-5 fill-white" />
                    Write a Google Review
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <Link href="/login">
                    <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50 h-12 px-6">
                      Claim My 50 Points
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-100"
          >
            <div className="bg-amber-50 px-6 py-4 flex items-center gap-3 border-b border-amber-100">
              <MapPin className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-bold text-amber-900">Nelliy's Coffee</p>
                <p className="text-amber-600 text-sm">Gazebo, Addis Ababa, Ethiopia</p>
              </div>
              <a
                href={GOOGLE_REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 text-amber-600 hover:text-amber-800 text-sm font-medium"
              >
                Open in Maps <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <NelliyMap />
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-amber-600 to-orange-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Start Earning Today!
            </h2>
            <p className="text-white/80 max-w-2xl mx-auto mb-6">
              Join thousands of coffee lovers who are earning free drinks and exclusive rewards at Nelliy's Coffee in Addis Ababa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-amber-700 hover:bg-amber-50 shadow-xl">
                  Create Free Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/admin/login">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Business Login
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <Badge className="bg-amber-100 text-amber-700 mb-4">
                <Phone className="w-3 h-3 mr-1" />
                Get in Touch
              </Badge>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-amber-900 mb-6">
                {t.contact}
              </h2>
              <p className="text-amber-700/70 mb-8">
                Have questions? We'd love to hear from you. Reach out to us through any of these channels.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-900">Phone</p>
                    <p className="text-amber-700/70">+251 976 222 266</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-900">Email</p>
                    <p className="text-amber-700/70">hello@nelliyrewards.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Globe className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-900">Website</p>
                    <a href="https://nelliy.com" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 hover:underline">nelliy.com</a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-900">Address</p>
                    <p className="text-amber-700/70">Gazebo, Addis Ababa, Ethiopia</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8">
              <h3 className="font-display text-xl font-bold text-amber-900 mb-6">
                Send us a message
              </h3>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-amber-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/Nelliys Logo Coffee-01.png" alt="Nelliy's Coffee" className="h-10 w-auto object-contain brightness-0 invert" />
              </div>
              <p className="text-white/70 text-sm">
                Addis Ababa's finest coffee experience. Earn points, unlock rewards, and enjoy premium coffee at Gazebo and beyond.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-white/70 text-sm">
                <li><Link href="/scan" className="hover:text-white">Scan QR</Link></li>
                <li><Link href="/rewards" className="hover:text-white">Rewards</Link></li>
                <li><Link href="/leaderboard" className="hover:text-white">Leaderboard</Link></li>
                <li><Link href="/order" className="hover:text-white">Order Ahead</Link></li>
                <li><a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1">Rate Us ⭐</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Business</h4>
              <ul className="space-y-2 text-white/70 text-sm">
                <li><Link href="/admin/login" className="hover:text-white">Admin Portal</Link></li>
                <li><Link href="/partner" className="hover:text-white">Partner With Us</Link></li>
                <li><Link href="/corporate" className="hover:text-white">Corporate Accounts</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-white/70 text-sm">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
                <li><Link href="/admin/login" className="hover:text-white text-white/30 hover:text-white/70 transition-colors">Admin</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-white/50 text-sm">
            © 2026 Nelliy's Coffee. All rights reserved. Made by ezera hailu, Ethiopia
          </div>
        </div>
      </footer>
    </div>
  )
}

function ContactForm() {
  const [form, setForm] = useState({ name: '', contact: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) { setSent(true); setForm({ name: '', contact: '', message: '' }) }
    } finally { setSending(false) }
  }

  if (sent) return (
    <div className="text-center py-8">
      <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <CheckCircle className="w-7 h-7 text-green-600" />
      </div>
      <p className="font-bold text-amber-900">Message sent!</p>
      <p className="text-amber-600 text-sm mt-1">We'll get back to you soon.</p>
      <button onClick={() => setSent(false)} className="mt-4 text-amber-600 text-sm underline">Send another</button>
    </div>
  )

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input placeholder="Your Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        className="bg-white border-amber-200 focus:border-amber-400" required />
      <Input placeholder="Email or Phone" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
        className="bg-white border-amber-200 focus:border-amber-400" required />
      <textarea placeholder="Your Message" rows={4} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
        className="w-full px-4 py-3 rounded-xl border border-amber-200 focus:border-amber-400 bg-white resize-none" required />
      <Button type="submit" disabled={sending} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white">
        {sending ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  )
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-black/30 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/30 hover:bg-black/40 transition-all group"
    >
      <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-display text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-white/60 text-sm">{description}</p>
    </motion.div>
  )
}
