import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to initialize server-side Gemini client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Gemini Chat API endpoint (supporting streaming via SSE and multi-model quota resilience)
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, systemInstruction, stream = true } = req.body;
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

    // Candidate models with quota fallback order
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
          const errMsg = err?.message || String(err);
          const isAuthError =
            err?.status === 401 ||
            err?.code === 401 ||
            errMsg.includes('401') ||
            errMsg.includes('UNAUTHENTICATED') ||
            errMsg.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') ||
            errMsg.includes('API_KEY_SERVICE_BLOCKED') ||
            errMsg.includes('authentication credentials');

          if (isAuthError) {
            // Authentication issue with API key, stop model rotation immediately
            break;
          }

          if (res.headersSent) {
            break;
          }
        }
      }

      if (!streamSucceeded && !res.headersSent) {
        // Fallback: try non-streaming generateContent in case stream was temporarily unavailable
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
            const text = response.text || '';
            if (text) {
              return res.status(200).json({ text });
            }
          } catch (_err) {
            // continue candidate loop
          }
        }

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
        } catch (err: any) {
          const errMsg = err?.message || String(err);
          const isAuthError =
            err?.status === 401 ||
            err?.code === 401 ||
            errMsg.includes('401') ||
            errMsg.includes('UNAUTHENTICATED') ||
            errMsg.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') ||
            errMsg.includes('API_KEY_SERVICE_BLOCKED') ||
            errMsg.includes('authentication credentials');

          if (isAuthError) {
            break;
          }
        }
      }

      if (generateSucceeded) {
        return res.json({ text: resultText });
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
      res.write(`data: [DONE]\n\n`);
      res.end();
    }
  }
});

// Health check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// Vite Middleware for development / Static files for production
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
