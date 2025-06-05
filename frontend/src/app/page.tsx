'use client';

import * as React from 'react';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';
import { SampleQuestions } from '../components/SampleQuestions';
import { Sidebar } from '../components/Sidebar';
import { Message } from '../types';

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
}

export default function Home() {
  const initialMessage: Message = {
    role: 'assistant',
    content: 'Hello! I am NucLex, your AI assistant for navigating nuclear regulations. I can help you understand and find information from the Code of Federal Regulations Title 10 (Energy). How can I assist you today?'
  };

  const [sessions, setSessions] = React.useState<ChatSession[]>([{
    id: 'default',
    title: 'New Chat',
    lastMessage: initialMessage.content,
    timestamp: new Date(),
    messages: [initialMessage]
  }]);
  const [currentSessionId, setCurrentSessionId] = React.useState('default');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId)!;
  const messages = currentSession.messages;

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

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'New Chat',
      lastMessage: initialMessage.content,
      timestamp: new Date(),
      messages: [initialMessage]
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const updateSessionTitle = (sessionId: string, message: string) => {
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        // Use the first few words of the user's message as the title
        const title = message.split(' ').slice(0, 5).join(' ') + '...';
        return { ...session, title };
      }
      return session;
    }));
  };

  const handleSendMessage = async (content: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Add user message to chat
      const userMessage: Message = { role: 'user', content };
      setSessions(prev => prev.map(session => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            lastMessage: content,
            timestamp: new Date(),
            messages: [...session.messages, userMessage]
          };
        }
        return session;
      }));

      // Update session title if it's the first message
      if (currentSession.messages.length === 1) {
        updateSessionTitle(currentSessionId, content);
      }

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
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      
      // Add assistant response to chat
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        confidence: data.confidence
      };
      setSessions(prev => prev.map(session => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            messages: [...session.messages, assistantMessage]
          };
        }
        return session;
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSessionSelect={setCurrentSessionId}
        onNewChat={handleNewChat}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-gradient-to-r from-primary to-blue-600 p-4 text-white shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center">
              <span className="text-primary text-xl font-bold">N</span>
            </div>
            <h1 className="text-xl font-bold">NucLex</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {messages.length === 1 && <SampleQuestions onQuestionClick={handleSendMessage} />}

            <div className="bg-white/40 backdrop-blur-sm rounded-2xl shadow-lg p-6">
              <div className="space-y-6">
                <ChatWindow messages={messages} loading={loading} />
                <div ref={chatEndRef} />
                <ChatInput onSendMessage={handleSendMessage} disabled={loading} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
