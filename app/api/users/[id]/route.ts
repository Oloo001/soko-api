// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewerId = getUserIdFromRequest(request)
  const paramsData = await params
  const userId = paramsData.id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, avatarUrl: true, bio: true,
      listings: {
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { likes: true, comments: true } } },
      },
      _count: { select: { followers: true, following: true } },
    },
  })

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let isFollowing = false
  if (viewerId) {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: viewerId, followingId: userId } },
    })
    isFollowing = !!follow
  }

  return NextResponse.json({ ...user, isFollowing })
}