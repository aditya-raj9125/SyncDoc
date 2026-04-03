import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const APP_URL = Deno.env.get('APP_URL') || 'https://syncdoc.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, documentTitle, inviterName, token, permission } = await req.json();

    if (!email || !token) {
      return new Response(JSON.stringify({ error: 'Missing email or token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const inviteUrl = `${APP_URL}/share/${token}`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'SyncDoc <noreply@syncdoc.app>',
        to: [email],
        subject: `${inviterName} shared "${documentTitle}" with you on SyncDoc`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h2 style="color: #1C1917; margin-bottom: 16px;">${inviterName} shared a document with you</h2>
            <p style="color: #78716C; margin-bottom: 8px;">Document: <strong>${documentTitle}</strong></p>
            <p style="color: #78716C; margin-bottom: 24px;">Access level: <strong>${permission}</strong></p>
            <a href="${inviteUrl}"
               style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
              Open Document
            </a>
            <p style="color: #A8A29E; font-size: 12px; margin-top: 32px;">
              If you don't have a SyncDoc account, you'll be able to create one when you click the link.
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend error:', error);
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
