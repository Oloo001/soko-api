// app/api/payments/initiate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromRequest } from '@/lib/auth'
import { initiateStkPush } from '@/lib/mpesa'
import { z } from 'zod'

const schema = z.object({
  listingId: z.string(),
  phone: z.string().min(10),
})

export async function POST(request: NextRequest) {
  const buyerId = getUserIdFromRequest(request)
  if (!buyerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const listing = await prisma.listing.findUnique({ where: { id: parsed.data.listingId } })
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

  // create a PENDING payment record first — this is our source of truth for polling
  const payment = await prisma.payment.create({
    data: {
      amount: listing.price,
      status: 'PENDING',
      buyerId,
      sellerId: listing.sellerId,
      listingId: listing.id,
    },
  })

  const stkRes = await initiateStkPush(parsed.data.phone, listing.price, payment.id)

  if (stkRes.CheckoutRequestID) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { checkoutRequestId: stkRes.CheckoutRequestID },
    })
  } else {
    // STK push failed to even initiate (bad phone, sandbox limits, etc.)
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } })
    return NextResponse.json({ error: stkRes.errorMessage || 'STK push failed' }, { status: 400 })
  }

  return NextResponse.json({ paymentId: payment.id })
}