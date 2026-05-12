const OpenAI = require('openai');

module.exports = async (req, res) => {
  // Add CORS headers for production
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transcript } = req.body;
    
    // IMPORTANT: User needs to set this in Vercel Dashboard
    const groqApiKey = process.env.GROQ_API_KEY || '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';

    if (!transcript) {
       return res.status(400).json({ error: 'No transcript provided' });
    }

    const openai = new OpenAI({
      apiKey: groqApiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const completion = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are the EchoEats voice assistant. You must ALWAYS return a JSON object.
          The user can ask to:
          1. Navigate to a page (Home, Cart, Orders, Login, Profile).
          2. Filter food items (Pizza, Burger, Main Course, Snacks, Dessert).
          3. Order/Add items to cart.
          4. Logout.
          
          JSON Schema:
          {
            "response": "What you say to the user",
            "command": "NAVIGATE | FILTER | ORDER | LOGOUT | NONE",
            "page": "home | cart | orders | login | profile",
            "category": "Pizza | Burger | Main Course | Snacks | Dessert",
            "item_id": number (FoodID),
            "quantity": number
          }`
        },
        {
          role: "user",
          content: transcript
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content);

    return res.status(200).json({
      status: "success",
      aiResponse
    });
  } catch (error) {
    console.error("Voice processing error:", error);
    // Return a friendly fallback instead of a crash
    return res.status(200).json({ 
      status: "fallback", 
      aiResponse: {
        response: "I'm sorry, I'm having trouble thinking right now. Please try again.",
        command: "NONE"
      }
    });
  }
};
