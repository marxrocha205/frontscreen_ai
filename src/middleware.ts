import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function decodeJWT(token: string) {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    )
    return decoded
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value
  const { pathname } = request.nextUrl

  const isAdminRoute = pathname.startsWith('/admin')
  const isAppRoute = pathname.startsWith('/app')

  if (!token && (isAdminRoute || isAppRoute)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    if (token) {
      const payload = decodeJWT(token)

      if (!payload) {
        throw new Error('Token inválido')
      }

      const isAdmin = payload.is_admin === true

      if (isAdminRoute && !isAdmin) {
        return NextResponse.redirect(new URL('/app', request.url))
      }
    }
  } catch (error) {
    console.error('Erro no Middleware:', error)

    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('access_token')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/app/:path*'],
}