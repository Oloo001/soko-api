// app/api/mpesa/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const stkCallback = body.Body?.stkCallback

  if (!stkCallback) return NextResponse.json({ ok: true }) // ignore malformed pings

  const checkoutRequestId = stkCallback.CheckoutRequestID
  const resultCode = stkCallback.ResultCode

  const payment = await prisma.payment.findFirst({ where: { checkoutRequestId } })
  if (!payment) return NextResponse.json({ ok: true })

  if (resultCode === 0) {
    // success — extract the Mpesa receipt number from the metadata array
    const items = stkCallback.CallbackMetadata?.Item || []
    const receipt = items.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'COMPLETED', mpesaReceipt: receipt },
    })
  } else {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } })
  }

  return NextResponse.json({ ok: true }) // Safaricom expects a 200, always
}