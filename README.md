# PDF-RAG

A Retrieval-Augmented Generation (RAG) application that allows users to upload PDF documents and ask questions in natural language.

## Features

- Upload PDF documents
- AI-powered question answering
- Semantic search using vector embeddings
- Google Gemini integration
- LangChain based RAG pipeline
- Qdrant vector database
- Docker support

## Tech Stack

### Frontend
- Next.js
- React
- TypeScript

### Backend
- Node.js
- Express.js

### AI & Database
- Google Gemini
- LangChain
- Qdrant

## Project Structure

```
client/
server/
docker-compose.yml
```

## Installation

Clone the repository

```bash
git clone https://github.com/Nikita14102004/PDF-RAG.git
```

Install dependencies

```bash
cd client
pnpm install

cd ../server
pnpm install
```

Run the project

```bash
docker-compose up
```

## Author

Nikita Gupta