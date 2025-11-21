import { GoogleGenAI, Type } from "@google/genai";
import { Component, Product, AIAnalysisResult } from '../types';

const getAIClient = () => {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeCosting = async (
  products: Product[],
  components: Component[]
): Promise<AIAnalysisResult> => {
  
  const ai = getAIClient();

  // Simplify data for token efficiency
  const simpleProducts = products.map(p => {
    let cost = p.makingCharges;
    p.components.forEach(pc => {
      const c = components.find(comp => comp.id === pc.componentId);
      if (c) cost += c.price * pc.quantity;
    });
    return { name: p.name, totalCost: cost, makingCharges: p.makingCharges };
  });

  const simpleComponents = components.map(c => ({ name: c.name, price: c.price, unit: c.unit }));

  const prompt = `
    You are a Cost Analyst for a jewelry business.
    
    Analyze the following inventory data:
    Components: ${JSON.stringify(simpleComponents.slice(0, 20))} (Sample)
    Products: ${JSON.stringify(simpleProducts.slice(0, 10))} (Sample)
    
    Provide:
    1. A brief analysis of cost drivers (max 2 sentences).
    2. 3 specific suggestions to reduce costs or optimize pricing (e.g., bulk buying specific expensive components, adjusting making charges).
  `;

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    analysis: { type: Type.STRING },
                    suggestions: { 
                        type: Type.ARRAY, 
                        items: { type: Type.STRING } 
                    }
                }
            }
        }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as AIAnalysisResult;
  } catch (error) {
    console.error("AI Error:", error);
    return {
      analysis: "Could not generate analysis at this time.",
      suggestions: ["Check your internet connection", "Ensure API key is valid"]
    };
  }
};
