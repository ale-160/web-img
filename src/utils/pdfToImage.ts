'use client';

/**
 * 检查文件是否为PDF
 * @param file 文件
 * @returns 是否为PDF文件
 */
export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

/**
 * 将PDF文件转换为图片（占位函数，实际转换在新标签页中通过 CDN 进行）
 */
export async function pdfToImage(
  file: File,
  pageNumber: number = 1,
  scale: number = 2.0
): Promise<{ dataUrl: string; width: number; height: number }> {
  throw new Error('PDF to image conversion is handled in the new tab viewer');
}

/**
 * 获取PDF页数（占位函数）
 */
export async function getPdfPageCount(file: File): Promise<number> {
  return 1;
}

/**
 * 将PDF所有页转换为图片（占位函数）
 */
export async function pdfAllPagesToImages(
  file: File,
  scale: number = 2.0
): Promise<Array<{ dataUrl: string; width: number; height: number }>> {
  throw new Error('PDF to image conversion is handled in the new tab viewer');
}

/**
 * 将 dataURL 转换为指定格式并下载
 */
export function downloadImage(dataUrl: string, filename: string, format: string = 'png', quality: number = 0.9): void {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(img, 0, 0);
    
    let mimeType = 'image/png';
    let ext = '.png';
    
    if (format === 'jpeg' || format === 'jpg') {
      mimeType = 'image/jpeg';
      ext = '.jpg';
    } else if (format === 'webp') {
      mimeType = 'image/webp';
      ext = '.webp';
    }
    
    const resultDataUrl = canvas.toDataURL(mimeType, quality);
    const link = document.createElement('a');
    link.download = filename.replace(/\.[^/.]+$/, '') + ext;
    link.href = resultDataUrl;
    link.click();
  };
  img.src = dataUrl;
}

/**
 * 批量下载图片
 */
export async function downloadMultipleImages(
  images: Array<{ dataUrl: string; width: number; height: number }>,
  baseFilename: string,
  format: string = 'png',
  quality: number = 0.9
): Promise<void> {
  for (let i = 0; i < images.length; i++) {
    const filename = `${baseFilename.replace(/\.[^/.]+$/, '')}_page${i + 1}`;
    downloadImage(images[i].dataUrl, filename, format, quality);
    // 添加延迟避免浏览器阻止多次下载
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
