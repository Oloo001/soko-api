// app/api/listings/[id]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { z } from 'zod'

const commentSchema = z.object({ text: z.string().min(1).max(500) })

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const comments = await prisma.comment.findMany({
    where: { listingId: params.id },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  })
  return NextResponse.json(comments)
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = commentSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const comment = await prisma.comment.create({
    data: { text: parsed.data.text, userId, listingId: params.id },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  })
  return NextResponse.json(comment, { status: 201 })
}