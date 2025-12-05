import { getSheetsClient, getSpreadsheetId } from '../sheets/client'

export interface SalaryRecord {
  id: string
  workspace_id: string
  user_id: string
  monthly_salary: number
  effective_month: string // YYYY-MM
  notes?: string
  created_at: string
  updated_at: string
}

export interface ClientBillingRecord {
  id: string
  workspace_id: string
  project_id: string
  monthly_amount: number
  payment_day: number // 1-31
  created_at: string
  updated_at: string
}

export interface PaymentRecord {
  id: string
  workspace_id: string
  project_id: string
  billing_id: string // Reference to ClientBillingRecord
  expected_amount: number
  paid_amount: number
  expected_date: string // YYYY-MM-DD (calculated from payment_day)
  paid_date: string // YYYY-MM-DD (actual payment date)
  is_on_time: boolean // Calculated: paid_date <= expected_date
  days_delay?: number // Calculated: days late (if delayed)
  notes?: string
  created_at: string
  updated_at: string
}

export interface ExpenseRecord {
  id: string
  workspace_id: string
  description: string
  amount: number
  expense_type: 'fixed' | 'variable' // fixed = mensual, variable = una vez
  date: string // YYYY-MM-DD (fecha de compra/inicio)
  is_installment?: boolean // Si es a meses sin intereses
  installment_months?: number // Cuántos meses dura la compra
  monthly_payment?: number // Pago mensual calculado (amount / installment_months)
  notes?: string
  created_at: string
  updated_at: string
}

export interface IncomeRecord {
  id: string
  workspace_id: string
  description: string
  amount: number
  date: string // YYYY-MM-DD
  project_id?: string // Cliente/proyecto relacionado (opcional)
  notes?: string
  created_at: string
  updated_at: string
}

export type WorklogType = 'video' | 'design' | 'photo' | 'other'

export interface WorklogRecord {
  id: string
  workspace_id: string
  user_id: string
  project_id?: string
  type: WorklogType
  hours: number
  date: string // YYYY-MM-DD
  notes?: string
  created_at: string
  updated_at: string
}

export class FinanceService {
  private static async getSheet() {
    const sheets = await getSheetsClient()
    const spreadsheetId = getSpreadsheetId()
    return { sheets, spreadsheetId }
  }

