const OpenAI = require('openai');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { transcript } = req.body;
    const groqApiKey = process.env.GROQ_API_KEY || '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';

    if (!transcript) return res.status(400).json({ error: 'No transcript provided' });

    const openai = new OpenAI({
      apiKey: groqApiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });

    // Your ORIGINAL food list for the AI
    const food_list = `
    - Margherita Pizza (₹199) - Pizza
    - Farmhouse Pizza (₹249) - Pizza
    - Pepperoni Pizza (₹299) - Pizza
    - Veggie Burger (₹129) - Burger
    - Chicken Burger (₹179) - Burger
    - Cheese Burger (₹149) - Burger
    - Chicken Biryani (₹299) - Main Course
    - North Indian Thali (₹349) - Main Course
    - Masala Dosa (₹89) - Snacks
    - Obbattu (₹49) - Dessert
    - Vangi Bath (₹79) - Main Course
    `;

    // Your ORIGINAL prompt restored
    const prompt = `
You are a food ordering assistant for EchoEats. The user said: "${transcript}"

IMPORTANT RULES:
1. The user may say multiple things in one sentence
2. You MUST respond to LAST command you detect
3. IGNORE all other previous commands
4. Do NOT mention or acknowledge any other commands in your response

Available food items in our database:
${food_list}

Available pages/routes in our app:
- Home page (path: "home" or "/")
- About page (path: "about")
- Login page (path: "login")
- Cart page (path: "cart")
- Checkout page with payment modal (path: "checkout" or "cart#payment-modal")
- Orders page (path: "orders")
- Menu/Items section (path: "menu" or "#items")

Based on the user's voice input, respond with ONE of these command types as JSON:

1. FILTER: {"command": "FILTER", "category": "Pizza|Burger|Main Course|Snacks|Dessert", "response": "Showing you all pizzas"}
2. NAVIGATE: {"command": "NAVIGATE", "page": "home|about|login|cart|checkout|orders|menu|items", "response": "Taking you to the home page"}
3. LOGOUT: {"command": "LOGOUT", "response": "Logging you out"}
4. ORDER: {"command": "ORDER", "item_id": number, "quantity": number, "response": "Added to cart"}
5. REMOVE: {"command": "REMOVE", "item_id": number, "quantity": number, "response": "Removed from cart"}
6. UNKNOWN: {"command": "UNKNOWN", "response": "I didn't understand. Please repeat."}

For ORDER and REMOVE, match the item to the closest FoodID:
1: Margherita Pizza, 2: Farmhouse Pizza, 3: Pepperoni Pizza, 4: Veggie Burger, 5: Chicken Burger, 
6: Cheese Burger, 7: Chicken Biryani, 8: North Indian Thali, 9: Masala Dosa, 10: Obbattu, 11: Vangi Bath

Return ONLY the JSON object.
`;

    const completion = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a helpful food ordering assistant. Always respond with valid JSON only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content);

    return res.status(200).json({ status: "success", aiResponse });
  } catch (error) {
    console.error("Voice processing error:", error);
    return res.status(200).json({ 
      status: "fallback", 
      aiResponse: { response: "I'm sorry, I'm having trouble thinking. Please try again.", command: "UNKNOWN" }
    });
  }
};
