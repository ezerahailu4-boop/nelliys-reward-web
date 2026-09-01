import fs from 'fs'
import path from 'path'

/**
 * Saves a compressed receipt image to public storage so admins and customers can review it.
 * Falls back safely to base64 Data URI if disk writing is restricted in serverless.
 */
export async function saveReceiptImage(imageBuffer: Buffer, receiptNumber: string): Promise<string> {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'receipts')
    
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const safeReceiptNum = receiptNumber.replace(/[^a-zA-Z0-9_-]/g, '_')
    const fileName = `${safeReceiptNum}-${Date.now()}.jpg`
    const filePath = path.join(uploadDir, fileName)

    await fs.promises.writeFile(filePath, imageBuffer)
    return `/uploads/receipts/${fileName}`
  } catch (err: any) {
    console.warn('[ReceiptStorage] Filesystem write failed, falling back to base64 data URI:', err?.message)
    // Fallback: encode as compact base64 data URI
    return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
  }
}
