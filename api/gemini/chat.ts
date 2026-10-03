import { GoogleGenAI } from '@google/genai';

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build-vercel',
      },
    },
  });
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { messages, systemInstruction, stream = false } = req.body || {};
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(200).json({
        fallback: true,
        message: 'Using municipal analytical engine.',
      });
    }

    const formattedContents = (messages || []).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: Array.isArray(m.parts) ? m.parts : [{ text: m.text || '' }],
    }));

    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

    if (stream) {
      let streamSucceeded = false;
      for (const modelName of candidateModels) {
        try {
          const responseStream = await ai.models.generateContentStream({
            model: modelName,
            contents: formattedContents,
            config: {
              systemInstruction: systemInstruction || undefined,
              temperature: 0.2,
            },
          });

          if (!res.headersSent) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
          }

          for await (const chunk of responseStream) {
            const text = chunk.text || '';
            if (text) {
              res.write(`data: ${JSON.stringify({ text })}\n\n`);
            }
          }
          res.write('data: [DONE]\n\n');
          res.end();
          streamSucceeded = true;
          break;
        } catch (err: any) {
          if (res.headersSent) break;
        }
      }

      if (!streamSucceeded && !res.headersSent) {
        return res.status(200).json({
          fallback: true,
          message: 'Engaging municipal analytical AI engine.',
        });
      }
    } else {
      let generateSucceeded = false;
      let resultText = '';

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: formattedContents,
            config: {
              systemInstruction: systemInstruction || undefined,
              temperature: 0.2,
            },
          });
          resultText = response.text || '';
          generateSucceeded = true;
          break;
        } catch (_err) {
          // continue
        }
      }

      if (generateSucceeded) {
        return res.status(200).json({ text: resultText });
      } else {
        return res.status(200).json({
          fallback: true,
          message: 'Engaging municipal analytical AI engine.',
        });
      }
    }
  } catch (_error: any) {
    if (!res.headersSent) {
      return res.status(200).json({
        fallback: true,
        message: 'Engaging municipal analytical AI engine.',
      });
    } else {
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
}
