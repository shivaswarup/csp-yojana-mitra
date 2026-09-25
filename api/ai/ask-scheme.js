import { GoogleGenAI } from '@google/genai';

function getGenAI() {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    } else if (!body) {
      body = {};
    }

    const { schemeName = '', schemeDetails = {}, userQuery = '', userProfile = null } = body;
    const ai = getGenAI();

    if (!ai) {
      return res.status(200).json({
        answer: `As an official advisor for **${schemeName}**, please verify eligibility on the official portal with your Aadhaar, income certificate, and caste credentials ready.`,
        sources: ['Official Portal Verification Required']
      });
    }

    const prompt = `You are "Yojana Mitra AI", an official State Government Scheme & Scholarship Assistant in India.
Answer the citizen's query about the following State Government scheme in clear, friendly, and objective language.

SCHEME CONTEXT:
Name: ${schemeName}
Details: ${JSON.stringify(schemeDetails)}

CITIZEN'S QUESTION:
"${userQuery}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: 'You are the official Yojana Mitra Assistant for State Government Schemes and Scholarships in India.'
      }
    });

    return res.status(200).json({
      answer: response?.text || 'Please check the official state portal for specific criteria.',
      sources: ['State Portal / Department Guidelines']
    });
  } catch (err) {
    console.error('Error in /api/ai/ask-scheme:', err);
    return res.status(200).json({
      answer: 'Please refer to the official government portal for the most accurate scheme guidelines.',
      sources: ['Official Portal Verification Recommended']
    });
  }
}
