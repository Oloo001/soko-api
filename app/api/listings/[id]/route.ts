// app/api/listings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewerId = getUserIdFromRequest(request)
  const paramsData = await params

  const listing = await prisma.listing.findUnique({
    where: { id: paramsData.id },
    include: {
      seller: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true } },
    },
  })
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let isLiked = false
  if (viewerId) {
    const like = await prisma.like.findUnique({
      where: { userId_listingId: { userId: viewerId, listingId: paramsData.id } },
    })
    isLiked = !!like
  }

  return NextResponse.json({ ...listing, isLiked })
}