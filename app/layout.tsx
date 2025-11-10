import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'MiniMonday - Gestión de Proyectos',
  description: 'Una aplicación de gestión de proyectos estilo Monday.com para agencias de marketing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
        {process.env.NEXT_PUBLIC_PERF_HARDENING === 'true' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if (typeof window !== 'undefined' && 'onload' in window) {
                  import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
                    onCLS((metric) => {
                      fetch('/api/vitals', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(metric),
                        keepalive: true
                      }).catch(() => {});
                    });
                    onFID((metric) => {
                      fetch('/api/vitals', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(metric),
                        keepalive: true
                      }).catch(() => {});
                    });
                    onFCP((metric) => {
                      fetch('/api/vitals', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(metric),
                        keepalive: true
                      }).catch(() => {});
                    });
                    onLCP((metric) => {
                      fetch('/api/vitals', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(metric),
                        keepalive: true
                      }).catch(() => {});
                    });
                    onTTFB((metric) => {
                      fetch('/api/vitals', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(metric),
                        keepalive: true
                      }).catch(() => {});
                    });
                  }).catch(() => {});
                }
              `,
            }}
          />
        )}
      </body>
    </html>
  )
}
