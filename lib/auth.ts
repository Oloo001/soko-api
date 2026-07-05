// lib/auth.ts
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET!

export function signToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' })
  // 30d because mobile users expect to stay logged in — unlike web, there's no "close browser" moment
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string }
  } catch {
    return null
  }
}

export function getUserIdFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.split(' ')[1]
  const payload = verifyToken(token)
  return payload?.userId ?? null
}