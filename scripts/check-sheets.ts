import dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(process.cwd(), '.env.local') })
import { getSheetsClient, getSpreadsheetId } from '../lib/sheets/client'

async function checkSheets() {
  try {
    console.log('🔍 Verificando hojas en el spreadsheet...')
    
    const sheets = await getSheetsClient()
    const spreadsheetId = getSpreadsheetId()
    
    console.log(`📊 Spreadsheet ID: ${spreadsheetId}`)
    
    // Obtener todas las hojas del spreadsheet
    const metadata = await sheets.spreadsheets.get({ spreadsheetId })
    const existingSheets = metadata.data.sheets || []
    
    console.log(`\n📋 Hojas encontradas (${existingSheets.length}):`)
    existingSheets.forEach((sheet: any) => {
      console.log(`  - ${sheet.properties?.title} (ID: ${sheet.properties?.sheetId})`)
    })
    
    // Lista de hojas requeridas
    const requiredSheets = [
      'workspaces',
      'projects',
      'users',
      'salaries',
      'client_billing',
      'payment_records',
      'worklogs',
      'expenses',
      'incomes'
    ]
    
    const existingSheetNames = existingSheets.map((s: any) => s.properties?.title)
    const missingSheets = requiredSheets.filter(name => !existingSheetNames.includes(name))
    
    if (missingSheets.length > 0) {
      console.log(`\n⚠️  Hojas faltantes (${missingSheets.length}):`)
      missingSheets.forEach(name => console.log(`  - ${name}`))
    } else {
      console.log(`\n✅ Todas las hojas requeridas existen`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

checkSheets()

