import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const menuItems = [
  // BREAKFAST
  { name: 'Croissant with Egg Sandwich', category: 'Breakfast', price: 495, bonusPoints: 0 },
  { name: 'Croissant with Avocado', category: 'Breakfast', price: 395, bonusPoints: 0 },
  { name: 'Croissant with Avocado, Bacon & Cheese', category: 'Breakfast', price: 549, bonusPoints: 0 },
  { name: 'Omelet and Avocado in Flax Bread', category: 'Breakfast', price: 449, bonusPoints: 0 },
  { name: 'Combo Breakfast', category: 'Breakfast', price: 495, bonusPoints: 0 },
  { name: 'Chechebsa with Nig-seed Paste & Boiled Egg', category: 'Breakfast', price: 495, bonusPoints: 0 },

  // WRAPS
  { name: "Nelliy's Special Healthy Beef Tef Wrap", category: 'Wraps', price: 749, bonusPoints: 10 },
  { name: 'Healthy Chicken Wrap', category: 'Wraps', price: 650, bonusPoints: 5 },
  { name: 'Fish Wrap', category: 'Wraps', price: 595, bonusPoints: 5 },
  { name: 'Healthy Vegetables Wrap', category: 'Wraps', price: 449, bonusPoints: 0 },
  { name: "Chef's Health Choice in the Toast", category: 'Wraps', price: 395, bonusPoints: 0 },

  // SANDWICHES
  { name: "Special Nelliy's Sandwich (good for 2 persons)", category: 'Sandwiches', price: 1400, bonusPoints: 20 },
  { name: 'Steak & Cheese Sandwich', category: 'Sandwiches', price: 649, bonusPoints: 5 },
  { name: 'Tasty Chicken Sandwich', category: 'Sandwiches', price: 649, bonusPoints: 5 },
  { name: 'Healthy Tuna Sandwich', category: 'Sandwiches', price: 750, bonusPoints: 10 },
  { name: 'Great Club Sandwich', category: 'Sandwiches', price: 700, bonusPoints: 5 },
  { name: 'Healthy Cold Sandwich', category: 'Sandwiches', price: 449, bonusPoints: 0 },

  // BURGERS
  { name: "Nelliy's Super Burger", category: 'Burgers', price: 695, bonusPoints: 10 },
  { name: 'Cheese Burger', category: 'Burgers', price: 595, bonusPoints: 5 },
  { name: 'Beef Burger', category: 'Burgers', price: 449, bonusPoints: 0 },
  { name: 'Mini Burger', category: 'Burgers', price: 395, bonusPoints: 0 },

  // EXTRAS
  { name: 'Extra Egg', category: 'Extras', price: 40, bonusPoints: 0 },
  { name: 'Extra Honey', category: 'Extras', price: 45, bonusPoints: 0 },
  { name: 'Extra Fruit', category: 'Extras', price: 45, bonusPoints: 0 },
  { name: 'Extra Cheese', category: 'Extras', price: 140, bonusPoints: 0 },
  { name: 'Extra Mayonnaise', category: 'Extras', price: 90, bonusPoints: 0 },
  { name: 'Extra Tuna', category: 'Extras', price: 190, bonusPoints: 0 },
  { name: 'Extra Beef', category: 'Extras', price: 150, bonusPoints: 0 },
  { name: 'Extra Chicken', category: 'Extras', price: 150, bonusPoints: 0 },
  { name: 'Extra Fish', category: 'Extras', price: 150, bonusPoints: 0 },
]

async function main() {
  console.log('Seeding menu items...')

  for (const item of menuItems) {
    // Use a safe lookup key for upsert.
    // If `name` is not a unique field in your schema, fall back to create/update by ID.
    const existing = await prisma.product.findFirst({ where: { name: item.name } })

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          ...item,
          // keep computed/required fields aligned with schema defaults
        },
      })
    } else {
      await prisma.product.create({
        data: {
          ...item,
          description: `Delicious ${item.name} from Nelliy's Coffee`,
          isAvailable: true,
          isRewardItem: false,
          stock: 999,
        },
      })
    }
  }

  console.log(`✅ Seeded ${menuItems.length} menu items`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
