const OpenAI = require('openai');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transcript } = req.body;
    const groqApiKey = process.env.GROQ_API_KEY || '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';

    const openai = new OpenAI({
      apiKey: groqApiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const completion = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a helpful food ordering assistant for EchoEats. Always respond with valid JSON only. User can FILTER items, NAVIGATE to pages, ORDER items, or LOGOUT."
        },
        {
          role: "user",
          content: `The user said: "${transcript}". Process this command and return JSON.`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content);

    return res.status(200).json({
      status: "Received ✅",
      transcript,
      aiResponse
    });
  } catch (error) {
    console.error("Voice processing error:", error);
    return res.status(500).json({ error: 'Failed to process voice command', details: error.message });
  }
};
