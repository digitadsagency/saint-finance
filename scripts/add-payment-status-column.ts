import dotenv from 'dotenv'
import { resolve } from 'path'
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

import { getSheetsClient, getSpreadsheetId } from '../lib/sheets/client'

async function addPaymentStatusColumn() {
  try {
    const sheets = await getSheetsClient()
    const spreadsheetId = getSpreadsheetId()
    
    console.log('Actualizando headers de payment_records para incluir payment_status...')
    
    // Obtener headers actuales
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'payment_records!A1:Z1'
    })
    
    const currentHeaders = res.data.values?.[0] || []
    console.log('Headers actuales:', currentHeaders)
    
    // Verificar si ya tiene payment_status
    if (currentHeaders.includes('payment_status')) {
      console.log('✅ La columna payment_status ya existe. No es necesario migrar.')
      return
    }
    
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
      'payment_method',
      'payment_status',  // Nueva columna
      'notes',
      'created_at',
      'updated_at'
    ]
    
    // Actualizar los headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'payment_records!A1:O1',
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
      range: 'payment_records!A2:N1000'
    })
    
    const existingData = dataRes.data.values || []
    
    if (existingData.length > 0) {
      console.log(`\nEncontrados ${existingData.length} registros existentes.`)
      console.log('Reorganizando datos para incluir la nueva columna payment_status...')
      
      // Reorganizar datos: insertar columna vacía para payment_status (posición 11)
      const reorganizedData = existingData.map(row => {
        // Asegurar que tenemos al menos 14 columnas (estructura anterior con payment_method)
        while (row.length < 14) {
          row.push('')
        }
        
        // Insertar payment_status vacío en la posición 11
        // Estructura anterior: 0-10 (id a payment_method), 11 (notes), 12 (created_at), 13 (updated_at)
        // Estructura nueva: 0-10 (id a payment_method), 11 (payment_status), 12 (notes), 13 (created_at), 14 (updated_at)
        
        // Calcular estatus automático basado en is_on_time
        const isOnTime = row[8] === 'true' || row[8] === true
        const autoStatus = isOnTime ? 'ok' : 'atrasado'
        
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
          row[10], // payment_method
          autoStatus, // payment_status (nuevo - calculado automáticamente)
          row[11], // notes (antes era posición 11, ahora 12)
          row[12], // created_at (antes era posición 12, ahora 13)
          row[13]  // updated_at (antes era posición 13, ahora 14)
        ]
      })
      
      // Actualizar los datos
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `payment_records!A2:O${existingData.length + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: reorganizedData
        }
      })
      
      console.log('✅ Datos reorganizados correctamente!')
      console.log(`   - ${existingData.length} registros actualizados`)
      console.log('   - Estatus asignado automáticamente: "ok" para pagos a tiempo, "atrasado" para pagos tardíos')
    }
    
    console.log('\n✅ Migración completada exitosamente!')
    
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

addPaymentStatusColumn()
