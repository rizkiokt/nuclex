import * as React from 'react';
import { ChatWindowProps, Message } from '../types';

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className="flex items-start space-x-2">
        {!isUser && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0 mt-1">
            <span className="text-white text-sm font-semibold">N</span>
          </div>
        )}
        <div className={`max-w-[600px] rounded-lg p-4 shadow-sm ${
          isUser 
            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
            : 'bg-white border border-gray-100'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          {message.sources && message.sources.length > 0 && (
            <div className={`mt-3 pt-3 border-t ${isUser ? 'border-blue-400' : 'border-gray-100'}`}>
              <p className={`text-xs font-medium mb-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                Sources ({message.confidence ? `${Math.round(message.confidence * 100)}% confidence` : 'No confidence score'})
              </p>
              <ul className="space-y-2">
                {message.sources.map((source, index) => (
                  <li key={index} className="text-xs">
                    <div className={`rounded p-2 ${isUser ? 'bg-blue-500/30' : 'bg-gray-50'}`}>
                      <p className={`font-medium mb-1 ${isUser ? 'text-blue-100' : 'text-blue-700'}`}>
                        10 CFR Part {source.metadata.part}, Section {source.metadata.section}
                      </p>
                      {source.metadata.title && (
                        <p className={isUser ? 'text-blue-100' : 'text-gray-600'}>
                          {source.metadata.title}
                        </p>
                      )}
                      <p className={`mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                        Match score: {Math.round(source.score * 100)}%
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {isUser && (
          <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
            <span className="text-gray-600 text-sm">U</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatWindow({ messages, loading }: ChatWindowProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-[calc(100vh-12rem)] overflow-y-auto">
      <div className="space-y-2">
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white text-sm font-semibold">N</span>
              </div>
              <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
