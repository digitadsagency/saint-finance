import dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

import { getSheetsClient, getSpreadsheetId } from '../lib/sheets/client'

async function addPaymentMethodColumn() {
  try {
    const sheets = await getSheetsClient()
    const spreadsheetId = getSpreadsheetId()
    
    console.log('Actualizando headers de payment_records para incluir payment_method...')
    
    // Obtener headers actuales
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'payment_records!A1:Z1'
    })
    
    const currentHeaders = res.data.values?.[0] || []
    console.log('Headers actuales:', currentHeaders)
    
    // Definir los nuevos headers correctos
    const newHeaders = [
      'id',
      'workspace_id', 
      'project_id',
      'billing_id',
      'expected_amount',
      'paid_amount',
      'expected_date',
      'paid_date',
      'is_on_time',
      'days_delay',
      'payment_method',  // Nueva columna
      'notes',
      'created_at',
      'updated_at'
    ]
    
    // Actualizar los headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'payment_records!A1:N1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [newHeaders]
      }
    })
    
    console.log('✅ Headers actualizados correctamente!')
    console.log('Nuevos headers:', newHeaders)
    
    // Verificar si hay datos existentes y mover las columnas si es necesario
    const dataRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'payment_records!A2:M1000'
    })
    
    const existingData = dataRes.data.values || []
    
    if (existingData.length > 0) {
      console.log(`\nEncontrados ${existingData.length} registros existentes.`)
      console.log('Reorganizando datos para incluir la nueva columna payment_method...')
      
      // Reorganizar datos: insertar columna vacía para payment_method (posición 10)
      const reorganizedData = existingData.map(row => {
        // Asegurar que tenemos al menos 13 columnas (estructura anterior)
        while (row.length < 13) {
          row.push('')
        }
        
        // Insertar payment_method vacío en la posición 10
        // Estructura anterior: 0-9 (id a days_delay), 10 (notes), 11 (created_at), 12 (updated_at)
        // Estructura nueva: 0-9 (id a days_delay), 10 (payment_method), 11 (notes), 12 (created_at), 13 (updated_at)
        return [
          row[0],  // id
          row[1],  // workspace_id
          row[2],  // project_id
          row[3],  // billing_id
          row[4],  // expected_amount
          row[5],  // paid_amount
          row[6],  // expected_date
          row[7],  // paid_date
          row[8],  // is_on_time
          row[9],  // days_delay
          '',      // payment_method (nuevo - vacío)
          row[10], // notes (antes era posición 10, ahora 11)
          row[11], // created_at (antes era posición 11, ahora 12)
          row[12]  // updated_at (antes era posición 12, ahora 13)
        ]
      })
      
      // Actualizar los datos
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `payment_records!A2:N${existingData.length + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: reorganizedData
        }
      })
      
      console.log('✅ Datos reorganizados correctamente!')
    }
    
    console.log('\n✅ Migración completada exitosamente!')
    
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

addPaymentMethodColumn()
