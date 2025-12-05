import dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(process.cwd(), '.env.local') })
import { getSheetsClient, getSpreadsheetId } from '../lib/sheets/client'

async function forceCreateSheets() {
  try {
    console.log('🚀 Forzando creación de hojas en Google Sheets...')
    
    const sheets = await getSheetsClient()
    const spreadsheetId = getSpreadsheetId()
    
    console.log(`📊 Spreadsheet ID: ${spreadsheetId}`)
    console.log(`🔗 Link: https://docs.google.com/spreadsheets/d/${spreadsheetId}`)
    
    // Obtener hojas existentes
    const metadata = await sheets.spreadsheets.get({ spreadsheetId })
    const existingSheets = metadata.data.sheets || []
    const existingSheetNames = existingSheets.map((s: any) => s.properties?.title)
    
    // Definir hojas requeridas con sus headers
    const requiredSheets = [
      {
        name: 'workspaces',
        headers: ['id', 'name', 'description', 'owner_id', 'created_at', 'updated_at']
      },
      {
        name: 'projects',
        headers: ['id', 'workspace_id', 'name', 'description', 'status', 'priority', 'deadline', 'created_at', 'updated_at']
      },
      {
        name: 'users',
        headers: ['id', 'email', 'name', 'role', 'avatar', 'created_at']
      },
      {
        name: 'salaries',
        headers: ['id', 'workspace_id', 'user_id', 'monthly_salary', 'effective_month', 'notes', 'created_at', 'updated_at']
      },
      {
        name: 'client_billing',
        headers: ['id', 'workspace_id', 'project_id', 'monthly_amount', 'payment_day', 'created_at', 'updated_at']
      },
      {
        name: 'payment_records',
        headers: ['id', 'workspace_id', 'project_id', 'billing_id', 'expected_amount', 'paid_amount', 'expected_date', 'paid_date', 'is_on_time', 'days_delay', 'notes', 'created_at', 'updated_at']
      },
      {
        name: 'worklogs',
        headers: ['id', 'workspace_id', 'user_id', 'project_id', 'type', 'hours', 'date', 'notes', 'created_at', 'updated_at']
      },
      {
        name: 'expenses',
        headers: ['id', 'workspace_id', 'description', 'amount', 'expense_type', 'date', 'is_installment', 'installment_months', 'monthly_payment', 'notes', 'created_at', 'updated_at']
      },
      {
        name: 'incomes',
        headers: ['id', 'workspace_id', 'description', 'amount', 'date', 'project_id', 'notes', 'created_at', 'updated_at']
      }
    ]
    
    // Crear hojas faltantes
    const sheetsToCreate = requiredSheets.filter(sheet => !existingSheetNames.includes(sheet.name))
    
    if (sheetsToCreate.length > 0) {
      console.log(`\n📝 Creando ${sheetsToCreate.length} hojas faltantes...`)
      
      const requests = sheetsToCreate.map(sheet => ({
        addSheet: {
          properties: {
            title: sheet.name,
            gridProperties: {
              rowCount: 1000,
              columnCount: sheet.headers.length
            }
          }
        }
      }))
      
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests }
      })
      
      console.log(`✅ ${sheetsToCreate.length} hojas creadas`)
      sheetsToCreate.forEach(sheet => console.log(`   - ${sheet.name}`))
    } else {
      console.log(`\n✅ Todas las hojas ya existen`)
    }
    
    // Asegurar que todas las hojas tengan headers correctos
    console.log(`\n📋 Configurando headers en todas las hojas...`)
    for (const sheet of requiredSheets) {
      const lastColumn = String.fromCharCode(64 + sheet.headers.length)
      try {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheet.name}!A1:${lastColumn}1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [sheet.headers]
          }
        })
        console.log(`   ✓ ${sheet.name}`)
      } catch (error: any) {
        console.error(`   ✗ Error en ${sheet.name}:`, error.message)
      }
    }
    
    // Verificar hojas finales
    const finalMetadata = await sheets.spreadsheets.get({ spreadsheetId })
    const finalSheets = finalMetadata.data.sheets || []
    
    console.log(`\n✅ Proceso completado!`)
    console.log(`📊 Total de hojas en el spreadsheet: ${finalSheets.length}`)
    console.log(`\n🔗 Abre el spreadsheet aquí:`)
    console.log(`   https://docs.google.com/spreadsheets/d/${spreadsheetId}`)
    console.log(`\n📋 Hojas de finanzas:`)
    requiredSheets.forEach(sheet => {
      const exists = finalSheets.some((s: any) => s.properties?.title === sheet.name)
      console.log(`   ${exists ? '✅' : '❌'} ${sheet.name}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

forceCreateSheets()

