import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { findUserByEmail, verifyPassword, User } from './users'
import { UsersService } from './services/users'

const JWT_SECRET = process.env.JWT_SECRET || 'mini-monday-secret-key-2024'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'member'
  avatar?: string
}

export const createToken = (user: User): string => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      name: user.name,
      role: user.role,
      avatar: user.avatar
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export const verifyToken = (token: string): AuthUser | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser
    return decoded
  } catch (error) {
    return null
  }
}

export const authenticateUser = async (email: string, password: string): Promise<AuthUser | null> => {
  try {
    // First try to find user in Google Sheets
    const users = await UsersService.getAllUsers()
    const user = users.find(u => u.email === email)
    
    if (user) {
      // Check if password is hashed or plain text
      const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')
      
      let isValidPassword = false
      
      if (isHashed) {
        // Verify password using bcrypt
        const bcrypt = require('bcryptjs')
        isValidPassword = await bcrypt.compare(password, user.password)
      } else {
        // Direct comparison for plain text passwords
        isValidPassword = password === user.password
      }
      
      if (isValidPassword) {
        return {
          id: user.id,
          email: user.email,
          name: user.name || user.username || 'Usuario',
          role: user.role || 'member',
          avatar: user.avatar
        }
      }
    }
    
    // Fallback to hardcoded users for backward compatibility
    const hardcodedUser = findUserByEmail(email)
    if (hardcodedUser && verifyPassword(password, hardcodedUser.password)) {
      return {
        id: hardcodedUser.id,
        email: hardcodedUser.email,
        name: hardcodedUser.name,
        role: hardcodedUser.role,
        avatar: hardcodedUser.avatar
      }
    }
    
    return null
  } catch (error) {
    console.error('Error authenticating user:', error)
    return null
  }
}

export const getCurrentUser = (request: NextRequest): AuthUser | null => {
  const token = request.cookies.get('auth-token')?.value
  if (!token) {
    return null
  }

  return verifyToken(token)
}

export const setAuthCookie = (token: string): string => {
  return `auth-token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`
}

export const clearAuthCookie = (): string => {
  return `auth-token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`
}
