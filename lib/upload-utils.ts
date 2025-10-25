// Utility functions for chunked uploads

export interface ChunkInfo {
  chunkIndex: number;
  totalChunks: number;
  sessionId: string;
}

export interface UploadProgress {
  status: 'receiving' | 'reconstructing' | 'saving' | 'complete' | 'waiting' | 'error';
  progress: number;
  received?: number;
  total?: number;
  error?: string;
}

export const createChunks = (data: string, chunkSize: number = 400 * 1024): string[] => {
  const chunks = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }
  return chunks;
};

export const generateSessionId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

export const calculatePayloadSize = (data: any): number => {
  return new Blob([JSON.stringify(data)]).size;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};