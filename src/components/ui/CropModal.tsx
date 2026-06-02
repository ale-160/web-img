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
  onCrop: (x: number, y: number, actualWidth?: number, actualHeight?: number) => void;
  initialX?: number;
  initialY?: number;
}

// 控制手柄类型
type HandleType = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw' | 'move';

export function CropModal({ isOpen, onClose, imageUrl, imageWidth, imageHeight, cropWidth: targetWidth, cropHeight: targetHeight, onCrop, initialX, initialY }: CropModalProps) {
  const { language } = useLanguage();
  
  // 实际裁剪区域尺寸（可能被用户调整）
  const [actualCropWidth, setActualCropWidth] = useState(targetWidth);
  const [actualCropHeight, setActualCropHeight] = useState(targetHeight);
  
  // 裁剪框位置
  const [cropPos, setCropPos] = useState({ x: 0, y: 0 });
  

  
  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState<HandleType | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [startCropData, setStartCropData] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // 计算显示尺寸
  const [displayData, setDisplayData] = useState({
    imageWidth: 0,
    imageHeight: 0,
    cropX: 0,
    cropY: 0,
    cropWidth: 0,
    cropHeight: 0,
    scale: 1,
  });

  // 初始化
  useEffect(() => {
    if (isOpen && containerRef.current && imageRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const scale = Math.min(
        containerRect.width / imageWidth,
        containerRect.height / imageHeight,
        1
      );
      
      const displayImageWidth = imageWidth * scale;
      const displayImageHeight = imageHeight * scale;
      const displayCropWidth = actualCropWidth * scale;
      const displayCropHeight = actualCropHeight * scale;

      const maxX = displayImageWidth - displayCropWidth;
      const maxY = displayImageHeight - displayCropHeight;
      
      let newX;
      let newY;
      
      if (initialX !== undefined && initialY !== undefined) {
        newX = initialX * scale;
        newY = initialY * scale;
      } else {
        newX = Math.max(0, maxX / 2);
        newY = Math.max(0, maxY / 2);
      }
      
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      
      setCropPos({ x: newX, y: newY });
      setDisplayData({
        imageWidth: displayImageWidth,
        imageHeight: displayImageHeight,
        cropX: newX,
        cropY: newY,
        cropWidth: displayCropWidth,
        cropHeight: displayCropHeight,
        scale,
      });
    }
  }, [isOpen, imageWidth, imageHeight, actualCropWidth, actualCropHeight, initialX, initialY]);

  // 处理手柄/移动拖拽开始
  const handleMouseDown = useCallback((e: React.MouseEvent, handleType: HandleType = 'move') => {
    e.preventDefault();
    e.stopPropagation();
    setActiveHandle(handleType);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setStartCropData({
      x: cropPos.x,
      y: cropPos.y,
      width: displayData.cropWidth,
      height: displayData.cropHeight,
    });
  }, [cropPos, displayData]);

  // 处理拖拽移动
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !activeHandle) return;
    e.preventDefault();
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // 处理移动或调整大小
    if (activeHandle === 'move') {
      const maxX = displayData.imageWidth - displayData.cropWidth;
      const maxY = displayData.imageHeight - displayData.cropHeight;
      
      let newX = startCropData.x + deltaX;
      let newY = startCropData.y + deltaY;
      
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      
      setCropPos({ x: newX, y: newY });
    } else {
      // 处理调整大小 - 保持宽高比
      const aspectRatio = targetWidth / targetHeight;
      
      let newWidth = startCropData.width;
      let newHeight = startCropData.height;
      let newX = startCropData.x;
      let newY = startCropData.y;
      
      // 根据手柄类型决定如何调整
      switch (activeHandle) {
        case 'e':
          newWidth = startCropData.width + deltaX;
          newHeight = newWidth / aspectRatio;
          break;
        case 'w':
          newWidth = startCropData.width - deltaX;
          newHeight = newWidth / aspectRatio;
          newX = startCropData.x + deltaX;
          break;
        case 's':
          newHeight = startCropData.height + deltaY;
          newWidth = newHeight * aspectRatio;
          break;
        case 'n':
          newHeight = startCropData.height - deltaY;
          newWidth = newHeight * aspectRatio;
          newY = startCropData.y + deltaY;
          break;
        case 'se':
          newWidth = startCropData.width + deltaX;
          newHeight = newWidth / aspectRatio;
          break;
        case 'sw':
          newWidth = startCropData.width - deltaX;
          newHeight = newWidth / aspectRatio;
          newX = startCropData.x + deltaX;
          break;
        case 'ne':
          newHeight = startCropData.height - deltaY;
          newWidth = newHeight * aspectRatio;
          newY = startCropData.y + deltaY;
          break;
        case 'nw':
          newWidth = startCropData.width - deltaX;
          newHeight = newWidth / aspectRatio;
          newX = startCropData.x + deltaX;
          newY = startCropData.y + deltaY;
          break;
      }
      
      // 限制最小尺寸
      const minSize = 50;
      if (newWidth < minSize) newWidth = minSize;
      if (newHeight < minSize) newHeight = minSize;
      
      // 限制在图片范围内
      const maxWidth = displayData.imageWidth - newX;
      const maxHeight = displayData.imageHeight - newY;
      
      if (newX < 0) {
        const adjust = -newX;
        newX = 0;
        newWidth = startCropData.width + adjust;
        newHeight = newWidth / aspectRatio;
      }
      
      if (newY < 0) {
        const adjust = -newY;
        newY = 0;
        newHeight = startCropData.height + adjust;
        newWidth = newHeight * aspectRatio;
      }
      
      if (newX + newWidth > displayData.imageWidth) {
        newWidth = displayData.imageWidth - newX;
        newHeight = newWidth / aspectRatio;
      }
      
      if (newY + newHeight > displayData.imageHeight) {
        newHeight = displayData.imageHeight - newY;
        newWidth = newHeight * aspectRatio;
      }
      
      // 更新裁剪尺寸
      setActualCropWidth(Math.round(newWidth / displayData.scale));
      setActualCropHeight(Math.round(newHeight / displayData.scale));
      setCropPos({ x: newX, y: newY });
    }
  }, [isDragging, activeHandle, dragStart, startCropData, displayData, targetWidth, targetHeight]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setActiveHandle(null);
  }, []);

  // 全局事件监听
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove as any);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove as any);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 确认裁剪
  const handleConfirm = useCallback(() => {
    const realX = cropPos.x / displayData.scale;
    const realY = cropPos.y / displayData.scale;
    
    onCrop(realX, realY, actualCropWidth, actualCropHeight);
    onClose();
  }, [cropPos, displayData.scale, actualCropWidth, actualCropHeight, onCrop, onClose]);

  // 重置
  const handleReset = useCallback(() => {
    setActualCropWidth(targetWidth);
    setActualCropHeight(targetHeight);
  }, [targetWidth, targetHeight]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold">
              {language === 'zh' ? '选择裁剪区域' : 'Select Crop Area'}
            </h3>
            <span className="text-sm text-muted-foreground">
              {actualCropWidth} × {actualCropHeight}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded bg-muted hover:bg-muted/80 text-sm"
            >
              {language === 'zh' ? '重置' : 'Reset'}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div
            ref={containerRef}
            className="relative w-full h-full flex items-center justify-center"
            style={{ minHeight: '400px' }}
          >
            <div className="relative" style={{ width: displayData.imageWidth, height: displayData.imageHeight }}>
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Crop Preview"
                className="block"
                style={{
                  width: displayData.imageWidth,
                  height: displayData.imageHeight,
                  objectFit: 'contain',
                }}
              />
              

              {/* 裁剪框遮罩层 */}
              <div className="absolute inset-0 pointer-events-none">
                {/* 顶部遮罩 */}
                <div 
                  className="absolute bg-black/50"
                  style={{ 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    height: cropPos.y 
                  }} 
                />
                {/* 底部遮罩 */}
                <div 
                  className="absolute bg-black/50"
                  style={{ 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    height: displayData.imageHeight - cropPos.y - displayData.cropHeight 
                  }} 
                />
                {/* 左侧遮罩 */}
                <div 
                  className="absolute bg-black/50"
                  style={{ 
                    top: cropPos.y, 
                    left: 0, 
                    width: cropPos.x, 
                    height: displayData.cropHeight 
                  }} 
                />
                {/* 右侧遮罩 */}
                <div 
                  className="absolute bg-black/50"
                  style={{ 
                    top: cropPos.y, 
                    right: 0, 
                    width: displayData.imageWidth - cropPos.x - displayData.cropWidth, 
                    height: displayData.cropHeight 
                  }} 
                />
              </div>
              
              {/* 裁剪框 */}
              <div
                className={cn(
                  'absolute border-2 border-primary pointer-events-auto',
                  isDragging ? '' : 'cursor-move'
                )}
                style={{
                  left: cropPos.x,
                  top: cropPos.y,
                  width: displayData.cropWidth,
                  height: displayData.cropHeight,
                }}
                onMouseDown={(e) => handleMouseDown(e, 'move')}
              >
                {/* 边角手柄 */}
                <div 
                  className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-primary rounded-full cursor-nw-resize" 
                  onMouseDown={(e) => handleMouseDown(e, 'nw')} 
                />
                <div 
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary rounded-full cursor-ne-resize" 
                  onMouseDown={(e) => handleMouseDown(e, 'ne')} 
                />
                <div 
                  className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-primary rounded-full cursor-sw-resize" 
                  onMouseDown={(e) => handleMouseDown(e, 'sw')} 
                />
                <div 
                  className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-primary rounded-full cursor-se-resize" 
                  onMouseDown={(e) => handleMouseDown(e, 'se')} 
                />
                
                {/* 边框中点手柄 */}
                <div 
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full cursor-n-resize" 
                  onMouseDown={(e) => handleMouseDown(e, 'n')} 
                />
                <div 
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 -mb-1.5 w-4 h-4 bg-primary rounded-full cursor-s-resize" 
                  onMouseDown={(e) => handleMouseDown(e, 's')} 
                />
                <div 
                  className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-4 h-4 bg-primary rounded-full cursor-w-resize" 
                  onMouseDown={(e) => handleMouseDown(e, 'w')} 
                />
                <div 
                  className="absolute top-1/2 right-0 -translate-y-1/2 -mr-1.5 w-4 h-4 bg-primary rounded-full cursor-e-resize" 
                  onMouseDown={(e) => handleMouseDown(e, 'e')} 
                />
                
                {/* 网格辅助线 */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/3 left-0 right-0 border-t border-dashed border-primary/30" />
                  <div className="absolute top-2/3 left-0 right-0 border-t border-dashed border-primary/30" />
                  <div className="absolute left-1/3 top-0 bottom-0 border-l border-dashed border-primary/30" />
                  <div className="absolute left-2/3 top-0 bottom-0 border-l border-dashed border-primary/30" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 p-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            {language === 'zh' ? '拖动裁剪框选择区域，拖动手柄调整大小' : 'Drag to move, drag handles to resize'}
          </div>
          <div className="flex items-center gap-2">
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
    </div>
  );
}
