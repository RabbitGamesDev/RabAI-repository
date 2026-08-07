/* ═══════════════════════════════════════════════════════════════════════════
   RabAI v5.0 "IndieDev Edition" — Backend (Cloudflare Worker)
   RabbitGamesStudio™ / RGS Labs™
   ═══════════════════════════════════════════════════════════════════════════ */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    try {
      const body = await request.json();
      const { model, messages, temperature, max_tokens } = body;

      // Validation
      if (!model || !messages || !Array.isArray(messages)) {
        return jsonResponse({ error: 'Missing model or messages' }, 400);
      }

      if (!env.GROQ_API_KEY) {
        return jsonResponse({ error: 'Missing GROQ_API_KEY' }, 500);
      }

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: temperature ?? 0.7,
          max_tokens: max_tokens ?? 4096
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return jsonResponse({ error: data.error || data }, response.status);
      }

      return jsonResponse(data, 200);

    } catch (err) {
      return jsonResponse({ error: err.message || 'Backend error' }, 500);
    }
  }
};

function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}