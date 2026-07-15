import { Worker } from "bullmq";
import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

const worker = new Worker(
  "file-upload-queue",
  async (job) => {
    try {
      console.log("=================================");
      console.log("Job received");

      const data = JSON.parse(job.data);

      console.log(data);

      // Load PDF
      console.log("Loading PDF...");
      const loader = new PDFLoader(data.path);
      const docs = await loader.load();

      console.log(`PDF Loaded: ${docs.length} pages`);

      // Check API Key
      if (!process.env.GOOGLE_API_KEY) {
        throw new Error("GOOGLE_API_KEY not found in .env");
      }

      console.log(
        "API Key:",
        process.env.GOOGLE_API_KEY.substring(0, 10) + "..."
      );

      // Embeddings
      console.log("Creating Embeddings...");

      const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GOOGLE_API_KEY,
        model: "gemini-embedding-001",
      });

      console.log("Embeddings Created");

      // Qdrant
      console.log("Connecting to Qdrant...");

      const vectorStore = await QdrantVectorStore.fromDocuments(
        docs,
        embeddings,
        {
          url: "http://localhost:6333",
          collectionName: "langchainjs-testing",
        }
      );

      console.log("Documents added successfully.");
    } catch (err) {
      console.error("========== WORKER ERROR ==========");
      console.error(err);
      console.error("==================================");
    }
  },
  {
    concurrency: 1,
    connection: {
      host: "localhost",
      port: 6379,
    },
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.log(`Job ${job?.id} failed`);
  console.error(err);
});