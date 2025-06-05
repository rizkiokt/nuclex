export interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  confidence?: number;
}

export interface Source {
  content: string;
  metadata: {
    part: string;
    section: string;
    title?: string;
    text?: string;
  };
  score?: number;
}

export interface ChatWindowProps {
  messages: Message[];
  loading: boolean;
}
