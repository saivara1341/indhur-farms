
/**
 * Agent Orchestrator Service
 * 
 * Uses Gemini (via Google AI) to reason over user voice transcripts,
 * extract intents, and map them to actionable "Tools" within the Indhur Farms app.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-1.5-flash"; // Fast and efficient for interactive voice

export interface AgentAction {
  intent: string;
  params?: Record<string, any>;
  response: string; // Natural language response to be spoken back
  nextStep?: "payment" | "listen" | "none";
}

const SYSTEM_PROMPT = `
You are the "Indhur Farms Voice Assistant". Your goal is to provide a "Zero-Touch" experience for both Users and Admins.
You support multiple languages including English, Telugu, Hindi, and more.

## USER CAPABILITIES:
1. addToCart: Extract product name and quantity (e.g., "Add 1kg Turmeric").
2. searchProducts: Browse the catalog.
3. startCheckout: Initiate the delivery/address flow.
4. trackOrder: Check status of existing orders.
5. explainIndhur: Tell the user about Indhur Farms (organic, premium, traditional).

## ADMIN CAPABILITIES (Only if user is identified as admin):
1. navigateAdmin: Switch tabs (dashboard, products, orders, settings).
2. getStats: Retrieve revenue, pending orders, or low stock counts.
3. updateOrderStatus: Change status of a specific order.

## GUIDELINES:
- If an action requires confirmation (like clearing cart), ask first.
- If a product variant is ambiguous, ask the user to specify.
- After a payload is processed, provide a warm, natural confirmation in the user's language.
- For Payment: Acknowledge that payment requires manual interaction, but offer to proceed once they have the transaction ID.

OUTUPT FORMAT:
Respond ONLY with a valid JSON object:
{
  "intent": "string",
  "params": {},
  "response": "Text to speak back",
  "nextStep": "listen" | "payment" | "none"
}
`;

export const orchestrator = {
  async process(text: string, context: { isAdmin: boolean; currentPath: string; cartLength: number }): Promise<AgentAction> {
    if (!GEMINI_API_KEY) {
      console.warn("[Orchestrator] Gemini API Key missing.");
      return { 
        intent: "unknown", 
        response: "I'm ready to help, but my brain (AI key) isn't connected yet. Please add the Gemini API key." 
      };
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${SYSTEM_PROMPT}\n\nUser Context: ${JSON.stringify(context)}\nUser Input: "${text}"` }]
          }],
          generationConfig: {
            response_mime_type: "application/json",
          }
        })
      });

      if (!response.ok) throw new Error("Gemini request failed");
      
      const data = await response.json();
      const resultText = data.candidates[0].content.parts[0].text;
      return JSON.parse(resultText) as AgentAction;
    } catch (error) {
      console.error("[Orchestrator] Error processing intent:", error);
      return { 
        intent: "error", 
        response: "I encountered a slight hiccup while thinking. Could you try again?" 
      };
    }
  }
};
