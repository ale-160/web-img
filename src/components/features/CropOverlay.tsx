'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface CropOverlayProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  cropWidth: number;
  cropHeight: number;
  onCropChange: (x: number, y: number) => void;
}

export function CropOverlay({ imageUrl, imageWidth, imageHeight, cropWidth, cropHeight, onCropChange }: CropOverlayProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageDisplaySize, setImageDisplaySize] = useState({ width: 0, height: 0 });

  // 计算图片在容器中的实际显示尺寸
  useEffect(() => {
    if (imageRef.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const imageRatio = imageWidth / imageHeight;
      const containerRatio = containerRect.width / containerRect.height;

      let displayWidth, displayHeight;
      if (imageRatio > containerRatio) {
        displayWidth = containerRect.width;
        displayHeight = containerRect.width / imageRatio;
      } else {
        displayHeight = containerRect.height;
        displayWidth = containerRect.height * imageRatio;
      }

      setImageDisplaySize({ width: displayWidth, height: displayHeight });
      
      // 初始化裁剪位置到中心
      setCropPosition({
        x: (displayWidth - cropWidth) / 2,
        y: (displayHeight - cropHeight) / 2
      });
    }
  }, [imageWidth, imageHeight, cropWidth, cropHeight]);

  // 计算实际的裁剪坐标（相对于图片原始尺寸）
  const updateCrop = useCallback((displayX: number, displayY: number) => {
    if (imageDisplaySize.width === 0) return;

    const scaleX = imageWidth / imageDisplaySize.width;
    const scaleY = imageHeight / imageDisplaySize.height;

    const actualX = Math.max(0, Math.min(displayX * scaleX, imageWidth - cropWidth));
    const actualY = Math.max(0, Math.min(displayY * scaleY, imageHeight - cropHeight));

    setCropPosition({ x: displayX, y: displayY });
    onCropChange(actualX, actualY);
  }, [imageWidth, imageHeight, imageDisplaySize, cropWidth, cropHeight, onCropChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - cropPosition.x,
      y: e.clientY - cropPosition.y
    });
  }, [cropPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // 限制在边界内
    const maxX = imageDisplaySize.width - cropWidth;
    const maxY = imageDisplaySize.height - cropHeight;
    const clampedX = Math.max(0, Math.min(newX, maxX));
    const clampedY = Math.max(0, Math.min(newY, maxY));

    setCropPosition({ x: clampedX, y: clampedY });
    updateCrop(clampedX, clampedY);
  }, [isDragging, dragStart, imageDisplaySize, cropWidth, cropHeight, updateCrop]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({
      x: touch.clientX - cropPosition.x,
      y: touch.clientY - cropPosition.y
    });
  }, [cropPosition]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];

    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;

    const maxX = imageDisplaySize.width - cropWidth;
    const maxY = imageDisplaySize.height - cropHeight;
    const clampedX = Math.max(0, Math.min(newX, maxX));
    const clampedY = Math.max(0, Math.min(newY, maxY));

    setCropPosition({ x: clampedX, y: clampedY });
    updateCrop(clampedX, clampedY);
  }, [isDragging, dragStart, imageDisplaySize, cropWidth, cropHeight, updateCrop]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (!imageDisplaySize.width) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <img
          src={imageUrl}
          alt="Preview"
          className="max-w-full max-h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative flex items-center justify-center h-full p-4 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div className="relative">
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Preview"
          className="max-w-full max-h-full object-contain"
          style={{
            width: imageDisplaySize.width,
            height: imageDisplaySize.height
          }}
        />

        {/* 覆盖层：裁剪区域外半透明 */}
        <div className="absolute inset-0 pointer-events-none">
          {/* 顶部遮罩 */}
          <div 
            className="absolute bg-black/50"
            style={{
              left: 0,
              top: 0,
              width: '100%',
              height: cropPosition.y
            }}
          />
          {/* 底部遮罩 */}
          <div 
            className="absolute bg-black/50"
            style={{
              left: 0,
              top: cropPosition.y + cropHeight,
              width: '100%',
              height: '100%'
            }}
          />
          {/* 左侧遮罩 */}
          <div 
            className="absolute bg-black/50"
            style={{
              left: 0,
              top: cropPosition.y,
              width: cropPosition.x,
              height: cropHeight
            }}
          />
          {/* 右侧遮罩 */}
          <div 
            className="absolute bg-black/50"
            style={{
              left: cropPosition.x + cropWidth,
              top: cropPosition.y,
              width: '100%',
              height: cropHeight
            }}
          />

          {/* 裁剪区域边框 */}
          <div 
            className={cn(
              'absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] cursor-move',
              isDragging && 'opacity-80'
            )}
            style={{
              left: cropPosition.x,
              top: cropPosition.y,
              width: cropWidth,
              height: cropHeight
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            {/* 网格线 */}
            <div className="absolute inset-0 flex">
              <div className="flex-1 border-r border-white/30" />
              <div className="flex-1" />
            </div>
            <div className="absolute inset-0 flex flex-col">
              <div className="flex-1 border-b border-white/30" />
              <div className="flex-1" />
            </div>

            {/* 调整手柄（可选，这里只做移动） */}
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-white rounded-sm shadow-md" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-sm shadow-md" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white rounded-sm shadow-md" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-sm shadow-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
