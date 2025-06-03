import * as React from 'react';
import { ChatInputProps } from '../types';

export default function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = React.useState('');
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [message]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim()) {
        onSendMessage(message);
        setMessage('');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="space-y-4">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about nuclear regulations..."
            className="w-full p-4 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none min-h-[60px] max-h-[150px] text-gray-700 placeholder-gray-400"
            disabled={disabled}
            rows={1}
          />
          <div className="absolute right-3 bottom-3 flex items-center space-x-2">
            <span className="text-xs text-gray-400">
              Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded-md text-gray-500 font-mono text-[10px]">Enter ↵</kbd> to send
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Ask me anything about US nuclear regulations (10 CFR)
          </div>
          <button
            type="submit"
            disabled={disabled || !message.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-medium text-sm transition-all duration-200 shadow-sm hover:shadow flex items-center space-x-2"
          >
            <span>Send</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
}
