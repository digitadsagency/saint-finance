import dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(process.cwd(), '.env.local') })
import { getSheetsClient, getSpreadsheetId } from '../lib/sheets/client'

async function setupFinanceSheets() {
  try {
    console.log('🚀 Configurando hojas de Google Sheets para Finanzas...')
    
    const sheets = await getSheetsClient()
    const spreadsheetId = getSpreadsheetId()
    
    console.log(`📊 Trabajando con spreadsheet: ${spreadsheetId}`)
    
    // Hojas básicas necesarias
    await setupSheet(sheets, spreadsheetId, 'workspaces', [
      'id', 'name', 'description', 'owner_id', 'created_at', 'updated_at'
    ])
    
    await setupSheet(sheets, spreadsheetId, 'projects', [
      'id', 'workspace_id', 'name', 'description', 'status', 'priority', 'deadline', 'created_at', 'updated_at'
    ])
    
    await setupSheet(sheets, spreadsheetId, 'users', [
      'id', 'email', 'name', 'role', 'avatar', 'created_at'
    ])
    
    // Hojas de finanzas
    await setupSheet(sheets, spreadsheetId, 'salaries', [
      'id', 'workspace_id', 'user_id', 'monthly_salary', 'effective_month', 'notes', 'created_at', 'updated_at'
    ])
    
    await setupSheet(sheets, spreadsheetId, 'client_billing', [
      'id', 'workspace_id', 'project_id', 'monthly_amount', 'payment_day', 'created_at', 'updated_at'
    ])
    
    await setupSheet(sheets, spreadsheetId, 'payment_records', [
      'id', 'workspace_id', 'project_id', 'billing_id', 'expected_amount', 'paid_amount', 
      'expected_date', 'paid_date', 'is_on_time', 'days_delay', 'notes', 'created_at', 'updated_at'
    ])
    
    await setupSheet(sheets, spreadsheetId, 'worklogs', [
      'id', 'workspace_id', 'user_id', 'project_id', 'type', 'hours', 'date', 'notes', 'created_at', 'updated_at'
    ])
    
    await setupSheet(sheets, spreadsheetId, 'expenses', [
      'id', 'workspace_id', 'description', 'amount', 'expense_type', 'date', 
      'is_installment', 'installment_months', 'monthly_payment', 'notes', 'created_at', 'updated_at'
    ])
    
    await setupSheet(sheets, spreadsheetId, 'incomes', [
      'id', 'workspace_id', 'description', 'amount', 'date', 'project_id', 'notes', 'created_at', 'updated_at'
    ])
    
    console.log('✅ Configuración de hojas de finanzas completada!')
    console.log('\n📋 Hojas configuradas:')
    console.log('  - workspaces')
    console.log('  - projects')
    console.log('  - users')
    console.log('  - salaries')
    console.log('  - client_billing')
    console.log('  - payment_records')
    console.log('  - worklogs')
    console.log('  - expenses')
    console.log('  - incomes')
    
  } catch (error) {
    console.error('❌ Error configurando hojas:', error)
    process.exit(1)
  }
}

async function setupSheet(sheets: any, spreadsheetId: string, sheetName: string, headers: string[]) {
  try {
    // Verificar si la hoja existe
    const metadata = await sheets.spreadsheets.get({ spreadsheetId })
    const exists = metadata.data.sheets?.some(s => s.properties?.title === sheetName)
    
    if (!exists) {
      // Crear la hoja
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetName,
                gridProperties: {
                  rowCount: 1000,
                  columnCount: headers.length
                }
              }
            }
          }]
        }
      })
      console.log(`✅ Hoja creada: ${sheetName}`)
    } else {
      console.log(`📋 Hoja ya existe: ${sheetName}`)
    }
    
    // Agregar/actualizar headers
    const lastColumn = String.fromCharCode(64 + headers.length)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1:${lastColumn}1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers]
      }
    })
    console.log(`  ✓ Headers configurados para: ${sheetName}`)
    
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log(`📋 Hoja ${sheetName} ya existe, continuando...`)
    } else {
      console.error(`❌ Error configurando hoja ${sheetName}:`, error)
      throw error
    }
  }
}

// Ejecutar el setup
setupFinanceSheets()

