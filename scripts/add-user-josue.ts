import dotenv from 'dotenv'
import { getSheetsClient, getSpreadsheetId, getSheetName } from '../lib/sheets/client'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

async function addUser(name: string, email: string, role: string = 'member', avatar: string = '👨‍💼') {
  try {
    console.log(`🚀 Agregando usuario ${name}...`)
    
    const sheets = await getSheetsClient()
    const spreadsheetId = getSpreadsheetId()
    const sheetName = getSheetName('users')
    
    console.log(`📊 Trabajando con spreadsheet: ${spreadsheetId}`)
    console.log(`📋 Sheet: ${sheetName}`)
    
    // Obtener todos los usuarios para verificar si ya existe
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:G`,
    })
    
    const rows = response.data.values || []
    const headers = rows[0] || []
    
    // Verificar si el usuario ya existe
    const existingUsers = rows.slice(1)
    const userExists = existingUsers.some(row => {
      const emailIndex = headers.indexOf('email')
      const nameIndex = headers.indexOf('name')
      if (emailIndex >= 0 && row[emailIndex]) {
        return row[emailIndex].toLowerCase() === email.toLowerCase()
      }
      if (nameIndex >= 0 && row[nameIndex]) {
        return row[nameIndex].toLowerCase() === name.toLowerCase()
      }
      return false
    })
    
    if (userExists) {
      console.log(`⚠️  El usuario ${name} ya existe en la base de datos`)
      return
    }
    
    // Generar un ID único para el nuevo usuario
    const userId = `user-${Date.now()}`
    const now = new Date().toISOString()
    
    // Crear el nuevo usuario
    // Formato: id, email, name, role, avatar, password, created_at
    const newUser = [
      userId,
      email,
      name,
      role,
      avatar,
      'password123', // contraseña por defecto
      now
    ]
    
    // Agregar el usuario a la hoja
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:G`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [newUser]
      }
    })
    
    console.log(`✅ Usuario ${name} agregado exitosamente!`)
    console.log(`   ID: ${userId}`)
    console.log(`   Email: ${email}`)
    console.log(`   Nombre: ${name}`)
    console.log(`   Contraseña: password123`)
    console.log(`   Rol: ${role}`)
    
  } catch (error) {
    console.error(`❌ Error agregando usuario ${name}:`, error)
    throw error
  }
}

async function addUsers() {
  try {
    // Agregar Eduardo
    await addUser('Eduardo', 'eduardo@agencia.com', 'member', '👨‍💼')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// Ejecutar el script
addUsers()

