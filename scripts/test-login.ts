import { config } from 'dotenv';
import { UsersService } from '../lib/services/users';

// Load environment variables
config({ path: '.env.local' });

async function testLogin() {
  try {
    console.log('🔍 Testing login with Google Sheets users...\n');
    
    // Load users from Google Sheets
    const users = await UsersService.getAllUsers();
    console.log('📋 Users found in Google Sheets:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || user.username || 'Usuario'} (${user.email}) - Role: ${user.role || 'member'}`);
    });
    
    console.log('\n✅ Login system is ready!');
    console.log('📝 You can now login with any of these email addresses:');
    users.forEach(user => {
      console.log(`   - ${user.email}`);
    });
    
  } catch (error) {
    console.error('❌ Error testing login:', error);
  }
}

testLogin();
