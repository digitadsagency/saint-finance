import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  if (process.env.PERF_HARDENING !== 'true') {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  try {
    const metric = await request.json()
    
    // Log to console/server logs
    console.log('[Web Vitals]', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      timestamp: new Date().toISOString(),
    })

    // In production, you might want to send to analytics service
    // e.g., Google Analytics, Sentry, etc.

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}

