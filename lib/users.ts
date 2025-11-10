import bcrypt from 'bcryptjs'

export interface User {
  id: string
  email: string
  name: string
  password: string
  role: 'owner' | 'admin' | 'member'
  avatar?: string
}

// Usuarios de prueba para la agencia de marketing
export const demoUsers: User[] = [
  {
    id: 'user-1',
    email: 'maria.garcia@agencia.com',
    name: 'María García',
    password: bcrypt.hashSync('password123', 10),
    role: 'owner',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'user-2',
    email: 'carlos.lopez@agencia.com',
    name: 'Carlos López',
    password: bcrypt.hashSync('password123', 10),
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'user-3',
    email: 'ana.martin@agencia.com',
    name: 'Ana Martín',
    password: bcrypt.hashSync('password123', 10),
    role: 'member',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'user-4',
    email: 'david.rodriguez@agencia.com',
    name: 'David Rodríguez',
    password: bcrypt.hashSync('password123', 10),
    role: 'member',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'user-5',
    email: 'laura.sanchez@agencia.com',
    name: 'Laura Sánchez',
    password: bcrypt.hashSync('password123', 10),
    role: 'member',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'user-6',
    email: 'juan.perez@agencia.com',
    name: 'Juan Pérez',
    password: bcrypt.hashSync('password123', 10),
    role: 'member',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'user-7',
    email: 'sofia.gonzalez@agencia.com',
    name: 'Sofía González',
    password: bcrypt.hashSync('password123', 10),
    role: 'member',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face'
  }
]

export const findUserByEmail = (email: string): User | undefined => {
  return demoUsers.find(user => user.email === email)
}

export const findUserById = (id: string): User | undefined => {
  return demoUsers.find(user => user.id === id)
}

export const verifyPassword = (password: string, hashedPassword: string): boolean => {
  return bcrypt.compareSync(password, hashedPassword)
}
