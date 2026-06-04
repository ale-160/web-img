'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface ImageState {
  file: File;
  url: string;
  width: number;
  height: number;
  name: string;
  size: number;
}

export interface UseImageEditorReturn {
  originalImages: ImageState[];
  previewImage: ImageState | null;
  currentIndex: number;
  addImages: (files: FileList | File[]) => void;
  removeImage: (index: number) => void;
  clearImages: () => void;
  setPreviewFromOriginal: (index: number) => void;
  updatePreview: (imageData: string, width: number, height: number) => void;
  updatePreviewName: (newName: string) => void;
  resetPreview: () => void;
  getOriginalFormat: () => string | null;
}

export function useImageEditor(): UseImageEditorReturn {
  const [originalImages, setOriginalImages] = useState<ImageState[]>([]);
  const [previewImage, setPreviewImage] = useState<ImageState | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const objectUrls = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    return () => {
      objectUrls.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const loadImage = useCallback((file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const addImages = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    // 接受所有文件，因为PDF会被转换为图片
    const validFiles = fileArray;
    
    for (const file of validFiles) {
      const { width, height } = await loadImage(file);
      const url = URL.createObjectURL(file);
      objectUrls.current.set(file.name + file.size, url);
      
      setOriginalImages(prev => [...prev, {
        file,
        url,
        width,
        height,
        name: file.name,
        size: file.size,
      }]);
    }

    if (validFiles.length > 0 && !previewImage) {
      const { width, height } = await loadImage(validFiles[0]);
      setPreviewImage({
        file: validFiles[0],
        url: URL.createObjectURL(validFiles[0]),
        width,
        height,
        name: validFiles[0].name,
        size: validFiles[0].size,
      });
    }
  }, [loadImage, previewImage]);

  const removeImage = useCallback((index: number) => {
    setOriginalImages(prev => {
      const removed = prev[index];
      const key = removed.name + removed.size;
      if (objectUrls.current.has(key)) {
        URL.revokeObjectURL(objectUrls.current.get(key)!);
        objectUrls.current.delete(key);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const clearImages = useCallback(() => {
    objectUrls.current.forEach(url => URL.revokeObjectURL(url));
    objectUrls.current.clear();
    setOriginalImages([]);
    setPreviewImage(null);
    setCurrentIndex(0);
  }, []);

  const setPreviewFromOriginal = useCallback((index: number) => {
    setOriginalImages(prev => {
      if (index >= 0 && index < prev.length) {
        setCurrentIndex(index);
        setPreviewImage(prev[index]);
      }
      return prev;
    });
  }, []);

  const updatePreview = useCallback((imageData: string, width: number, height: number) => {
    if (previewImage) {
      const timestamp = Date.now();
      const newUrl = imageData;
      objectUrls.current.set(`preview-${timestamp}`, newUrl);
      
      setPreviewImage({
        ...previewImage,
        url: newUrl,
        width,
        height,
      });
    }
  }, [previewImage]);

  const updatePreviewName = useCallback((newName: string) => {
    if (previewImage) {
      setPreviewImage({
        ...previewImage,
        name: newName,
      });
    }
  }, [previewImage]);

  const resetPreview = useCallback(() => {
    if (originalImages.length > 0 && currentIndex < originalImages.length) {
      setPreviewImage({
        ...originalImages[currentIndex],
        name: originalImages[currentIndex].name,
      });
    }
  }, [originalImages, currentIndex]);

  const getOriginalFormat = useCallback((): string | null => {
    if (originalImages.length === 0) return null;
    const fileName = originalImages[currentIndex].name.toLowerCase();
    if (fileName.includes('.jpg') || fileName.includes('.jpeg')) return 'jpeg';
    if (fileName.includes('.png')) return 'png';
    if (fileName.includes('.webp')) return 'webp';
    if (fileName.includes('.gif')) return 'gif';
    if (fileName.includes('.bmp')) return 'bmp';
    if (fileName.includes('.tiff') || fileName.includes('.tif')) return 'tiff';
    return 'jpeg'; // 默认jpeg
  }, [originalImages, currentIndex]);

  return {
    originalImages,
    previewImage,
    currentIndex,
    addImages,
    removeImage,
    clearImages,
    setPreviewFromOriginal,
    updatePreview,
    updatePreviewName,
    resetPreview,
    getOriginalFormat,
  };
}
