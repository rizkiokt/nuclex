'use client';

import * as React from 'react';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';
import { Message } from '../types';

export default function Home() {
  const [messages, setMessages] = React.useState<Message[]>([{
    role: 'assistant',
    content: 'Hello! I am NucLex, your AI assistant for navigating nuclear regulations. I can help you understand and find information from the Code of Federal Regulations Title 10 (Energy). How can I assist you today?'
  }]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setError(null);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleSendMessage = async (content: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Add user message to chat
      const userMessage: Message = { role: 'user', content };
      setMessages(prev => [...prev, userMessage]);

      // Send to API
      const response = await fetch('http://localhost:8000/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversation_history: messages.filter(m => m.role === 'user')
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from server');
      }

      const data = await response.json();
      
      // Add assistant response to chat
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        confidence: data.confidence
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to get response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 p-6 text-white shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-blue-700 text-xl font-bold">N</span>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">NucLex</h1>
              <p className="text-blue-100">Your AI Assistant for Nuclear Regulations (10 CFR)</p>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex-1 container mx-auto max-w-5xl p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="space-y-6">
          <ChatWindow messages={messages} loading={loading} />
          <ChatInput onSendMessage={handleSendMessage} disabled={loading} />
        </div>
      </div>
    </main>
  );
}
