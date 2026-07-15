import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import axios from "axios";
import { Queue } from "bullmq";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { GoogleGenAI } from "@google/genai";
import { QdrantVectorStore } from "@langchain/qdrant";

dotenv.config();
console.log("GOOGLE =", process.env.GOOGLE_API_KEY);
console.log("OPENROUTER =", process.env.OPENROUTER_API_KEY);

const app = express();

app.use(cors());
app.use(express.json());

const client = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
  apiKey: process.env.GOOGLE_API_KEY,
});

const queue = new Queue("file-upload-queue", {
  connection: {
    host: "localhost",
    port: 6379,
  },
});

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },

  filename(req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage });

/* ===========================
   Upload PDF
=========================== */

app.post("/upload/pdf", upload.single("pdf"), async (req, res) => {
  try {
    await queue.add(
      "file-ready",
      JSON.stringify({
        filename: req.file.originalname,
        destination: req.file.destination,
        path: req.file.path,
      })
    );

    res.json({
      success: true,
      message: "PDF Uploaded Successfully",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/* ===========================
   Chat
=========================== */

app.get("/chat", async (req, res) => {
  try {
    console.log("========== CHAT ==========");

    const userQuery = String(req.query.message || "").trim();

    if (!userQuery) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    console.log("User Query:", userQuery);

    console.log("Connecting to Qdrant...");

    const vectorStore =
      await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
          url: "http://localhost:6333",
          collectionName: "langchainjs-testing",
        }
      );

    console.log("✅ Qdrant Connected");

    const retriever = vectorStore.asRetriever({
      k: 2,
    });

    console.log("Searching...");

    const result = await retriever.invoke(userQuery);

    console.log("Documents Found:", result.length);

    if (!result.length) {
      return res.json({
        success: true,
        message: "No relevant information found.",
        docs: [],
      });
    }

    const SYSTEM_PROMPT = `
You are a helpful AI assistant.

Answer ONLY from the provided PDF context.

Context:
${JSON.stringify(result)}
`;

    console.log("Calling Gemini...");

   const response = await axios.post(
  "https://openrouter.ai/api/v1/chat/completions",
  {
    model: "deepseek/deepseek-chat-v3-0324",
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: userQuery,
      },
    ],
  },
  {
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
  }
);

console.log("OpenRouter Success");

return res.json({
  success: true,
  message: response.data.choices[0].message.content,
  docs: result,
});



  } catch (err) {
    console.error("========== CHAT ERROR ==========");
    console.error(err);
    console.error(err.stack);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

app.listen(8000, () => {
  console.log("🚀 Server running on PORT 8000");
});