// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  phone: z.string().min(10).optional(), // Kenyan Mpesa numbers, e.g. 2547XXXXXXXX
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { email, password, name, phone } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: { email, passwordHash, name, phone },
  })

  const token = signToken(user.id)

  return NextResponse.json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  }, { status: 201 })
}