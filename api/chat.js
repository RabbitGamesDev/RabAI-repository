const GROQ_API_KEY = process.env.GROQ_API_KEY;

module.exports = async (req, res) => {

  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  // Revisar API key
  if (!GROQ_API_KEY) {
    return res.status(500).json({
      error: 'Missing GROQ_API_KEY in Vercel environment variables'
    });
  }

  try {

    const { model, messages } = req.body;

    // Validación básica
    if (!model || !messages) {
      return res.status(400).json({
        error: 'Missing model or messages'
      });
    }

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },

        body: JSON.stringify({
          model,
          messages,
          max_tokens: 1024,
          temperature: 0.7
        })
      }
    );

    const data = await response.json();

    // Mostrar error REAL de Groq
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error || data
      });
    }

    return res.status(200).json(data);

  } catch (err) {

    return res.status(500).json({
      error: err.message || 'Backend error'
    });

  }

};
