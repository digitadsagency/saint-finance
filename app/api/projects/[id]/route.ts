import { NextRequest, NextResponse } from 'next/server'
import { ProjectsService } from '@/lib/services/projects'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      status,
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

    const projectId = params.id

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const updatedProject = await ProjectsService.updateProject(projectId, {
      name,
      description,
      status,
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
    })

    return NextResponse.json(updatedProject, { status: 200 })
  } catch (error: any) {
    console.error('Error updating project:', error)
    if (error.message === 'Project not found') {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

