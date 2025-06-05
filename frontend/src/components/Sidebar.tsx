import React from 'react';

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
}

export function Sidebar({ sessions, currentSessionId, onSessionSelect, onNewChat }: SidebarProps) {
  return (
    <div className="w-80 h-screen bg-gray-900 text-white flex flex-col">
      {/* New Chat Button */}
      <button
        onClick={onNewChat}
        className="m-3 p-3 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-3 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="font-medium">New Chat</span>
      </button>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSessionSelect(session.id)}
            className={`w-full p-3 rounded-xl text-left transition-colors flex flex-col gap-1 ${
              session.id === currentSessionId
                ? 'bg-white/20'
                : 'hover:bg-white/10'
            }`}
          >
            <span className="font-medium truncate">{session.title}</span>
            <span className="text-sm text-white/70 truncate">{session.lastMessage}</span>
            <span className="text-xs text-white/50">
              {new Date(session.timestamp).toLocaleDateString()}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
