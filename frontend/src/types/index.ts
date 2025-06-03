export interface Source {
  content: string;
  metadata: {
    part: string;
    section: string;
    title: string;
    parent_title?: string;
  };
  score: number;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  confidence?: number;
}

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export interface ChatWindowProps {
  messages: Message[];
  loading: boolean;
}
