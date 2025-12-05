import dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(process.cwd(), '.env.local') })
import { getSheetsClient, getSpreadsheetId, getSheetName } from '../lib/sheets/client'

async function fixUsersHeaders() {
  try {
    console.log('🔧 Corrigiendo headers de la hoja users...')
    
    const sheets = await getSheetsClient()
    const spreadsheetId = getSpreadsheetId()
    const sheetName = getSheetName('users')
    
    // Headers correctos: id, email, name, role, avatar, password, created_at
    const correctHeaders = ['id', 'email', 'name', 'role', 'avatar', 'password', 'created_at']
    
    // Actualizar headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1:G1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [correctHeaders]
      }
    })
    
    console.log('✅ Headers corregidos exitosamente!')
    console.log('📋 Headers actualizados:')
    correctHeaders.forEach((header, index) => {
      console.log(`   ${index + 1}. ${header}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

fixUsersHeaders()

