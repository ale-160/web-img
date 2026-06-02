'use client';

import React, { useCallback, useState } from 'react';
import { Upload, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';

interface UploadZoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
  multiple?: boolean;
  accept?: string;
  hasExistingImage?: boolean;
}

// 支持的图片扩展名
const supportedImageExtensions = [
  '.jpg', '.jpeg', '.png', '.bmp', '.webp', '.svg',
  '.tiff', '.tif', '.ico', '.raw', '.dng', '.cr2', '.nef',
  '.arw', '.orf', '.sr2', '.heic', '.heif'
];

// 检查是否为图片文件（基于扩展名，因为有些raw格式MIME类型不标准）
const isImageFile = (file: File): boolean => {
  if (file.type.startsWith('image/') && !file.type.includes('gif')) return true;
  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  return supportedImageExtensions.includes(ext);
};

export function UploadZone({ onFilesSelected, multiple = true, accept = 'image/*'}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 只有当离开的是当前元素时才取消拖拽状态
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    let filesToProcess: File[] = [];

    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          const file = items[i].getAsFile();
          if (file) {
            filesToProcess.push(file);
          }
        }
      }
    }

    // 如果没有从DataTransferItems获取到，再使用files
    if (filesToProcess.length === 0 && e.dataTransfer.files.length > 0) {
      filesToProcess = Array.from(e.dataTransfer.files);
    }

    if (filesToProcess.length > 0) {
      // 过滤有效的图片文件
      const validImageFiles = filesToProcess.filter(isImageFile);

      if (validImageFiles.length > 0) {
        onFilesSelected(validImageFiles);
      } else if (filesToProcess.length > 0) {
        toast.error('仅支持图片文件格式');
      }
    }
  }, [onFilesSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const validFiles = Array.from(files).filter(isImageFile);
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      } else {
        toast.error('仅支持图片文件格式');
      }
    }
    e.target.value = '';
  }, [onFilesSelected]);

  return (
    <div
      className={`
        relative flex flex-col items-center justify-center w-full h-48 
        border-2 border-dashed rounded-lg cursor-pointer
        transition-colors duration-200
        ${isDragging 
          ? 'border-primary bg-primary/10' 
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        {isDragging ? (
          <ImagePlus className="w-12 h-12 text-primary" />
        ) : (
          <Upload className="w-12 h-12" />
        )}
        <p className="text-sm font-medium">
          {isDragging ? '释放图片' : '拖拽图片到此处'}
        </p>
        <p className="text-xs">
          或点击选择文件，支持批量上传
        </p>
      </div>
    </div>
  );
}
