// supabase/functions/notify-client/index.ts
// Edge Function pour envoyer les notifications aux clients

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotifyRequest {
  chantierId: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { chantierId }: NotifyRequest = await req.json()

    if (!chantierId) {
      throw new Error('chantierId is required')
    }

    // Récupérer le chantier
    const { data: chantier, error: chantierError } = await supabaseClient
      .from('chantiers')
      .select(`
        *,
        equipe:equipes(name)
      `)
      .eq('id', chantierId)
      .single()

    if (chantierError || !chantier) {
      throw new Error('Chantier not found')
    }

    const validationUrl = `${Deno.env.get('APP_URL')}/validation/${chantier.validation_token}`
    
    const results = {
      email: null as string | null,
      sms: null as string | null,
    }

    // Envoyer email si présent
    if (chantier.client_email) {
      try {
        const emailResult = await sendEmail({
          to: chantier.client_email,
          subject: `STERK - Validation de votre intervention LED`,
          html: generateEmailHtml(chantier, validationUrl),
        })
        results.email = emailResult ? 'sent' : 'failed'

        // Log
        await supabaseClient.from('notification_logs').insert({
          chantier_id: chantierId,
          type: 'email',
          recipient: chantier.client_email,
          status: results.email,
        })
      } catch (e) {
        console.error('Email error:', e)
        results.email = 'failed'
      }
    }

    // Envoyer SMS si présent
    if (chantier.client_phone) {
      try {
        const smsResult = await sendSMS({
          to: formatPhoneE164(chantier.client_phone),
          message: `STERK & Construction: Validez votre intervention de ${chantier.led_count} LED. ${validationUrl}`,
        })
        results.sms = smsResult ? 'sent' : 'failed'

        // Log
        await supabaseClient.from('notification_logs').insert({
          chantier_id: chantierId,
          type: 'sms',
          recipient: chantier.client_phone,
          status: results.sms,
        })
      } catch (e) {
        console.error('SMS error:', e)
        results.sms = 'failed'
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// ============================================
// FONCTIONS D'ENVOI
// ============================================

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured')
    return false
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: Deno.env.get('EMAIL_FROM') || 'STERK LED <noreply@sterk.fr>',
      to: [to],
      subject,
      html,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Resend error:', error)
    return false
  }

  return true
}

async function sendSMS({ to, message }: { to: string; message: string }) {
  const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
  const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
  const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.error('Twilio not configured')
    return false
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: TWILIO_PHONE_NUMBER,
        Body: message,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error('Twilio error:', error)
    return false
  }

  return true
}

// ============================================
// HELPERS
// ============================================

function formatPhoneE164(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('0')) {
    return '+33' + cleaned.slice(1)
  }
  if (cleaned.startsWith('33')) {
    return '+' + cleaned
  }
  return '+33' + cleaned
}

function generateEmailHtml(chantier: any, validationUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Validation d'intervention STERK</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 500px; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316, #f59e0b); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 800;">STERK & Construction</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Validation d'intervention LED</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; color: #27272a; font-size: 16px;">
                Bonjour <strong>${chantier.client_name}</strong>,
              </p>
              
              <p style="margin: 0 0 24px; color: #52525b; font-size: 14px; line-height: 1.6;">
                L'équipe <strong>${chantier.equipe?.name || 'STERK'}</strong> a terminé une intervention à l'adresse suivante :
              </p>
              
              <!-- Chantier Card -->
              <div style="background-color: #fafafa; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Adresse</p>
                <p style="margin: 0 0 16px; color: #27272a; font-size: 14px;">${chantier.adresse}</p>
                
                <div style="background: linear-gradient(135deg, rgba(249,115,22,0.1), rgba(245,158,11,0.1)); border-radius: 8px; padding: 16px; text-align: center;">
                  <p style="margin: 0; color: #f97316; font-size: 32px; font-weight: 800;">${chantier.led_count}</p>
                  <p style="margin: 4px 0 0; color: #ea580c; font-size: 14px; font-weight: 600;">LED installées</p>
                </div>
              </div>
              
              <p style="margin: 0 0 24px; color: #52525b; font-size: 14px; line-height: 1.6;">
                Merci de valider cette intervention en cliquant sur le bouton ci-dessous. En cas de problème, vous pourrez le signaler directement.
              </p>
              
              <!-- CTA Button -->
              <a href="${validationUrl}" style="display: block; background: linear-gradient(135deg, #f97316, #f59e0b); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; text-align: center;">
                Valider l'intervention
              </a>
              
              <p style="margin: 24px 0 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                Ce lien expire dans 72 heures.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                STERK & Construction © ${new Date().getFullYear()}<br>
                Cet email a été envoyé automatiquement.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
