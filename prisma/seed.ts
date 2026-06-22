import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Branches — delete fake ones, upsert real Gazebo branch
  await prisma.branch.deleteMany({
    where: { qrCode: { in: ['NELLIY-KAZA-001', 'NELLIY-BOLE-001', 'NELLIY-CMC-001', 'NELLIY-PIAS-001'] } }
  })

  const branch = await prisma.branch.upsert({
    where: { qrCode: 'NELLIY-GAZEBO-001' },
    update: {
      name: "Nelliy's Coffee — Gazebo",
      address: 'Gazebo, Addis Ababa, Ethiopia',
      phone: '+251976222266',
      openingTime: '07:00',
      closingTime: '22:00',
      isActive: true,
      latitude: 9.0012587,
      longitude: 38.7673834,
    },
    create: {
      name: "Nelliy's Coffee — Gazebo",
      address: 'Gazebo, Addis Ababa, Ethiopia',
      phone: '+251976222266',
      qrCode: 'NELLIY-GAZEBO-001',
      openingTime: '07:00',
      closingTime: '22:00',
      isActive: true,
      latitude: 9.0012587,
      longitude: 38.7673834,
    },
  })
  console.log(`✅ Gazebo branch ready — QR code: ${branch.qrCode}`)

  // Admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { phone: '+251900000000' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@nelliyrewards.com',
      phone: '+251900000000',
      password: adminPassword,
      role: 'SUPER_ADMIN',
      tier: 'VIP',
      points: 99999,
      referralCode: 'ADMIN001',
    },
  })
  console.log(`✅ Admin user: ${admin.email} / admin123`)

  // Demo customer
  const customerPassword = await bcrypt.hash('demo123', 12)
  const customer = await prisma.user.upsert({
    where: { phone: '+251911111111' },
    update: {},
    create: {
      name: 'Demo Customer',
      email: 'demo@example.com',
      phone: '+251911111111',
      password: customerPassword,
      role: 'CUSTOMER',
      tier: 'GOLD',
      points: 1250,
      referralCode: 'DEMO001',
    },
  })

  // Demo transactions
  await prisma.transaction.createMany({
    data: [
      { userId: customer.id, type: 'bonus', amount: 100, description: 'Welcome bonus' },
      { userId: customer.id, type: 'earned', amount: 85, description: 'Purchase at Bole Airport' },
      { userId: customer.id, type: 'earned', amount: 120, description: 'Purchase at Kazanchis' },
      { userId: customer.id, type: 'redeemed', amount: -100, description: 'Redeemed: Free Espresso' },
      { userId: customer.id, type: 'bonus', amount: 200, description: 'Referral bonus' },
    ],
    skipDuplicates: true,
  })
  console.log(`✅ Demo customer: ${customer.email} / demo123`)

  console.log('🎉 Seed complete!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
