import { getSheetsClient, getSpreadsheetId, getSheetName } from '@/lib/sheets/client';

const USERS_SHEET_NAME = getSheetName('users');

// Helper to handle quota exceeded errors
async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      const status = error?.response?.status || error?.status || error?.code
      const isQuotaError = status === 429 || error?.message?.includes('Quota exceeded')
      
      if (isQuotaError && attempt < retries) {
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

export const UsersService = {
  async getAllUsers() {
    const sheets = await getSheetsClient();
    const spreadsheetId = getSpreadsheetId();

    try {
      const response = await withRetry(() => sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${USERS_SHEET_NAME}!A:G`, // A-G: id, email, name, role, avatar, password, created_at
      }));

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return [];
      }

      const headers = rows[0];
      // Headers esperados: id, email, name, role, avatar, password, created_at
      const expectedHeaders = ['id', 'email', 'name', 'role', 'avatar', 'password', 'created_at'];
      
      const users = rows.slice(1).map(row => {
        const user: Record<string, any> = {};
        // Mapear por posición según los headers esperados
        expectedHeaders.forEach((header, index) => {
          if (row[index] !== undefined && row[index] !== null && row[index] !== '') {
            user[header] = row[index];
          }
        });
        return user;
      });

      console.log('✅ Users loaded from Google Sheets:', users);
      return users;
    } catch (error) {
      console.error('Error fetching users from Google Sheets:', error);
      throw error;
    }
  },

  async getUserById(userId: string) {
    const users = await this.getAllUsers();
    return users.find(user => user.id === userId);
  },

  async createUser(data: { name: string; email: string; password?: string; role?: string; avatar?: string }) {
    const sheets = await getSheetsClient();
    const spreadsheetId = getSpreadsheetId();

    try {
      // Verificar si el usuario ya existe
      const existingUsers = await this.getAllUsers();
      const userExists = existingUsers.some(u => 
        (u.email || '').toLowerCase() === data.email.toLowerCase() ||
        (u.name || '').toLowerCase() === data.name.toLowerCase()
      );

      if (userExists) {
        throw new Error('El usuario ya existe');
      }

      // Generar ID único
      const userId = `user-${Date.now()}`;
      const now = new Date().toISOString();

      // Crear nuevo usuario
      const newUser = [
        userId,
        data.email,
        data.name,
        data.role || 'member',
        data.avatar || '👨‍💼',
        data.password || 'password123',
        now
      ];

      await withRetry(() => sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${USERS_SHEET_NAME}!A:G`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [newUser]
        }
      }));

      return {
        id: userId,
        email: data.email,
        name: data.name,
        role: data.role || 'member',
        avatar: data.avatar || '👨‍💼',
        password: data.password || 'password123',
        created_at: now
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
};
