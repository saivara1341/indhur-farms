import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { amount, currency = 'INR', receipt } = body;

    if (!amount) {
      throw new Error('Amount is required and must be greater than 0');
    }

    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_SECRET');

    if (!keyId || !keySecret) {
      console.error("CONFIG ERROR: Razorpay keys are missing from environment.");
      throw new Error('Server configuration error: Razorpay keys missing.');
    }

    console.log(`Creating Razorpay order: ${amount} ${currency} for ${receipt}`);

    const auth = btoa(`${keyId}:${keySecret}`);
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // convert to paise
        currency,
        receipt,
      }),
    });

    const data = await response.json().catch(() => ({ error: { description: "Invalid JSON response from Razorpay" } }));

    if (!response.ok) {
      console.error("RAZORPAY API ERROR:", data);
      throw new Error(data.error?.description || 'Razorpay API returned an error');
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("EDGE FUNCTION CRASH:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})
