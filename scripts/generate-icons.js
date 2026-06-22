const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const INPUT = path.join(__dirname, '../public/Nelliys Logo Coffee-01.png')
const OUTPUT_DIR = path.join(__dirname, '../public/icons')

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })

const SIZES = [32, 72, 96, 128, 144, 152, 192, 512]

async function generate() {
  for (const size of SIZES) {
    await sharp(INPUT)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 251, b: 235, alpha: 1 } })
      .png()
      .toFile(path.join(OUTPUT_DIR, `icon-${size}.png`))
    console.log(`✓ icon-${size}.png`)
  }

  for (const size of [192, 512]) {
    const padding = Math.floor(size * 0.1)
    await sharp(INPUT)
      .resize(size - padding * 2, size - padding * 2, { fit: 'contain', background: { r: 245, g: 158, b: 11, alpha: 1 } })
      .extend({ top: padding, bottom: padding, left: padding, right: padding, background: { r: 245, g: 158, b: 11, alpha: 1 } })
      .png()
      .toFile(path.join(OUTPUT_DIR, `icon-${size}-maskable.png`))
    console.log(`✓ icon-${size}-maskable.png`)
  }

  console.log('\n✅ All icons generated in public/icons/')
}

generate().catch(console.error)