  private static async ensureSheetExists(sheetName: string, headers: string[]) {
    const { sheets, spreadsheetId } = await this.getSheet()
    const metadata = await sheets.spreadsheets.get({ spreadsheetId })
    const exists = metadata.data.sheets?.some(s => s.properties?.title === sheetName)
    if (!exists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            { addSheet: { properties: { title: sheetName } } }
          ]
        }
      })
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1:${String.fromCharCode(64 + headers.length)}1`,
        valueInputOption: 'RAW',
        requestBody: { values: [headers] }
      })
    }
  }

  // Helper to handle quota exceeded errors with exponential backoff
  private static async withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn()
      } catch (error: any) {
        const status = error?.response?.status || error?.status || error?.code
        const isQuotaError = status === 429 || error?.message?.includes('Quota exceeded')
        
        if (isQuotaError && attempt < retries) {
          // Exponential backoff: 2s, 4s, 8s
          const delay = Math.min(2000 * Math.pow(2, attempt), 10000)
          console.warn(`⚠️ Quota exceeded, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        throw error
      }
    }
    throw new Error('Max retries exceeded')
  }

  // SALARIES
  static async listSalaries(workspaceId: string): Promise<SalaryRecord[]> {
    await this.ensureSheetExists('salaries', ['id','workspace_id','user_id','monthly_salary','effective_month','notes','created_at','updated_at'])
    const { sheets, spreadsheetId } = await this.getSheet()
    const res = await this.withRetry(() => sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'salaries!A2:H10000'
    }))
    const rows = res.data.values || []
    return rows
      .filter(r => r[1] === workspaceId)
      .map(r => ({
        id: r[0],
        workspace_id: r[1],
        user_id: r[2],
        monthly_salary: parseFloat(r[3] || '0'),
        effective_month: r[4],
        notes: r[5],
        created_at: r[6],
        updated_at: r[7]
      }))
  }

  static async createSalary(data: Omit<SalaryRecord, 'id' | 'created_at' | 'updated_at'>): Promise<SalaryRecord> {
    await this.ensureSheetExists('salaries', ['id','workspace_id','user_id','monthly_salary','effective_month','notes','created_at','updated_at'])
    const { sheets, spreadsheetId } = await this.getSheet()
    const id = `sal-${Date.now()}`
    const now = new Date().toISOString()
    const row = [id, data.workspace_id, data.user_id, data.monthly_salary, data.effective_month, data.notes || '', now, now]
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'salaries!A:H',
      valueInputOption: 'RAW',
      requestBody: { values: [row] }
    })
    return { id, ...data, created_at: now, updated_at: now }
  }

  // CLIENT BILLING
  static async listClientBilling(workspaceId: string): Promise<ClientBillingRecord[]> {
    await this.ensureSheetExists('client_billing', ['id','workspace_id','project_id','monthly_amount','payment_day','created_at','updated_at'])
    const { sheets, spreadsheetId } = await this.getSheet()
    const res = await this.withRetry(() => sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'client_billing!A2:H10000'
    }))
    const rows = res.data.values || []
    return rows
      .filter(r => r[1] === workspaceId)
      .map(r => ({
        id: r[0],
        workspace_id: r[1],
        project_id: r[2],
        monthly_amount: parseFloat(r[3] || '0'),
        payment_day: parseInt(r[4] || '1'),
        created_at: r[5],
        updated_at: r[6]
      }))
  }

  static async createClientBilling(data: Omit<ClientBillingRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ClientBillingRecord> {
    await this.ensureSheetExists('client_billing', ['id','workspace_id','project_id','monthly_amount','payment_day','created_at','updated_at'])
    const { sheets, spreadsheetId } = await this.getSheet()
    const id = `bill-${Date.now()}`
    const now = new Date().toISOString()
    const row = [id, data.workspace_id, data.project_id, data.monthly_amount, data.payment_day, now, now]
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'client_billing!A:G',
      valueInputOption: 'RAW',
      requestBody: { values: [row] }
    })
    return { id, ...data, created_at: now, updated_at: now }
  }

  static async updateClientBilling(id: string, data: Partial<Omit<ClientBillingRecord, 'id' | 'created_at' | 'workspace_id'>>): Promise<ClientBillingRecord> {
    await this.ensureSheetExists('client_billing', ['id','workspace_id','project_id','monthly_amount','payment_day','created_at','updated_at'])
    const { sheets, spreadsheetId } = await this.getSheet()
    
    // Get existing record
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'client_billing!A2:H10000'
    })
    const rows = res.data.values || []
    const rowIndex = rows.findIndex(r => r[0] === id)
    
    if (rowIndex === -1) {
      throw new Error('Client billing not found')
    }
    
    const existingRow = rows[rowIndex]
    const existingRecord: ClientBillingRecord = {
      id: existingRow[0],
      workspace_id: existingRow[1],
      project_id: existingRow[2],
      monthly_amount: parseFloat(existingRow[3] || '0'),
      payment_day: parseInt(existingRow[4] || '1'),
      created_at: existingRow[5],
      updated_at: existingRow[6]
    }
    
    const updatedData: ClientBillingRecord = {
      ...existingRecord,
      monthly_amount: data.monthly_amount !== undefined ? data.monthly_amount : existingRecord.monthly_amount,
      payment_day: data.payment_day !== undefined ? data.payment_day : existingRecord.payment_day,
      updated_at: new Date().toISOString()
    }
    
    const updatedRow = [
      updatedData.id,
      updatedData.workspace_id,
      updatedData.project_id,
      updatedData.monthly_amount,
      updatedData.payment_day,
      updatedData.created_at,
      updatedData.updated_at
    ]
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `client_billing!A${rowIndex + 2}:G${rowIndex + 2}`,
      valueInputOption: 'RAW',
      requestBody: { values: [updatedRow] }
    })
    
    return updatedData
  }

  // PAYMENT RECORDS (actual payments received)
  static async listPaymentRecords(workspaceId: string, month?: string): Promise<PaymentRecord[]> {
    await this.ensureSheetExists('payment_records', ['id','workspace_id','project_id','billing_id','expected_amount','paid_amount','expected_date','paid_date','is_on_time','days_delay','notes','created_at','updated_at'])
    const { sheets, spreadsheetId } = await this.getSheet()
    const res = await this.withRetry(() => sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'payment_records!A2:M10000'
    }))
    const rows = res.data.values || []
    let records = rows
      .filter(r => r[1] === workspaceId)
      .map(r => {
        const expectedDate = r[6] || ''
        const paidDate = r[7] || ''
        const isOnTime = r[8] === 'true' || r[8] === true
        return {
          id: r[0],
          workspace_id: r[1],
          project_id: r[2],
          billing_id: r[3],
          expected_amount: parseFloat(r[4] || '0'),
          paid_amount: parseFloat(r[5] || '0'),
          expected_date: expectedDate,
          paid_date: paidDate,
          is_on_time: isOnTime,
          days_delay: r[9] ? parseInt(r[9]) : undefined,
          notes: r[10],
          created_at: r[11],
          updated_at: r[12]
        }
      })
    
    // Filter by month if provided (YYYY-MM format)
    if (month) {
      records = records.filter(r => r.paid_date.startsWith(month))
    }
    
    return records
  }

  static async createPaymentRecord(data: Omit<PaymentRecord, 'id' | 'created_at' | 'updated_at' | 'is_on_time' | 'days_delay'>): Promise<PaymentRecord> {
    await this.ensureSheetExists('payment_records', ['id','workspace_id','project_id','billing_id','expected_amount','paid_amount','expected_date','paid_date','is_on_time','days_delay','notes','created_at','updated_at'])
    
    // Calculate is_on_time and days_delay
    const expectedDate = new Date(data.expected_date)
    const paidDate = new Date(data.paid_date)
    const isOnTime = paidDate <= expectedDate
    const daysDelay = !isOnTime ? Math.ceil((paidDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24)) : undefined
    
    const { sheets, spreadsheetId } = await this.getSheet()
    const id = `pr-${Date.now()}`
    const now = new Date().toISOString()
    const row = [
      id,
      data.workspace_id,
      data.project_id,
      data.billing_id,
      data.expected_amount,
      data.paid_amount,
      data.expected_date,
      data.paid_date,
      isOnTime.toString(),
      daysDelay?.toString() || '',
      data.notes || '',
      now,
      now
    ]
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'payment_records!A:M',
      valueInputOption: 'RAW',
      requestBody: { values: [row] }
    })
    return {
      id,
      ...data,
      is_on_time: isOnTime,
      days_delay: daysDelay,
      created_at: now,
      updated_at: now
    }
  }

  static async updatePaymentRecord(id: string, data: Partial<Omit<PaymentRecord, 'id' | 'created_at' | 'workspace_id' | 'is_on_time' | 'days_delay'>>): Promise<PaymentRecord> {
    await this.ensureSheetExists('payment_records', ['id','workspace_id','project_id','billing_id','expected_amount','paid_amount','expected_date','paid_date','is_on_time','days_delay','notes','created_at','updated_at'])
    const { sheets, spreadsheetId } = await this.getSheet()
    
    // Get existing record
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'payment_records!A2:M10000'
    })
    const rows = res.data.values || []
    const rowIndex = rows.findIndex(r => r[0] === id)
    
    if (rowIndex === -1) {
      throw new Error('Payment record not found')
    }
    
    const existingRow = rows[rowIndex]
    const existingRecord: PaymentRecord = {
      id: existingRow[0],
      workspace_id: existingRow[1],
      project_id: existingRow[2],
      billing_id: existingRow[3],
      expected_amount: parseFloat(existingRow[4] || '0'),
      paid_amount: parseFloat(existingRow[5] || '0'),
      expected_date: existingRow[6] || '',
      paid_date: existingRow[7] || '',
      is_on_time: existingRow[8] === 'true' || existingRow[8] === true,
      days_delay: existingRow[9] ? parseInt(existingRow[9]) : undefined,
      notes: existingRow[10] || '',
      created_at: existingRow[11],
      updated_at: existingRow[12]
    }
    
    // Merge with new data
    const updatedData = {
      ...existingRecord,
      ...data,
      expected_date: data.expected_date || existingRecord.expected_date,
      paid_date: data.paid_date || existingRecord.paid_date
    }
    
    // Recalculate is_on_time and days_delay
    const expectedDate = new Date(updatedData.expected_date)
    const paidDate = new Date(updatedData.paid_date)
    const isOnTime = paidDate <= expectedDate
    const daysDelay = !isOnTime ? Math.ceil((paidDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24)) : undefined
    
    const now = new Date().toISOString()
    const updatedRow = [
      existingRecord.id,
      existingRecord.workspace_id,
      updatedData.project_id,
      updatedData.billing_id,
      updatedData.expected_amount,
      updatedData.paid_amount,
      updatedData.expected_date,
      updatedData.paid_date,
      isOnTime.toString(),
      daysDelay?.toString() || '',
      updatedData.notes || '',
      existingRecord.created_at,
      now
    ]
    
    // Update the row (rowIndex + 2 because we start from row 2 in the sheet)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `payment_records!A${rowIndex + 2}:M${rowIndex + 2}`,
      valueInputOption: 'RAW',
      requestBody: { values: [updatedRow] }
    })
    
    return {
      ...updatedData,
      is_on_time: isOnTime,
      days_delay: daysDelay,
      updated_at: now
    }
  }

  static async deletePaymentRecord(id: string): Promise<void> {
    await this.ensureSheetExists('payment_records', ['id','workspace_id','project_id','billing_id','expected_amount','paid_amount','expected_date','paid_date','is_on_time','days_delay','notes','created_at','updated_at'])
    const { sheets, spreadsheetId } = await this.getSheet()
    
    // Get existing record to find row index
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'payment_records!A2:M10000'
    })
    const rows = res.data.values || []
    const rowIndex = rows.findIndex(r => r[0] === id)
    
    if (rowIndex === -1) {
      throw new Error('Payment record not found')
    }
    
    // Delete the row (rowIndex + 2 because we start from row 2 in the sheet)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: await this.getSheetId('payment_records'),
              dimension: 'ROWS',
              startIndex: rowIndex + 1, // +1 because sheets are 0-indexed but we start from row 2
              endIndex: rowIndex + 2
            }
          }
        }]
      }
    })
  }

  private static async getSheetId(sheetName: string): Promise<number> {
    const { sheets, spreadsheetId } = await this.getSheet()
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId })
    const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === sheetName)
    if (!sheet?.properties?.sheetId) {
      throw new Error(`Sheet ${sheetName} not found`)
    }
    return sheet.properties.sheetId
  }

  // WORKLOGS (time by type)
  static async listWorklogs(workspaceId: string): Promise<WorklogRecord[]> {
    await this.ensureSheetExists('worklogs', ['id','workspace_id','user_id','project_id','type','hours','date','notes','created_at','updated_at'])
    const { sheets, spreadsheetId } = await this.getSheet()
    const res = await this.withRetry(() => sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'worklogs!A2:J10000'
    }))
    const rows = res.data.values || []
    return rows
      .filter(r => r[1] === workspaceId)
      .map(r => ({
        id: r[0],
        workspace_id: r[1],
        user_id: r[2],
        project_id: r[3],
        type: (r[4] || 'other') as WorklogType,
        hours: parseFloat(r[5] || '0'),
        date: r[6],
        notes: r[7],
        created_at: r[8],
        updated_at: r[9]
      }))
  }

  static async createWorklog(data: Omit<WorklogRecord, 'id' | 'created_at' | 'updated_at'>): Promise<WorklogRecord> {
    await this.ensureSheetExists('worklogs', ['id','workspace_id','user_id','project_id','type','hours','date','notes','created_at','updated_at'])
    const { sheets, spreadsheetId } = await this.getSheet()
    const id = `wl-${Date.now()}`
    const now = new Date().toISOString()
    const row = [id, data.workspace_id, data.user_id, data.project_id || '', data.type, data.hours, data.date, data.notes || '', now, now]
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'worklogs!A:J',
      valueInputOption: 'RAW',
      requestBody: { values: [row] }
    })
    return { id, ...data, created_at: now, updated_at: now }
  }

  // EXPENSES
  static async listExpenses(workspaceId: string): Promise<ExpenseRecord[]> {
    await this.ensureSheetExists('expenses', ['id','workspace_id','description','amount','expense_type','date','is_installment','installment_months','monthly_payment','notes','created_at','updated_at'])
    const { sheets, spreadsheetId } = await this.getSheet()
    const res = await this.withRetry(() => sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'expenses!A2:L10000'
    }))
    const rows = res.data.values || []
    return rows
      .filter(r => r[1] === workspaceId)
      .map(r => {
        const isInstallment = r[6] === 'true' || r[6] === true
        const installmentMonths = parseInt(r[7] || '0') || 0
        const monthlyPayment = parseFloat(r[8] || '0') || (isInstallment && installmentMonths > 0 ? parseFloat(r[3] || '0') / installmentMonths : 0)
        return {
          id: r[0],
          workspace_id: r[1],
          description: r[2],
          amount: parseFloat(r[3] || '0'),
          expense_type: (r[4] || 'variable') as 'fixed' | 'variable',
          date: r[5],
          is_installment: isInstallment,
          installment_months: installmentMonths,
          monthly_payment: monthlyPayment,
          notes: r[9],
          created_at: r[10],
          updated_at: r[11]
        }
      })
  }

  static async createExpense(data: Omit<ExpenseRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ExpenseRecord> {
    await this.ensureSheetExists('expenses', ['id','workspace_id','description','amount','expense_type','date','is_installment','installment_months','monthly_payment','notes','created_at','updated_at'])
    const { sheets, spreadsheetId } = await this.getSheet()
    const id = `exp-${Date.now()}`
    const now = new Date().toISOString()
    
    // Calcular pago mensual si es a meses sin intereses
    const isInstallment = data.is_installment || false
    const installmentMonths = data.installment_months || 0
    const monthlyPayment = isInstallment && installmentMonths > 0 
      ? data.amount / installmentMonths 
      : (data.monthly_payment || 0)
    
    const row = [
      id, 
      data.workspace_id, 
      data.description, 
      data.amount, 
      data.expense_type, 
      data.date,
      isInstallment ? 'true' : 'false',
      installmentMonths || '',
      monthlyPayment || '',
      data.notes || '', 
      now, 
      now
    ]
    
    // Obtener la última fila con datos válidos en la columna A específicamente
    // Esto asegura que encontremos la última fila real, incluso si hay datos desfasados
    const lastRowData = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'expenses!A:A'
    })
    
    const aColumnValues = lastRowData.data.values || []
    let lastRow = 1 // Empezar desde la fila 1 (header)
    
    // Buscar la última fila que tenga un valor en la columna A (empezando desde abajo)
    for (let i = aColumnValues.length - 1; i >= 0; i--) {
      if (aColumnValues[i] && aColumnValues[i][0] && aColumnValues[i][0].trim() !== '') {
        lastRow = i + 1 // +1 porque el array es 0-indexed pero las filas empiezan en 1
        break
      }
    }
    
    // La siguiente fila será lastRow + 1
    const nextRow = lastRow + 1
    
    // Insertar directamente en la fila calculada, asegurando que empiece en la columna A
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `expenses!A${nextRow}:L${nextRow}`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] }
    })
    return { 
      id, 
      ...data, 
      monthly_payment: monthlyPayment,
      created_at: now, 
      updated_at: now 
    }
  }

  static async updateExpense(id: string, data: Partial<Omit<ExpenseRecord, 'id' | 'created_at' | 'workspace_id'>>): Promise<ExpenseRecord> {
    await this.ensureSheetExists('expenses', ['id','workspace_id','description','amount','expense_type','date','is_installment','installment_months','monthly_payment','notes','created_at','updated_at'])
    const { sheets, spreadsheetId } = await this.getSheet()
    
    // Get existing record
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'expenses!A2:L10000'
    })
    const rows = res.data.values || []
    const rowIndex = rows.findIndex(r => r[0] === id)
    
    if (rowIndex === -1) {
      throw new Error('Expense not found')
    }
    
    const existingRow = rows[rowIndex]
    const existingRecord: ExpenseRecord = {
      id: existingRow[0],
      workspace_id: existingRow[1],
      description: existingRow[2],
      amount: parseFloat(existingRow[3] || '0'),
      expense_type: (existingRow[4] || 'variable') as 'fixed' | 'variable',
      date: existingRow[5],
      is_installment: existingRow[6] === 'true' || existingRow[6] === true,
      installment_months: parseInt(existingRow[7] || '0') || 0,
      monthly_payment: parseFloat(existingRow[8] || '0'),
      notes: existingRow[9],
      created_at: existingRow[10],
      updated_at: existingRow[11]
    }
    
    // Merge with new data
    const updatedData = {
      ...existingRecord,
      ...data
    }
    
    // Recalculate monthly_payment if needed
    const isInstallment = updatedData.is_installment || false
    const installmentMonths = updatedData.installment_months || 0
    const monthlyPayment = isInstallment && installmentMonths > 0 
      ? updatedData.amount / installmentMonths 
      : (updatedData.monthly_payment || 0)
    
    const now = new Date().toISOString()
    const updatedRow = [
      existingRecord.id,
      existingRecord.workspace_id,
      updatedData.description,
      updatedData.amount,
      updatedData.expense_type,
      updatedData.date,
      isInstallment ? 'true' : 'false',
      installmentMonths || '',
      monthlyPayment || '',
      updatedData.notes || '',
      existingRecord.created_at,
      now
    ]
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `expenses!A${rowIndex + 2}:L${rowIndex + 2}`,
      valueInputOption: 'RAW',
      requestBody: { values: [updatedRow] }
    })
    
    return {
      ...updatedData,
      monthly_payment: monthlyPayment,
      updated_at: now
    }
  }

  static async deleteExpense(id: string): Promise<void> {
    await this.ensureSheetExists('expenses', ['id','workspace_id','description','amount','expense_type','date','is_installment','installment_months','monthly_payment','notes','created_at','updated_at'])
    const { sheets, spreadsheetId } = await this.getSheet()
    
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'expenses!A2:L10000'
    })
    const rows = res.data.values || []
    const rowIndex = rows.findIndex(r => r[0] === id)
    
    if (rowIndex === -1) {
      throw new Error('Expense not found')
    }
    
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: await this.getSheetId('expenses'),
              dimension: 'ROWS',
              startIndex: rowIndex + 1,
              endIndex: rowIndex + 2
            }
          }
        }]
      }
    })
  }

  // INCOMES
  static async listIncomes(workspaceId: string): Promise<IncomeRecord[]> {
    await this.ensureSheetExists('incomes', ['id','workspace_id','description','amount','date','project_id','notes','created_at','updated_at'])
    const { sheets, spreadsheetId } = await this.getSheet()
    const res = await this.withRetry(() => sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'incomes!A2:I10000'
    }))
    const rows = res.data.values || []
    return rows
      .filter(r => r[1] === workspaceId)
      .map(r => ({
        id: r[0],
        workspace_id: r[1],
        description: r[2],
        amount: parseFloat(r[3] || '0'),
        date: r[4],
        project_id: r[5],
        notes: r[6],
        created_at: r[7],
        updated_at: r[8]
      }))
  }

  static async createIncome(data: Omit<IncomeRecord, 'id' | 'created_at' | 'updated_at'>): Promise<IncomeRecord> {
    await this.ensureSheetExists('incomes', ['id','workspace_id','description','amount','date','project_id','notes','created_at','updated_at'])
    const { sheets, spreadsheetId } = await this.getSheet()
    const id = `inc-${Date.now()}`
    const now = new Date().toISOString()
    const row = [
      id,
      data.workspace_id,
      data.description,
      data.amount,
      data.date,
      data.project_id || '',
      data.notes || '',
      now,
      now
    ]
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'incomes!A:I',
      valueInputOption: 'RAW',
      requestBody: { values: [row] }
    })
    return { id, ...data, created_at: now, updated_at: now }
  }

  static async updateIncome(id: string, data: Partial<Omit<IncomeRecord, 'id' | 'created_at' | 'workspace_id'>>): Promise<IncomeRecord> {
    await this.ensureSheetExists('incomes', ['id','workspace_id','description','amount','date','project_id','notes','created_at','updated_at'])
    const { sheets, spreadsheetId } = await this.getSheet()
    
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'incomes!A2:I10000'
    })
    const rows = res.data.values || []
    const rowIndex = rows.findIndex(r => r[0] === id)
    
    if (rowIndex === -1) {
      throw new Error('Income not found')
    }
    
    const existingRow = rows[rowIndex]
    const existingRecord: IncomeRecord = {
      id: existingRow[0],
      workspace_id: existingRow[1],
      description: existingRow[2],
      amount: parseFloat(existingRow[3] || '0'),
      date: existingRow[4],
      project_id: existingRow[5],
      notes: existingRow[6],
      created_at: existingRow[7],
      updated_at: existingRow[8]
    }
    
    const updatedData = { ...existingRecord, ...data }
    const now = new Date().toISOString()
    const updatedRow = [
      existingRecord.id,
      existingRecord.workspace_id,
      updatedData.description,
      updatedData.amount,
      updatedData.date,
      updatedData.project_id || '',
      updatedData.notes || '',
      existingRecord.created_at,
      now
    ]
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `incomes!A${rowIndex + 2}:I${rowIndex + 2}`,
      valueInputOption: 'RAW',
      requestBody: { values: [updatedRow] }
    })
    
    return { ...updatedData, updated_at: now }
  }

  static async deleteIncome(id: string): Promise<void> {
    await this.ensureSheetExists('incomes', ['id','workspace_id','description','amount','date','project_id','notes','created_at','updated_at'])
    const { sheets, spreadsheetId } = await this.getSheet()
    
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'incomes!A2:I10000'
    })
    const rows = res.data.values || []
    const rowIndex = rows.findIndex(r => r[0] === id)
    
    if (rowIndex === -1) {
      throw new Error('Income not found')
    }
    
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: await this.getSheetId('incomes'),
              dimension: 'ROWS',
              startIndex: rowIndex + 1,
              endIndex: rowIndex + 2
            }
          }
        }]
      }
    })
  }

  // Update and delete salaries
  static async updateSalary(id: string, data: Partial<Omit<SalaryRecord, 'id' | 'created_at' | 'workspace_id'>>): Promise<SalaryRecord> {
    await this.ensureSheetExists('salaries', ['id','workspace_id','user_id','monthly_salary','effective_month','notes','created_at','updated_at'])
    const { sheets, spreadsheetId } = await this.getSheet()
    
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'salaries!A2:H10000'
    })
    const rows = res.data.values || []
    const rowIndex = rows.findIndex(r => r[0] === id)
    
    if (rowIndex === -1) {
      throw new Error('Salary not found')
    }
    
    const existingRow = rows[rowIndex]
    const existingRecord: SalaryRecord = {
      id: existingRow[0],
      workspace_id: existingRow[1],
      user_id: existingRow[2],
      monthly_salary: parseFloat(existingRow[3] || '0'),
      effective_month: existingRow[4],
      notes: existingRow[5],
      created_at: existingRow[6],
      updated_at: existingRow[7]
    }
    
    const updatedData = { ...existingRecord, ...data }
    const now = new Date().toISOString()
    const updatedRow = [
      existingRecord.id,
      existingRecord.workspace_id,
      updatedData.user_id,
      updatedData.monthly_salary,
      updatedData.effective_month,
      updatedData.notes || '',
      existingRecord.created_at,
      now
    ]
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `salaries!A${rowIndex + 2}:H${rowIndex + 2}`,
      valueInputOption: 'RAW',
      requestBody: { values: [updatedRow] }
    })
    
    return { ...updatedData, updated_at: now }
  }

  static async deleteSalary(id: string): Promise<void> {
    await this.ensureSheetExists('salaries', ['id','workspace_id','user_id','monthly_salary','effective_month','notes','created_at','updated_at'])
    const { sheets, spreadsheetId } = await this.getSheet()
    
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'salaries!A2:H10000'
    })
    const rows = res.data.values || []
    const rowIndex = rows.findIndex(r => r[0] === id)
    
    if (rowIndex === -1) {
      throw new Error('Salary not found')
    }
    
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: await this.getSheetId('salaries'),
              dimension: 'ROWS',
              startIndex: rowIndex + 1,
              endIndex: rowIndex + 2
            }
          }
        }]
      }
    })
  }
}


