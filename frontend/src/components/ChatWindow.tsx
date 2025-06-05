import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, Source, ChatWindowProps } from '../types';
import { SourceModal } from './SourceModal';

interface MessageBubbleProps {
  message: Message;
  onSourceClick: (source: Source) => void;
}

function MessageBubble({ message, onSourceClick }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-3xl rounded-2xl p-5 shadow-md backdrop-blur-sm ${isUser ? 'bg-gradient-to-r from-primary to-blue-500 text-white/95' : 'bg-white/95 border border-gray-100 text-gray-800'}`}>
        <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''} prose-headings:text-inherit prose-p:text-inherit prose-strong:text-inherit`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className={`mt-4 pt-4 border-t ${isUser ? 'border-white/30' : 'border-gray-200'}`}>
            <p className={`text-xs font-semibold mb-2 ${isUser ? 'text-white/90' : 'text-gray-600'}`}>
              Sources ({message.confidence ? `${Math.round(message.confidence * 100)}% confidence` : 'No confidence score'})
            </p>
            <ul className="space-y-3">
              {message.sources.map((source, index) => (
                <li key={index} className="text-xs">
                  <button
                    onClick={() => onSourceClick(source)}
                    className={`w-full text-left rounded-xl p-3 transition-colors ${isUser ? 'bg-white/20 backdrop-blur-sm hover:bg-white/30' : 'bg-gray-50/90 hover:bg-gray-100/90'}`}
                  >
                    <p className={`font-bold mb-1 ${isUser ? 'text-white/95' : 'text-primary'}`}>
                      10 CFR Part {source.metadata.part}, Section {source.metadata.section}
                    </p>
                    {source.metadata.title && (
                      <p className={`font-semibold ${isUser ? 'text-white/90' : 'text-gray-800'}`}>
                        {source.metadata.title}
                      </p>
                    )}
                    <div className={`mt-2 flex items-center ${isUser ? 'text-white/90' : 'text-gray-600'}`}>
                      <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Click to view details</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingBubble() {
  return (
    <div className="flex justify-start">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}

export default function ChatWindow({ messages, loading }: ChatWindowProps) {
  const [selectedSource, setSelectedSource] = React.useState<Source | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSourceClick = (source: Source) => {
    setSelectedSource(source);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSource(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-[calc(100vh-12rem)] overflow-y-auto">
      <div className="space-y-6">
        {messages.map((message, index) => (
          <MessageBubble
            key={index}
            message={message}
            onSourceClick={handleSourceClick}
          />
        ))}
        {loading && <LoadingBubble />}
        <div ref={messagesEndRef} />
      </div>
      <SourceModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        source={selectedSource}
      />
    </div>
  );
}
