import express from 'express'

const router = express.Router()

const SYSTEM_INSTRUCTION = `
You are SkinBloom AI, a friendly skincare and general conversation assistant.

Guidelines:
- Respond naturally in English or Bangla based on the user's language.
- Help with skincare routines, ingredients, skin types, and product selection.
- Be friendly, respectful, and conversational.
- You may answer general questions beyond skincare.
- Do not claim to be a human or dermatologist.
- Do not diagnose medical conditions or prescribe medications.
- Recommend professional medical care for serious skin concerns.
- Do not invent SkinBloom products, prices, or stock availability.
- Keep answers concise and helpful.
`

const recentRequests = new Map()

router.post('/message', async (req, res) => {
  try {
    const key = process.env.GEMINI_API_KEY

    if (!key) {
      return res.status(503).json({
        error: 'AI chatbot is not configured yet.'
      })
    }

    const ip = req.ip || 'unknown'
    const now = Date.now()
    const previous = recentRequests.get(ip) || []
    const active = previous.filter(t => now - t < 60000)

    if (active.length >= 8) {
      return res.status(429).json({
        error: 'Too many messages. Please try again in a minute.'
      })
    }

    active.push(now)
    recentRequests.set(ip, active)

    if (recentRequests.size > 1000) {
      recentRequests.clear()
    }

    const { message, history = [] } = req.body || {}

    if (typeof message !== 'string' ||
        !message.trim() ||
        message.length > 2000) {
      return res.status(400).json({
        error: 'Message must contain 1 to 2000 characters.'
      })
    }

    if (!Array.isArray(history)) {
      return res.status(400).json({
        error: 'Invalid conversation history.'
      })
    }

    const safeHistory = history.slice(-10)
      .filter(m =>
        m &&
        (m.role === 'user' || m.role === 'model') &&
        typeof m.text === 'string' &&
        m.text.length <= 2000
      )
      .map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }))

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }]
          },
          contents: [
            ...safeHistory,
            {
              role: 'user',
              parts: [{ text: message.trim() }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 700,
            temperature: 0.7
          }
        }),
        signal: AbortSignal.timeout(25000)
      }
    )

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('Gemini API status:', response.status)
      console.error('Gemini API details:', errorBody.slice(0, 1000))

      return res.status(502).json({
        error: response.status === 429
          ? 'AI service is busy or quota exceeded. Please try later.'
          : 'AI service is temporarily unavailable.'
      })
    }

    const data = await response.json()

    const reply = data.candidates?.[0]?.content?.parts
      ?.filter(part => typeof part.text === 'string')
      .map(part => part.text)
      .join('\n')
      ?.trim()

    if (!reply) {
      return res.status(502).json({
        error: 'AI did not return a response. Please try again.'
      })
    }

    res.json({ reply })

  } catch (err) {
    console.error('Chatbot error:', err.message)

    res.status(500).json({
      error: 'Unable to process your message right now.'
    })
  }
})

export default router
