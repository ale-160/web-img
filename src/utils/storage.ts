/**
 * 存储工具函数
 */

export interface ImageHistoryEntry {
  id: string;
  imageData: string;
  width: number;
  height: number;
  name: string;
  timestamp: number;
  pinned?: boolean;
  imageSize?: number;
  originalFile?: {
    name: string;
    size: number;
    lastModified: number;
  };
}

export interface ImageStorageState {
  originalImages: Array<{
    file: {
      name: string;
      size: number;
      lastModified: number;
    };
    url: string;
    width: number;
    height: number;
    name: string;
    size: number;
  }>;
  previewImage: ImageHistoryEntry | null;
  selectedFormat: string;
  editedFileName: string;
  currentIndex: number;
}

const STORAGE_KEYS = {
  IMAGES: 'webimg-images',
  HISTORY: 'webimg-history',
  PINNED: 'webimg-pinned',
  LANGUAGE: 'webimg-language',
  THEME: 'webimg-theme',
};

// 获取字符串字节大小
export const getTextSize = (text: string): number => {
  return new Blob([text]).size;
};

// 格式化显示大小
export const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// 图片存储
export const saveImageState = (state: ImageStorageState): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.IMAGES, JSON.stringify(state));
  } catch {
    console.error('Failed to save image state');
  }
};

export const loadImageState = (): ImageStorageState | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.IMAGES);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

// 历史记录存储（图片级）
export const saveHistory = (history: ImageHistoryEntry[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  } catch {
    console.error('Failed to save history');
  }
};

export const loadHistory = (): ImageHistoryEntry[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const savePinned = (pinned: ImageHistoryEntry[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PINNED, JSON.stringify(pinned));
  } catch {
    console.error('Failed to save pinned');
  }
};

export const loadPinned = (): ImageHistoryEntry[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PINNED);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// 添加或更新历史记录（图片级：同名文件只保留一个）
export const addToHistory = (
  entry: ImageHistoryEntry,
  currentHistory: ImageHistoryEntry[],
  currentPinned: ImageHistoryEntry[]
): { history: ImageHistoryEntry[]; pinned: ImageHistoryEntry[] } => {
  // 计算图片大小并添加到记录中，确保默认不固定
  const entryWithSize = {
    ...entry,
    imageSize: getTextSize(entry.imageData),
    pinned: entry.pinned ?? false // 默认不固定
  };
  
  const fileName = entry.name;
  
  const updatedHistory = currentHistory.filter(
    item => !(item.name === fileName && !item.pinned)
  );
  
  const updatedPinned = currentPinned.filter(
    item => !(item.name === fileName && item.pinned)
  );
  
  const isInPinned = currentPinned.some(item => item.name === fileName);
  
  if (isInPinned) {
    // 如果同名文件已在固定列表中，更新固定列表，但历史记录保持不变
    return {
      history: updatedHistory,
      pinned: [entryWithSize, ...updatedPinned].slice(0, 100)
    };
  }
  
  return {
    history: [entryWithSize, ...updatedHistory].slice(0, 50),
    pinned: updatedPinned
  };
};

// 获取存储使用情况
export const getStorageInfo = (
  previewImage: ImageHistoryEntry | null,
  history: ImageHistoryEntry[],
  pinned: ImageHistoryEntry[]
): {
  totalSize: number;
  previewSize: number;
  historySize: number;
  pinnedSize: number;
} => {
  const previewSize = previewImage ? getTextSize(previewImage.imageData) : 0;
  const historySize = history.reduce((acc, item) => acc + getTextSize(item.imageData), 0);
  const pinnedSize = pinned.reduce((acc, item) => acc + getTextSize(item.imageData), 0);
  
  return {
    totalSize: previewSize + historySize + pinnedSize,
    previewSize,
    historySize,
    pinnedSize,
  };
};
