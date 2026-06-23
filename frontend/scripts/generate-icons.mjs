import sharp from 'sharp'
import { existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const INPUT = resolve(__dirname, '../public/icpep_logo.png')
const OUTPUT_DIR = resolve(__dirname, '../public')

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true })

const icons = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
]

console.log('🎨 Generating PWA icons from icpep_logo.png...\n')

for (const icon of icons) {
  const outputPath = resolve(OUTPUT_DIR, icon.name)
  await sharp(INPUT)
    .resize(icon.size, icon.size, {
      fit: 'contain',
      background: { r: 0, g: 31, b: 77, alpha: 1 }, // #001F4D navy background
    })
    .png()
    .toFile(outputPath)
  console.log(`✅ Generated: ${icon.name} (${icon.size}x${icon.size})`)
}

console.log('\n🎉 All icons generated successfully!')