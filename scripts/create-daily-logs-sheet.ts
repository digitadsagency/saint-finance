import dotenv from 'dotenv'
import { getSheetsClient, getSpreadsheetId } from '@/lib/sheets/client'

// Load environment variables
dotenv.config({ path: '.env.local' })

const SPREADSHEET_ID = getSpreadsheetId()

async function createDailyLogsSheet() {
  try {
    const sheets = await getSheetsClient()
    
    // Check if daily_logs sheet exists
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    })
    
    const sheetExists = spreadsheet.data.sheets?.some(
      sheet => sheet.properties?.title === 'daily_logs'
    )
    
    if (!sheetExists) {
      // Create daily_logs sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'daily_logs',
                  gridProperties: {
                    rowCount: 1000,
                    columnCount: 6,
                  },
                },
              },
            },
          ],
        },
      })
      
      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'daily_logs!A1:F1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [['id', 'user_id', 'date', 'content', 'created_at', 'updated_at']],
        },
      })
      
      console.log('✅ Daily logs sheet created successfully')
    } else {
      console.log('✅ Daily logs sheet already exists')
    }
  } catch (error) {
    console.error('❌ Error creating daily logs sheet:', error)
  }
}

// Run the function
createDailyLogsSheet()
