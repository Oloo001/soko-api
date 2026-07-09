// app/api/listings/[id]/like/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const listingId = params.id

  const existing = await prisma.like.findUnique({
    where: { userId_listingId: { userId, listingId } },
  })

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } })
    return NextResponse.json({ liked: false })
  } else {
    await prisma.like.create({ data: { userId, listingId } })
    return NextResponse.json({ liked: true })
  }
}