// app/api/users/[id]/follow/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const followerId = getUserIdFromRequest(request)
  if (!followerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const followingId = params.id
  if (followerId === followingId) {
    return NextResponse.json({ error: "Can't follow yourself" }, { status: 400 })
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  })

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } })
    return NextResponse.json({ following: false })
  } else {
    await prisma.follow.create({ data: { followerId, followingId } })
    return NextResponse.json({ following: true })
  }
}