/**
 * Script para corregir los headers de la hoja de projects
 * Los headers deben estar en este orden:
 * A: id, B: workspace_id, C: name, D: description, E: status, F: priority, G: deadline,
 * H: monthly_videos, I: monthly_photos, J: monthly_designs, K: created_at, L: updated_at,
 * M: monthly_reel_corto, N: monthly_reel_largo, O: monthly_reel, P: monthly_video,
 * Q: monthly_diseno_simple, R: monthly_diseno_complejo, S: monthly_diseno,
 * T: monthly_foto_simple, U: monthly_foto_elaborada, V: monthly_foto,
 * W: monthly_recording_sessions, X: paused_at, Y: reactivated_at
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

  const correctHeaders = [
    'id',                      // A - 0
    'workspace_id',            // B - 1
    'name',                    // C - 2
    'description',             // D - 3
    'status',                  // E - 4
    'priority',                // F - 5
    'deadline',                // G - 6
    'monthly_videos',          // H - 7 (legacy)
    'monthly_photos',          // I - 8 (legacy)
    'monthly_designs',         // J - 9 (legacy)
    'created_at',              // K - 10
    'updated_at',              // L - 11
    'monthly_reel_corto',      // M - 12
    'monthly_reel_largo',      // N - 13
    'monthly_reel',            // O - 14
    'monthly_video',           // P - 15
    'monthly_diseno_simple',   // Q - 16
    'monthly_diseno_complejo', // R - 17
    'monthly_diseno',          // S - 18
    'monthly_foto_simple',     // T - 19
    'monthly_foto_elaborada',  // U - 20
    'monthly_foto',            // V - 21
    'monthly_recording_sessions', // W - 22
    'paused_at',               // X - 23
    'reactivated_at'           // Y - 24
  ]

  try {
    // Obtener headers actuales y datos
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'projects!A:Y',
    })

    const rows = response.data.values || []
    const currentHeaders = rows[0] || []
    
    console.log('\n📋 Headers actuales:', currentHeaders)
    console.log('\n📋 Headers correctos:', correctHeaders)

    // Mapear datos existentes al nuevo orden
    if (rows.length > 1) {
      console.log('\n📝 Reordenando datos existentes...')
      
      // Crear mapa de columnas actual -> índice
      const currentIndexMap = new Map<string, number>()
      currentHeaders.forEach((header: string, index: number) => {
        if (header) currentIndexMap.set(header, index)
      })

      // Reordenar cada fila de datos
      const newRows = [correctHeaders]
      
      for (let i = 1; i < rows.length; i++) {
        const oldRow = rows[i]
        const newRow: any[] = []
        
        for (let j = 0; j < correctHeaders.length; j++) {
          const header = correctHeaders[j]
          const oldIndex = currentIndexMap.get(header)
          
          if (oldIndex !== undefined && oldRow[oldIndex] !== undefined) {
            newRow[j] = oldRow[oldIndex]
          } else {
            newRow[j] = ''
          }
        }
        
        newRows.push(newRow)
      }

      // Limpiar y reescribir toda la hoja
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: 'projects!A:Z',
      })

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'projects!A1',
        valueInputOption: 'RAW',
        requestBody: {
          values: newRows
        }
      })

      console.log(`\n✅ ${newRows.length - 1} proyectos migrados correctamente`)
    } else {
      // Solo actualizar headers
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'projects!A1:Y1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [correctHeaders]
        }
      })
      console.log('\n✅ Headers actualizados (no hay datos para migrar)')
    }

    // Verificar resultado
    const verify = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'projects!A1:Y1',
    })
    console.log('\n📋 Headers finales:', verify.data.values?.[0])

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main()

