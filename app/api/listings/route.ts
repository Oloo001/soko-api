// app/api/listings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { z } from 'zod'

const createListingSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  price: z.number().int().positive(),
  imageUrl: z.string().url().optional(),
  sellerId: z.string(), // will come from JWT auth in Phase 2 — hardcoded for now
})

export async function GET() {
  const listings = await prisma.listing.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      seller: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true } },
    },
  })
  return NextResponse.json(listings)
}

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createListingSchema.omit({ sellerId: true }).safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const listing = await prisma.listing.create({
    data: { ...parsed.data, sellerId: userId },
  })
  return NextResponse.json(listing, { status: 201 })
}