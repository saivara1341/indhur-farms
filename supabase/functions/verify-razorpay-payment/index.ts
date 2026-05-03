import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()

    const keySecret = Deno.env.get('RAZORPAY_SECRET')

    if (!keySecret) {
      throw new Error('Razorpay secret not configured in Edge Function secrets')
    }

    // Verify signature
    // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const text = razorpay_order_id + "|" + razorpay_payment_id
    
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(keySecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )

    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(text)
    )

    const generatedSignature = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")

    if (generatedSignature !== razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Initialize Supabase Client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Update order status
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({ 
        payment_status: 'verified',
        status: 'confirmed',
        razorpay_payment_id: razorpay_payment_id
      })
      .eq('razorpay_order_id', razorpay_order_id)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
