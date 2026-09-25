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

    const { userProfile } = body;
    const ai = getGenAI();

    if (!ai || !userProfile) {
      return res.status(200).json({ schemes: [] });
    }

    const prompt = `Based on the citizen profile below, identify active State Government schemes and scholarships from official state portals (Andhra Pradesh State Government only, strictly excluding any Central Government schemes):
${JSON.stringify(userProfile)}
Return JSON with key "schemes" containing an array of matched state schemes.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    let data = { schemes: [] };
    try {
      data = JSON.parse(response?.text || '{}');
    } catch {
      data = { schemes: [] };
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Error in /api/ai/scan-schemes:', err);
    return res.status(200).json({ schemes: [] });
  }
}
