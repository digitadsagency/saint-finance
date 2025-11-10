export interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  initials: string
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'user-1',
    name: 'Pablo',
    email: 'pablo@agencia.com',
    role: 'Directora Creativa',
    initials: 'P',
    avatar: '/avatars/pablo.jpg'
  },
  {
    id: 'user-2',
    name: 'Dani',
    email: 'dani@agencia.com',
    role: 'Desarrollador Frontend',
    initials: 'D',
    avatar: '/avatars/dani.jpg'
  },
  {
    id: 'user-3',
    name: 'Sandra',
    email: 'sandra@agencia.com',
    role: 'Diseñadora UX/UI',
    initials: 'S',
    avatar: '/avatars/sandra.jpg'
  },
  {
    id: 'user-4',
    name: 'Miguel',
    email: 'miguel@agencia.com',
    role: 'Especialista en Marketing',
    initials: 'M',
    avatar: '/avatars/miguel.jpg'
  },
  {
    id: 'user-5',
    name: 'Raul',
    email: 'raul@agencia.com',
    role: 'Gestora de Proyectos',
    initials: 'R',
    avatar: '/avatars/raul.jpg'
  },
  {
    id: 'user-6',
    name: 'Alvaro',
    email: 'alvaro@agencia.com',
    role: 'Desarrollador Backend',
    initials: 'A',
    avatar: '/avatars/alvaro.jpg'
  },
  {
    id: 'user-7',
    name: 'Angela',
    email: 'angela@agencia.com',
    role: 'Analista de Datos',
    initials: 'A',
    avatar: '/avatars/angela.jpg'
  },
  {
    id: 'user-8',
    name: 'Liz',
    email: 'liz@agencia.com',
    role: 'Coordinadora de Contenidos',
    initials: 'L',
    avatar: '/avatars/liz.jpg'
  }
]

export const getTeamMemberById = (id: string): TeamMember | undefined => {
  return TEAM_MEMBERS.find(member => member.id === id)
}

export const getTeamMemberName = (id: string): string => {
  const member = getTeamMemberById(id)
  return member ? member.name : 'Sin asignar'
}

export const getTeamMemberInitials = (id: string): string => {
  const member = getTeamMemberById(id)
  return member ? member.initials : '?'
}
