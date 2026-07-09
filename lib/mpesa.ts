// lib/mpesa.ts
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY!
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET!
const SHORTCODE = process.env.MPESA_SHORTCODE!
const PASSKEY = process.env.MPESA_PASSKEY!
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL!

const BASE_URL = 'https://sandbox.safaricom.co.ke' // switch to api.safaricom.co.ke in production

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')
  const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  })
  const data = await res.json()
  return data.access_token
}

function timestamp() {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

export async function initiateStkPush(phone: string, amount: number, accountRef: string) {
  const token = await getAccessToken()
  const ts = timestamp()
  const password = Buffer.from(`${SHORTCODE}${PASSKEY}${ts}`).toString('base64')

  // Normalize phone to 2547XXXXXXXX format — Daraja rejects 07... or +254...
  const normalizedPhone = phone.startsWith('0') ? `254${phone.slice(1)}` : phone.replace('+', '')

  const res = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: ts,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: normalizedPhone,
      PartyB: SHORTCODE,
      PhoneNumber: normalizedPhone,
      CallBackURL: CALLBACK_URL,
      AccountReference: accountRef,
      TransactionDesc: 'Soko purchase',
    }),
  })

  return res.json() // contains CheckoutRequestID we store and poll against
}