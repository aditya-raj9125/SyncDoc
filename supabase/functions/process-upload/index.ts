import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const documentId = formData.get('documentId') as string | null;

    if (!file || !documentId) {
      return new Response(JSON.stringify({ error: 'Missing file or documentId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const fileName = file.name.toLowerCase();
    let htmlContent = '';

    if (fileName.endsWith('.md')) {
      // Markdown — return raw text for client-side parsing
      const text = await file.text();
      return new Response(
        JSON.stringify({ type: 'markdown', content: text }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (fileName.endsWith('.docx')) {
      // For DOCX, we'd use mammoth but it needs Node.js
      // Return a placeholder indicating client-side processing needed
      const buffer = await file.arrayBuffer();
      const filePath = `uploads/${documentId}/${file.name}`;

      await supabase.storage
        .from('documents')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: true,
        });

      return new Response(
        JSON.stringify({
          type: 'docx',
          storagePath: filePath,
          message: 'File uploaded. Process client-side with mammoth.js',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (fileName.endsWith('.pdf')) {
      const buffer = await file.arrayBuffer();
      const filePath = `uploads/${documentId}/${file.name}`;

      await supabase.storage
        .from('documents')
        .upload(filePath, buffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      return new Response(
        JSON.stringify({
          type: 'pdf',
          storagePath: filePath,
          message: 'File uploaded. Process client-side with pdfjs-dist',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unsupported file type. Supported: .md, .docx, .pdf' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Process upload error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
