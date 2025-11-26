import { NextResponse } from 'next/server'

const SESSION_COOKIE_NAME = 'mathgen_session'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    path: '/',
    httpOnly: true,
    maxAge: 0,
  })
  return response
}
