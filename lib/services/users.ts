import { getSheetsClient, getSpreadsheetId, getSheetName } from '@/lib/sheets/client';

const USERS_SHEET_NAME = getSheetName('users');

export const UsersService = {
  async getAllUsers() {
    const sheets = await getSheetsClient();
    const spreadsheetId = getSpreadsheetId();

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${USERS_SHEET_NAME}!A:F`, // Assuming A-F for user fields
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return [];
      }

      const headers = rows[0];
      const users = rows.slice(1).map(row => {
        const user: Record<string, any> = {};
        headers.forEach((header, index) => {
          user[header] = row[index];
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
  }
};
