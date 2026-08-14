import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.OPENAI_API_KEY) {
  console.error("Falta OPENAI_API_KEY");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(express.json({ limit: "32kb" }));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/reply", async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();
    const style = String(req.body.style || "natural").trim();

    if (!message) {
      return res.status(400).json({
        error: "No se recibió ningún mensaje."
      });
    }

    const response = await openai.responses.create({
      model: process.env.MODEL || "gpt-5",
      store: false,

      instructions: `
Eres una IA que ayuda a responder conversaciones.

Analiza el mensaje recibido y crea tres respuestas:
1. Natural
2. Coqueta
3. Divertida

Las respuestas deben sonar humanas, cortas y naturales.
No inventes sentimientos o intenciones.
No manipules ni presiones a la otra persona.

El usuario quiere este estilo:
${style}
      `,

      input: message,

      text: {
        format: {
          type: "json_schema",
          name: "reply_options",
          strict: true,
          schema: {
            type: "object",
            properties: {
              natural: { type: "string" },
              coqueta: { type: "string" },
              divertida: { type: "string" }
            },
            required: [
              "natural",
              "coqueta",
              "divertida"
            ],
            additionalProperties: false
          }
        }
      }
    });

    const data = JSON.parse(response.output_text);

    res.json({
      replies: [
        {
          title: "😎 Natural",
          text: data.natural
        },
        {
          title: "😉 Coqueta",
          text: data.coqueta
        },
        {
          title: "😂 Divertida",
          text: data.divertida
        }
      ]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "No se pudo generar la respuesta."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor funcionando en puerto ${PORT}`);
});
