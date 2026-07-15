'use client';

import { Button } from '@/components/ui/button';
import * as React from 'react';

interface Doc {
  pageContent?: string;
  metdata?: {
    loc?: {
      pageNumber?: number;
    };
    source?: string;
  };
}
interface IMessage {
  role: 'assistant' | 'user';
  content?: string;
    documents?: Doc[];
}

const ChatComponent: React.FC = () => {
  const [message, setMessage] = React.useState<string>('');
  const [messages, setMessages] = React.useState<IMessage[]>([]);

  console.log({ messages });

  const handleSendChatMessage = async () => {
  try {
    setMessages(prev => [
      ...prev,
      { role: "user", content: message }
    ]);

    const res = await fetch(
      `http://localhost:8000/chat?message=${encodeURIComponent(message)}`
    );

    console.log(res.status);

    const data = await res.json();

    console.log("BACKEND RESPONSE:", data);
    console.log("MESSAGE:", data.message);

    setMessages(prev => [
      ...prev,
      {
        role: "assistant",
        content: data.message,
        documents: data.docs,
      },
    ]);
  } catch (err) {
    console.error(err);
  }
};

  return (
    <div className="p-4">
      <div>
        {messages.map((message, index) => (
          <pre key={index}>{JSON.stringify(message, null, 2)}</pre>
        ))}
      </div>
      <div className="fixed bottom-4 w-100 flex gap-3">
        <input
          className="flex-1 rounded border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
          value={message}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
          placeholder="Type your message here"
        />
        <Button onClick={handleSendChatMessage} disabled={!message.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
};
export default ChatComponent;