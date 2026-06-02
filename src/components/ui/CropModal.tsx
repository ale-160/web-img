'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  cropWidth: number;
  cropHeight: number;
  onCrop: (x: number, y: number) => void;
  initialX?: number;
  initialY?: number;
}

export function CropModal({ isOpen, onClose, imageUrl, imageWidth, imageHeight, cropWidth, cropHeight, onCrop, initialX, initialY }: CropModalProps) {
  const { language } = useLanguage();
  const [cropPos, setCropPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

  // 初始化裁剪位置（居中）
  useEffect(() => {
    if (isOpen && containerRef.current && imageRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const scale = Math.min(
        containerRect.width / imageWidth,
        containerRect.height / imageHeight,
        1
      );
      const displayWidth = imageWidth * scale;
      const displayHeight = imageHeight * scale;
      const displayCropWidth = cropWidth * scale;
      const displayCropHeight = cropHeight * scale;

      setDisplaySize({ width: displayWidth, height: displayHeight });

      const maxX = displayWidth - displayCropWidth;
      const maxY = displayHeight - displayCropHeight;
      
      let newX = initialX !== undefined ? initialX * scale : maxX / 2;
      let newY = initialY !== undefined ? initialY * scale : maxY / 2;
      
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      
      setCropPos({ x: newX, y: newY });
    }
  }, [isOpen, imageWidth, imageHeight, cropWidth, cropHeight, initialX, initialY]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - cropPos.x,
      y: e.clientY - cropPos.y,
    });
  }, [cropPos]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();

    const containerRect = containerRef.current.getBoundingClientRect();
    const scale = Math.min(
      containerRect.width / imageWidth,
      containerRect.height / imageHeight,
      1
    );
    const displayWidth = imageWidth * scale;
    const displayHeight = imageHeight * scale;
    const displayCropWidth = cropWidth * scale;
    const displayCropHeight = cropHeight * scale;

    const maxX = displayWidth - displayCropWidth;
    const maxY = displayHeight - displayCropHeight;

    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;

    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    setCropPos({ x: newX, y: newY });
  }, [isDragging, dragStart, imageWidth, imageHeight, cropWidth, cropHeight]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 全局鼠标事件监听
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleConfirm = useCallback(() => {
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const scale = Math.min(
      containerRect.width / imageWidth,
      containerRect.height / imageHeight,
      1
    );
    
    const realX = cropPos.x / scale;
    const realY = cropPos.y / scale;
    
    onCrop(realX, realY);
    onClose();
  }, [cropPos, imageWidth, imageHeight, onCrop, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">
            {language === 'zh' ? '选择裁剪区域' : 'Select Crop Area'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div
            ref={containerRef}
            className="relative w-full h-full flex items-center justify-center"
            style={{ minHeight: '400px' }}
          >
            <div className="relative">
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Crop Preview"
                className="max-w-full max-h-[70vh] object-contain"
                style={{
                  maxWidth: Math.min(800, imageWidth),
                  maxHeight: Math.min(600, imageHeight),
                }}
              />
              
              {/* 裁剪框 */}
              <div
                className={cn(
                  'absolute border-2 border-primary rounded',
                  isDragging ? 'cursor-grabbing' : 'cursor-move'
                )}
                style={{
                  left: cropPos.x,
                  top: cropPos.y,
                  width: (cropWidth / imageWidth) * displaySize.width || cropWidth,
                  height: (cropHeight / imageHeight) * displaySize.height || cropHeight,
                }}
                onMouseDown={handleMouseDown}
              >
                {/* 控制手柄 */}
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary rounded-full" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80"
          >
            {language === 'zh' ? '取消' : 'Cancel'}
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {language === 'zh' ? '确认裁剪' : 'Confirm Crop'}
          </button>
        </div>
      </div>
    </div>
  );
}