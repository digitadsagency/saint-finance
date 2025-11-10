import { NextRequest, NextResponse } from 'next/server'
import { ProjectsService } from '@/lib/services/projects'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    let projects
    if (workspaceId) {
      projects = await ProjectsService.getAllProjects(workspaceId)
    } else {
      // If no workspace specified, return empty array
      projects = []
    }

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      workspace_id,
      name,
      description,
      priority,
      deadline,
      // Campos antiguos (para compatibilidad)
      monthly_videos,
      monthly_photos,
      monthly_designs,
      // Campos nuevos (tipos específicos)
      monthly_reel_corto,
      monthly_reel_largo,
      monthly_reel,
      monthly_video,
      monthly_diseno_simple,
      monthly_diseno_complejo,
      monthly_diseno,
      monthly_foto_simple,
      monthly_foto_elaborada,
      monthly_foto,
      monthly_recording_sessions
    } = body

    if (!workspace_id || !name) {
      return NextResponse.json({ error: 'workspace_id and name are required' }, { status: 400 })
    }

    const newProject = await ProjectsService.createProject(workspace_id, {
      name,
      description: description || '',
      priority: priority || 'medium',
      deadline: deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      // Campos antiguos (para compatibilidad)
      monthly_videos: monthly_videos || 0,
      monthly_photos: monthly_photos || 0,
      monthly_designs: monthly_designs || 0,
      // Campos nuevos (tipos específicos)
      monthly_reel_corto: monthly_reel_corto || 0,
      monthly_reel_largo: monthly_reel_largo || 0,
      monthly_reel: monthly_reel || 0,
      monthly_video: monthly_video || 0,
      monthly_diseno_simple: monthly_diseno_simple || 0,
      monthly_diseno_complejo: monthly_diseno_complejo || 0,
      monthly_diseno: monthly_diseno || 0,
      monthly_foto_simple: monthly_foto_simple || 0,
      monthly_foto_elaborada: monthly_foto_elaborada || 0,
      monthly_foto: monthly_foto || 0,
      monthly_recording_sessions: monthly_recording_sessions || 0
    })

    return NextResponse.json(newProject, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
