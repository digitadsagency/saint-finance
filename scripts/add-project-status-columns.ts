/**
 * Script para añadir las columnas paused_at y reactivated_at a la hoja de projects
 */
require('dotenv').config({ path: '.env.local' })

import { google } from 'googleapis'

async function main() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  const sheets = google.sheets({ version: 'v4', auth })
  const spreadsheetId = process.env.SHEETS_SPREADSHEET_ID

  if (!spreadsheetId) {
    console.error('❌ SHEETS_SPREADSHEET_ID no está definido')
    process.exit(1)
  }

  console.log('📊 Conectando a Google Sheets...')
  console.log(`   Spreadsheet ID: ${spreadsheetId}`)

  try {
    // Obtener los headers actuales
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'projects!A1:Z1',
    })

    const headers = response.data.values?.[0] || []
    console.log('\n📋 Headers actuales:', headers)
    console.log(`   Total de columnas: ${headers.length}`)

    // Verificar si ya existen las columnas
    const hasPausedAt = headers.includes('paused_at')
    const hasReactivatedAt = headers.includes('reactivated_at')

    if (hasPausedAt && hasReactivatedAt) {
      console.log('\n✅ Las columnas paused_at y reactivated_at ya existen')
      return
    }

    // Determinar qué columnas agregar
    const newHeaders = [...headers]
    
    // Asegurar que tenemos al menos 23 columnas (hasta monthly_recording_sessions)
    while (newHeaders.length < 23) {
      newHeaders.push('')
    }

    // Agregar las nuevas columnas
    if (!hasPausedAt) {
      newHeaders[23] = 'paused_at'
      console.log('➕ Agregando columna paused_at en posición 24 (X)')
    }
    if (!hasReactivatedAt) {
      newHeaders[24] = 'reactivated_at'
      console.log('➕ Agregando columna reactivated_at en posición 25 (Y)')
    }

    // Actualizar los headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'projects!A1:Y1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [newHeaders]
      }
    })

    console.log('\n✅ Headers actualizados correctamente')
    console.log('   Nuevos headers:', newHeaders)

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main()

