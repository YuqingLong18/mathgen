import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE_NAME = 'mathgen_session'
const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || 'http://localhost:3000/verify'

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string }

  try {
    body = await req.json()
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    )
  }

  const username = body?.username?.trim()
  const password = body?.password?.trim()

  if (!username || !password) {
    return NextResponse.json(
      { success: false, error: 'Username and password are required' },
      { status: 400 }
    )
  }

  try {
    const authResponse = await fetch(AUTH_SERVICE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const data = await authResponse
      .json()
      .catch(() => ({ success: false, error: 'Invalid auth response' }))

    if (authResponse.ok && data?.success) {
      const sessionPayload = {
        username: data.user?.username || username,
        userId: data.user?.id,
        issuedAt: Date.now(),
      }

      const cookieValue = Buffer.from(
        JSON.stringify(sessionPayload)
      ).toString('base64')

      const response = NextResponse.json({ success: true })
      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: cookieValue,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
      return response
    }

    const status =
      authResponse.status === 401 ? 401 : authResponse.status || 500
    return NextResponse.json(
      {
        success: false,
        error: data?.error || 'Invalid credentials',
      },
      { status }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Authentication service unavailable' },
      { status: 503 }
    )
  }
}
