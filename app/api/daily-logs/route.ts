import { NextRequest, NextResponse } from 'next/server'
import { getSheetsClient, getSpreadsheetId, getSheetName } from '@/lib/sheets/client'
import { v4 as uuidv4 } from 'uuid'

const DAILY_LOGS_SHEET_NAME = getSheetName('daily_logs')

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const sheets = await getSheetsClient()
    const spreadsheetId = getSpreadsheetId()

    // Get daily logs
    const logsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${DAILY_LOGS_SHEET_NAME}!A:F`,
    })

    const logsRows = logsResponse.data.values
    if (!logsRows || logsRows.length === 0) {
      return NextResponse.json([])
    }

    const logsHeaders = logsRows[0]
    const logs = logsRows.slice(1).map(row => {
      const log: Record<string, any> = {}
      logsHeaders.forEach((header, index) => {
        log[header] = row[index]
      })
      return log
    })

    // Get users data to include author names
    const usersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${getSheetName('users')}!A:D`,
    })

    const usersRows = usersResponse.data.values
    let users: Record<string, any> = {}
    
    if (usersRows && usersRows.length > 1) {
      const usersHeaders = usersRows[0]
      usersRows.slice(1).forEach(row => {
        const user: Record<string, any> = {}
        usersHeaders.forEach((header, index) => {
          user[header] = row[index]
        })
        users[user.id] = user
      })
    }

    // Check if user is admin by looking up the user in the users data
    const currentUser = users[userId]
    const isAdmin = currentUser && ['miguel', 'raul', 'alvaro'].includes(
      (currentUser.name || currentUser.username || '').toLowerCase()
    )
    
    console.log('🔍 User check:', {
      userId,
      currentUser,
      isAdmin,
      userName: currentUser?.name || currentUser?.username
    })
    
    // Filter logs based on admin status
    const filteredLogs = isAdmin 
      ? logs // Admins see all logs
      : logs.filter(log => log.user_id === userId) // Regular users see only their logs

    // Add author information to each log
    const logsWithAuthors = filteredLogs.map(log => ({
      ...log,
      author_name: users[log.user_id]?.name || users[log.user_id]?.username || 'Usuario desconocido',
      author_avatar: users[log.user_id]?.avatar || '👤'
    }))
    
    return NextResponse.json(logsWithAuthors)
  } catch (error) {
    console.error('Error fetching daily logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily logs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, date, content } = body

    if (!user_id || !date || !content) {
      return NextResponse.json(
        { error: 'user_id, date, and content are required' },
        { status: 400 }
      )
    }

    const sheets = await getSheetsClient()
    const spreadsheetId = getSpreadsheetId()

    const newLog = {
      id: `log-${uuidv4()}`,
      user_id,
      date,
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${DAILY_LOGS_SHEET_NAME}!A:F`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [Object.values(newLog)],
      },
    })

    console.log('Daily log created in Google Sheets:', newLog)
    return NextResponse.json(newLog, { status: 201 })
  } catch (error) {
    console.error('Error creating daily log:', error)
    return NextResponse.json(
      { error: 'Failed to create daily log' },
      { status: 500 }
    )
  }
}
