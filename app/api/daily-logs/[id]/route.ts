import { NextRequest, NextResponse } from 'next/server'
import { getSheetsClient, getSpreadsheetId, getSheetName } from '@/lib/sheets/client'

const DAILY_LOGS_SHEET_NAME = getSheetName('daily_logs')

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sheets = await getSheetsClient()
    const spreadsheetId = getSpreadsheetId()

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${DAILY_LOGS_SHEET_NAME}!A:F`,
    })

    const rows = response.data.values
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 })
    }

    const headers = rows[0]
    const logIndex = rows.findIndex(row => row[0] === params.id)

    if (logIndex === -1) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 })
    }

    const log: Record<string, any> = {}
    headers.forEach((header, index) => {
      log[header] = rows[logIndex][index]
    })

    return NextResponse.json(log)
  } catch (error) {
    console.error('Error fetching daily log:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily log' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json(
        { error: 'content is required' },
        { status: 400 }
      )
    }

    const sheets = await getSheetsClient()
    const spreadsheetId = getSpreadsheetId()

    // Find the log row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${DAILY_LOGS_SHEET_NAME}!A:F`,
    })

    const rows = response.data.values
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 })
    }

    const headers = rows[0]
    const logIndex = rows.findIndex(row => row[0] === params.id)

    if (logIndex === -1) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 })
    }

    const currentRow = rows[logIndex]
    const updatedRow = [...currentRow]
    
    // Update content and updated_at
    const contentIndex = headers.indexOf('content')
    const updatedAtIndex = headers.indexOf('updated_at')
    
    if (contentIndex !== -1) {
      updatedRow[contentIndex] = content
    }
    if (updatedAtIndex !== -1) {
      updatedRow[updatedAtIndex] = new Date().toISOString()
    }

    // Update the row in Google Sheets
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${DAILY_LOGS_SHEET_NAME}!A${logIndex + 1}:F${logIndex + 1}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [updatedRow],
      },
    })

    // Return updated log
    const updatedLog: Record<string, any> = {}
    headers.forEach((header, index) => {
      updatedLog[header] = updatedRow[index]
    })

    console.log('Daily log updated in Google Sheets:', updatedLog)
    return NextResponse.json(updatedLog)
  } catch (error) {
    console.error('Error updating daily log:', error)
    return NextResponse.json(
      { error: 'Failed to update daily log' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sheets = await getSheetsClient()
    const spreadsheetId = getSpreadsheetId()

    // Find the log row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${DAILY_LOGS_SHEET_NAME}!A:F`,
    })

    const rows = response.data.values
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 })
    }

    const logIndex = rows.findIndex(row => row[0] === params.id)

    if (logIndex === -1) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 })
    }

    // Delete the row by clearing it
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${DAILY_LOGS_SHEET_NAME}!A${logIndex + 1}:F${logIndex + 1}`,
    })

    console.log('Daily log deleted from Google Sheets:', params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting daily log:', error)
    return NextResponse.json(
      { error: 'Failed to delete daily log' },
      { status: 500 }
    )
  }
}
