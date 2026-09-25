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

    const { query = '', state = 'All India', category = 'All', userProfile = null } = body;
    const ai = getGenAI();

    if (!ai) {
      return res.status(200).json({
        summary: `Search for "${query}" across official state portals like jnanabhumi.ap.gov.in, navasakam2.apcfss.in, telangana.gov.in, and epass.telangana.gov.in.`,
        groundingUrls: []
      });
    }

    const prompt = `Search for official Indian state government schemes or state scholarships matching: "${query}".
State context: ${state || 'Andhra Pradesh'}
Category: ${category}
CRITICAL: Only search for and return State Government schemes enacted by the State Government of Andhra Pradesh. Do NOT include Central Government schemes.
Provide genuine active state government schemes with official state government portal application links (.gov.in / .nic.in / .apcfss.in).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const groundingChunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const urls = [];
    if (groundingChunks && Array.isArray(groundingChunks)) {
      groundingChunks.forEach((chunk) => {
        if (chunk.web?.uri) {
          urls.push({
            title: chunk.web.title || 'Official Government Source',
            uri: chunk.web.uri
          });
        }
      });
    }

    return res.status(200).json({
      summary: response?.text || 'Official schemes matching your query are active. Please check myscheme.gov.in or scholarships.gov.in.',
      groundingUrls: urls
    });
  } catch (err) {
    console.error('Error in /api/ai/search-schemes:', err);
    return res.status(200).json({
      summary: 'Please search directly on myscheme.gov.in or scholarships.gov.in.',
      groundingUrls: []
    });
  }
}
