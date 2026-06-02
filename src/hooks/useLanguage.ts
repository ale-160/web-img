'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

type Language = 'zh' | 'en';

interface Translations {
  appName: string;
  tagline: string;
  compress: string;
  convert: string;
  edit: string;
  watermark: string;
  merge: string;
  replaceColor: string;
  uploadTitle: string;
  uploadHint: string;
  quality: string;
  maxWidth: string;
  maxHeight: string;
  targetFormat: string;
  crop: string;
  rotate: string;
  flip: string;
  flipH: string;
  flipV: string;
  draw: string;
  filter: string;
  brightness: string;
  contrast: string;
  saturate: string;
  blur: string;
  textWatermark: string;
  imageWatermark: string;
  invisibleWatermark: string;
  watermarkText: string;
  opacity: string;
  rotation: string;
  pattern: string;
  patternTile: string;
  patternSingle: string;
  patternDiagonal: string;
  layout: string;
  horizontal: string;
  vertical: string;
  grid: string;
  gridCols: string;
  gap: string;
  targetColor: string;
  replacementColor: string;
  tolerance: string;
  undo: string;
  redo: string;
  download: string;
  downloadAll: string;
  clearAll: string;
  processing: string;
  original: string;
  preview: string;
  apply: string;
  reset: string;
  settings: string;
  theme: string;
  language: string;
  help: string;
  originalSize: string;
  previewSize: string;
  width: string;
  height: string;
  preserveRatio: string;
  addImage: string;
  noImage: string;
  drawingColor: string;
  brushSize: string;
  clearCanvas: string;
  selectArea: string;
  extractText: string;
  privacyNote: string;
  enterWatermarkText: string;
  embedData: string;
  extractData: string;
  embedSuccess: string;
  extractSuccess: string;
  noDataFound: string;
  noImagesToMerge: string;
}

const zhStrings: Translations = {
  appName: 'web-img',
  tagline: '纯前端图片处理工具',
  compress: '压缩',
  convert: '转换',
  edit: '编辑',
  watermark: '水印',
  merge: '合并',
  replaceColor: '颜色',
  uploadTitle: '拖拽图片到此处',
  uploadHint: '或点击选择文件，支持批量上传',
  quality: '质量',
  maxWidth: '最大宽度',
  maxHeight: '最大高度',
  targetFormat: '目标格式',
  crop: '裁剪',
  rotate: '旋转',
  flip: 'flip',
  flipH: '水平翻转',
  flipV: '垂直翻转',
  draw: '涂鸦',
  filter: '滤镜',
  brightness: '亮度',
  contrast: '对比度',
  saturate: '饱和度',
  blur: '模糊',
  textWatermark: '文字水印',
  imageWatermark: '图片水印',
  invisibleWatermark: '隐形水印',
  watermarkText: '水印文字',
  opacity: '透明度',
  rotation: '旋转角度',
  pattern: '排列方式',
  patternTile: '平铺',
  patternSingle: '单个',
  patternDiagonal: '对角线',
  layout: '布局',
  horizontal: '横向',
  vertical: '纵向',
  grid: '网格',
  gridCols: '列数',
  gap: '间距',
  targetColor: '目标颜色',
  replacementColor: '替换颜色',
  tolerance: '容差',
  undo: '撤回',
  redo: '重做',
  download: '下载',
  downloadAll: '批量下载',
  clearAll: '清空',
  processing: '处理中...',
  original: '原图',
  preview: '预览',
  apply: '应用',
  reset: '重置',
  settings: '设置',
  theme: '主题',
  language: '语言',
  help: '帮助',
  originalSize: '原图大小',
  previewSize: '预览大小',
  width: '宽度',
  height: '高度',
  preserveRatio: '保持比例',
  addImage: '添加图片',
  noImage: '请先上传图片',
  drawingColor: '画笔颜色',
  brushSize: '画笔大小',
  clearCanvas: '清空画布',
  selectArea: '选择区域',
  extractText: '提取文字',
  privacyNote: '所有图片在本地处理，不会上传到服务器',
  enterWatermarkText: '请输入水印文字',
  embedData: '嵌入信息',
  extractData: '提取信息',
  embedSuccess: '信息嵌入成功',
  extractSuccess: '信息提取成功',
  noDataFound: '未找到嵌入信息',
  noImagesToMerge: '请先添加要合并的图片',
};

const enStrings: Translations = {
  appName: 'web-img',
  tagline: 'Pure Frontend Image Tool',
  compress: 'Compress',
  convert: 'Convert',
  edit: 'Edit',
  watermark: 'Watermark',
  merge: 'Merge',
  replaceColor: 'Color',
  uploadTitle: 'Drag images here',
  uploadHint: 'Or click to select files, supports batch upload',
  quality: 'Quality',
  maxWidth: 'Max Width',
  maxHeight: 'Max Height',
  targetFormat: 'Target Format',
  crop: 'Crop',
  rotate: 'Rotate',
  flip: 'Flip',
  flipH: 'Flip Horizontal',
  flipV: 'Flip Vertical',
  draw: 'Draw',
  filter: 'Filter',
  brightness: 'Brightness',
  contrast: 'Contrast',
  saturate: 'Saturate',
  blur: 'Blur',
  textWatermark: 'Text Watermark',
  imageWatermark: 'Image Watermark',
  invisibleWatermark: 'Invisible Watermark',
  watermarkText: 'Watermark Text',
  opacity: 'Opacity',
  rotation: 'Rotation',
  pattern: 'Pattern',
  patternTile: 'Tile',
  patternSingle: 'Single',
  patternDiagonal: 'Diagonal',
  layout: 'Layout',
  horizontal: 'Horizontal',
  vertical: 'Vertical',
  grid: 'Grid',
  gridCols: 'Columns',
  gap: 'Gap',
  targetColor: 'Target Color',
  replacementColor: 'Replacement Color',
  tolerance: 'Tolerance',
  undo: 'Undo',
  redo: 'Redo',
  download: 'Download',
  downloadAll: 'Batch Download',
  clearAll: 'Clear',
  processing: 'Processing...',
  original: 'Original',
  preview: 'Preview',
  apply: 'Apply',
  reset: 'Reset',
  settings: 'Settings',
  theme: 'Theme',
  language: 'Language',
  help: 'Help',
  originalSize: 'Original Size',
  previewSize: 'Preview Size',
  width: 'Width',
  height: 'Height',
  preserveRatio: 'Preserve Ratio',
  addImage: 'Add Image',
  noImage: 'Please upload image first',
  drawingColor: 'Brush Color',
  brushSize: 'Brush Size',
  clearCanvas: 'Clear Canvas',
  selectArea: 'Select Area',
  extractText: 'Extract Text',
  privacyNote: 'All images are processed locally, never uploaded to server',
  enterWatermarkText: 'Please enter watermark text',
  embedData: 'Embed Data',
  extractData: 'Extract Data',
  embedSuccess: 'Data embedded successfully',
  extractSuccess: 'Data extracted successfully',
  noDataFound: 'No embedded data found',
  noImagesToMerge: 'Please add images to merge first',
};

export function useLanguage() {
  const [language, setLanguage] = useState<Language>('zh');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('web-img-language') as Language | null;
    if (saved) {
      setLanguage(saved);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => {
      const next = prev === 'zh' ? 'en' : 'zh';
      localStorage.setItem('web-img-language', next);
      return next;
    });
  }, []);

  const t = useMemo(() => {
    return (key: keyof Translations): string => {
      return language === 'zh' ? zhStrings[key] : enStrings[key];
    };
  }, [language]);

  return { t, language, toggleLanguage, isMounted };
}
