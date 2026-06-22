import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminToken } from '@/lib/adminAuth'

const MENU_ITEMS = [
  // Breakfast
  { name: 'Croissant with Egg Sandwich', category: 'Breakfast', price: 495, bonusPoints: 15, description: 'Croissant with egg sandwich' },
  { name: 'Croissant with Avocado', category: 'Breakfast', price: 395, bonusPoints: 12, description: 'Croissant with avocado' },
  { name: 'Croissant with Avocado Bacon and Cheese', category: 'Breakfast', price: 549, bonusPoints: 17, description: 'Croissant with avocado, bacon and cheese' },
  { name: 'Omelet and Avocado in Flax Bread', category: 'Breakfast', price: 449, bonusPoints: 14, description: 'Omelet and avocado in flax bread' },
  { name: 'Combo Breakfast', category: 'Breakfast', price: 495, bonusPoints: 15, description: 'Cous-Cous, Omelet, Avocado, Salad, Chechebsa' },
  { name: 'Chechebsa with Nig-Seed Paste and Boiled Egg', category: 'Breakfast', price: 495, bonusPoints: 15, description: 'Chechebsa with nig-seed paste and boiled egg' },
  // Wraps
  { name: "Nelliy's Special Healthy Beef Tef Wrap", category: 'Wraps', price: 749, bonusPoints: 22, description: 'Herbed teff pita wraps with grilled tenderloin of beef, cheddar cheese, assorted grilled vegetables' },
  { name: 'Healthy Chicken Wrap', category: 'Wraps', price: 650, bonusPoints: 20, description: 'Herbed pita wraps with grilled chicken, mozzarella cheese, assorted grilled vegetables' },
  { name: 'Fish Wrap', category: 'Wraps', price: 595, bonusPoints: 18, description: 'Herbed pita wraps with grilled fish, mozzarella cheese, assorted grilled vegetables' },
  { name: 'Healthy Vegetables Wrap', category: 'Wraps', price: 449, bonusPoints: 14, description: 'Herbed pita wraps with seasoned assorted grilled vegetables' },
  { name: "Chef's Health Choice in the Toast", category: 'Wraps', price: 395, bonusPoints: 12, description: 'Seasoned fresh avocado with cherry tomatoes and legumes on wholegrain bread toast' },
  // Sandwiches
  { name: "Special Nelliy's Sandwich", category: 'Sandwiches', price: 1400, bonusPoints: 40, description: 'Grilled marinated tenderloin of beef, cheddar cheese, beef mortadella, chicken mortadella (good for 2)' },
  { name: 'Steak and Cheese Sandwich', category: 'Sandwiches', price: 649, bonusPoints: 20, description: 'Grilled marinated tenderloin of beef, mozzarella cheese, assorted grilled vegetables' },
  { name: 'Tasty Chicken Sandwich', category: 'Sandwiches', price: 649, bonusPoints: 20, description: 'Grilled marinated chicken, mozzarella cheese, assorted grilled vegetables' },
  { name: 'Healthy Tuna Sandwich', category: 'Sandwiches', price: 750, bonusPoints: 22, description: 'Chunk of tuna, assorted grilled vegetables, kidney beans, sweet corn with guacamole sauce' },
  { name: 'Great Club Sandwich', category: 'Sandwiches', price: 700, bonusPoints: 21, description: 'Stripes of marinated grilled chicken, assorted diced vegetables, boiled egg with ranch dressing' },
  { name: 'Healthy Cold Sandwich', category: 'Sandwiches', price: 449, bonusPoints: 14, description: 'Slices of chicken mortadella, beef mortadella, mozzarella cheese with ranch dressing' },
  // Burgers
  { name: "Nelliy's Super Burger", category: 'Burgers', price: 695, bonusPoints: 21, description: 'Marinated grilled beef pate, stripes of grilled tenderloin, cheddar cheese, chicken mortadella' },
  { name: 'Cheese Burger', category: 'Burgers', price: 595, bonusPoints: 18, description: 'Marinated grilled beef pate, provolone cheese, crunchy vegetables on fluffy bun' },
  { name: 'Beef Burger', category: 'Burgers', price: 449, bonusPoints: 14, description: 'Marinated grilled beef pate, crunchy vegetables on fluffy bun with mayonnaise sauce' },
  { name: 'Mini Burger', category: 'Burgers', price: 395, bonusPoints: 12, description: 'Marinated grilled mini beef pate, crunchy vegetables on fluffy mini bun' },
  // Extras
  { name: 'Extra Egg', category: 'Extras', price: 40, bonusPoints: 2, description: 'Extra egg' },
  { name: 'Extra Honey', category: 'Extras', price: 45, bonusPoints: 2, description: 'Extra honey' },
  { name: 'Extra Fruit', category: 'Extras', price: 45, bonusPoints: 2, description: 'Extra fruit' },
  { name: 'Extra Cheese', category: 'Extras', price: 140, bonusPoints: 4, description: 'Extra cheese' },
  { name: 'Extra Mayonnaise', category: 'Extras', price: 90, bonusPoints: 3, description: 'Extra mayonnaise' },
  { name: 'Extra Tuna', category: 'Extras', price: 190, bonusPoints: 6, description: 'Extra tuna' },
  { name: 'Extra Beef', category: 'Extras', price: 150, bonusPoints: 5, description: 'Extra beef' },
  { name: 'Extra Chicken', category: 'Extras', price: 150, bonusPoints: 5, description: 'Extra chicken' },
  { name: 'Extra Fish', category: 'Extras', price: 150, bonusPoints: 5, description: 'Extra fish' },
]

export async function POST(req: NextRequest) {
  const { error } = requireAdminToken(req)
  if (error) return error

  let created = 0, updated = 0

  for (const item of MENU_ITEMS) {
    const existing = await prisma.product.findFirst({ where: { name: item.name } })
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { price: item.price, bonusPoints: item.bonusPoints, category: item.category, description: item.description, isAvailable: true },
      })
      updated++
    } else {
      await prisma.product.create({
        data: { ...item, isAvailable: true, rewardPoints: 0, stock: 0 },
      })
      created++
    }
  }

  return NextResponse.json({ success: true, created, updated, total: MENU_ITEMS.length })
}
