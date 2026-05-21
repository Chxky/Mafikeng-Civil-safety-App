// Supabase Edge Function: Send SMS via Africa's Talking
// Deploy: supabase functions deploy send-sms
// Set secrets: supabase secrets set AT_API_KEY=xxx AT_USERNAME=xxx

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const AT_API_KEY = Deno.env.get('AT_API_KEY')
const AT_USERNAME = Deno.env.get('AT_USERNAME') || 'sandbox'
const AT_SENDER_ID = Deno.env.get('AT_SENDER_ID') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!AT_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AT_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { to, message } = await req.json()

    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing "to" and "message" fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Africa's Talking API
    const url = 'https://api.africastalking.com/version1/messaging'
    const body = new URLSearchParams({
      username: AT_USERNAME,
      to: Array.isArray(to) ? to.join(',') : to,
      message,
      ...(AT_SENDER_ID && { from: AT_SENDER_ID }),
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apiKey': AT_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: body.toString(),
    })

    const data = await response.json()

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Africa\'s Talking API error', details: data }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
