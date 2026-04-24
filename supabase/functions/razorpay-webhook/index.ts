import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

serve(async (req) => {
  const signature = req.headers.get('x-razorpay-signature')
  const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') // Separate secret for webhooks in Razorpay

  if (!signature || !secret) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await req.text()
  
  // Verify signature
  // Razorpay webhook verification uses HMAC SHA256
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify", "sign"],
  )
  
  const signatureBytes = new Uint8Array(
    signature.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  )
  
  const isValid = await crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    encoder.encode(body)
  )

  if (!isValid) {
    return new Response('Invalid signature', { status: 400 })
  }

  const payload = JSON.parse(body)
  const event = payload.event

  if (event === 'payment.captured') {
    const payment = payload.payload.payment.entity
    const rzpOrderId = payment.order_id

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Update order status based on Razorpay Order ID
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'confirmed',
        payment_status: 'verified',
        razorpay_payment_id: payment.id
      })
      .eq('razorpay_order_id', rzpOrderId)

    if (error) {
      console.error('Error updating order:', error)
      return new Response('Error', { status: 500 })
    }
  }

  return new Response('ok', { status: 200 })
})
