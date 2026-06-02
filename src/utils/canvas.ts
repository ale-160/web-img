export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'gif' | 'bmp';

export const IMAGE_FORMATS: { id: ImageFormat; name: string; mimeType: string; extension: string }[] = [
  { id: 'jpeg', name: 'JPEG', mimeType: 'image/jpeg', extension: 'jpg' },
  { id: 'png', name: 'PNG', mimeType: 'image/png', extension: 'png' },
  { id: 'webp', name: 'WebP', mimeType: 'image/webp', extension: 'webp' },
  { id: 'gif', name: 'GIF', mimeType: 'image/gif', extension: 'gif' },
  { id: 'bmp', name: 'BMP', mimeType: 'image/bmp', extension: 'bmp' },
];

export function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function createCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

export function canvasToDataUrl(canvas: HTMLCanvasElement, format: ImageFormat = 'png', quality = 0.95): string {
  return canvas.toDataURL(`image/${format}`, quality);
}

export function canvasToBlob(canvas: HTMLCanvasElement, format: ImageFormat = 'png', quality = 0.95): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), `image/${format}`, quality);
  });
}

export async function compressImage(
  file: File,
  quality: number,
  maxWidth?: number,
  maxHeight?: number,
  format: ImageFormat = 'jpeg'
): Promise<Blob> {
  const img = await loadImage(file);
  let { width, height } = img;

  // 如果设置了目标尺寸，直接使用目标尺寸（强制缩放）
  if (maxWidth && maxHeight) {
    width = maxWidth;
    height = maxHeight;
  } else if (maxWidth) {
    // 只设置了宽度，按宽度等比缩放
    const ratio = maxWidth / width;
    width = maxWidth;
    height = Math.round(height * ratio);
  } else if (maxHeight) {
    // 只设置了高度，按高度等比缩放
    const ratio = maxHeight / height;
    height = maxHeight;
    width = Math.round(width * ratio);
  }

  const { canvas, ctx } = createCanvas(width, height);
  // 使用高质量渲染
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(img.src);

  return canvasToBlob(canvas, format, quality / 100);
}

export async function convertImage(
  file: File,
  targetFormat: ImageFormat
): Promise<Blob> {
  const img = await loadImage(file);
  const { canvas, ctx } = createCanvas(img.width, img.height);
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(img.src);

  return canvasToBlob(canvas, targetFormat);
}

export function rotateImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  angle: number,
  canvas: HTMLCanvasElement
): { width: number; height: number } {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const newWidth = img.width * cos + img.height * sin;
  const newHeight = img.width * sin + img.height * cos;

  canvas.width = newWidth;
  canvas.height = newHeight;
  ctx.translate(newWidth / 2, newHeight / 2);
  ctx.rotate(rad);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  return { width: newWidth, height: newHeight };
}

export function flipImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  horizontal: boolean,
  canvas: HTMLCanvasElement
): { width: number; height: number } {
  canvas.width = img.width;
  canvas.height = img.height;

  if (horizontal) {
    ctx.translate(img.width, 0);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(0, img.height);
    ctx.scale(1, -1);
  }

  ctx.drawImage(img, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  return { width: img.width, height: img.height };
}

export function cropImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  canvas: HTMLCanvasElement
): { width: number; height: number } {
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

  return { width, height };
}

export function applyFilters(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  filters: { brightness?: number; contrast?: number; saturate?: number; blur?: number },
  canvas: HTMLCanvasElement
): { width: number; height: number } {
  canvas.width = img.width;
  canvas.height = img.height;

  const filterString = [
    filters.brightness !== undefined ? `brightness(${filters.brightness}%)` : '',
    filters.contrast !== undefined ? `contrast(${filters.contrast}%)` : '',
    filters.saturate !== undefined ? `saturate(${filters.saturate}%)` : '',
    filters.blur !== undefined ? `blur(${filters.blur}px)` : '',
  ].filter(Boolean).join(' ');

  ctx.filter = filterString;
  ctx.drawImage(img, 0, 0);
  ctx.filter = 'none';

  return { width: img.width, height: img.height };
}

export function addTextWatermark(
  ctx: CanvasRenderingContext2D,
  text: string,
  options: {
    color?: string;
    fontSize?: number;
    opacity?: number;
    rotation?: number;
    pattern?: 'tile' | 'single' | 'diagonal';
    gapX?: number;
    gapY?: number;
    x?: number;
    y?: number;
  }
): void {
  const {
    color = '#ffffff',
    fontSize = 20,
    opacity = 0.5,
    rotation = 0,
    pattern = 'single',
    gapX = 50,
    gapY = 50,
    x,
    y,
  } = options;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.rotate((rotation * Math.PI) / 180);

  const textWidth = ctx.measureText(text).width;
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;

  if (pattern === 'tile') {
    const cols = Math.ceil(canvasWidth / (textWidth + gapX)) + 1;
    const rows = Math.ceil(canvasHeight / (fontSize + gapY)) + 1;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tx = col * (textWidth + gapX) - textWidth / 2;
        const ty = row * (fontSize + gapY);
        ctx.fillText(text, tx, ty);
      }
    }
  } else if (pattern === 'diagonal') {
    const diagonalLength = Math.sqrt(canvasWidth ** 2 + canvasHeight ** 2);
    const steps = Math.ceil(diagonalLength / (textWidth + gapX));

    for (let i = -steps; i <= steps; i++) {
      const tx = i * (textWidth + gapX) + canvasWidth / 2;
      const ty = (-i * (textWidth + gapX)) + canvasHeight / 2;
      ctx.fillText(text, tx, ty);
    }
  } else {
    const tx = x ?? canvasWidth / 2;
    const ty = y ?? canvasHeight / 2;
    ctx.fillText(text, tx, ty);
  }

  ctx.restore();
}

export function addImageWatermark(
  ctx: CanvasRenderingContext2D,
  watermarkImg: HTMLImageElement,
  options: {
    opacity?: number;
    scale?: number;
    x?: number;
    y?: number;
    pattern?: 'tile' | 'single' | 'diagonal';
    gapX?: number;
    gapY?: number;
  }
): void {
  const {
    opacity = 0.5,
    scale = 0.1,
    x,
    y,
    pattern = 'single',
    gapX = 100,
    gapY = 100,
  } = options;

  ctx.save();
  ctx.globalAlpha = opacity;

  const wmWidth = watermarkImg.width * scale;
  const wmHeight = watermarkImg.height * scale;
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;

  if (pattern === 'tile') {
    const cols = Math.ceil(canvasWidth / (wmWidth + gapX)) + 1;
    const rows = Math.ceil(canvasHeight / (wmHeight + gapY)) + 1;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        ctx.drawImage(watermarkImg, col * (wmWidth + gapX), row * (wmHeight + gapY), wmWidth, wmHeight);
      }
    }
  } else if (pattern === 'diagonal') {
    const diagonalLength = Math.sqrt(canvasWidth ** 2 + canvasHeight ** 2);
    const steps = Math.ceil(diagonalLength / Math.max(wmWidth, wmHeight));

    for (let i = -steps; i <= steps; i++) {
      const tx = i * (wmWidth + gapX) + canvasWidth / 2;
      const ty = (-i * (wmHeight + gapY)) + canvasHeight / 2;
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(Math.atan2(canvasHeight, canvasWidth));
      ctx.drawImage(watermarkImg, -wmWidth / 2, -wmHeight / 2, wmWidth, wmHeight);
      ctx.restore();
    }
  } else {
    const tx = x ?? canvasWidth / 2 - wmWidth / 2;
    const ty = y ?? canvasHeight / 2 - wmHeight / 2;
    ctx.drawImage(watermarkImg, tx, ty, wmWidth, wmHeight);
  }

  ctx.restore();
}

export function embedInvisibleWatermark(
  ctx: CanvasRenderingContext2D,
  text: string
): void {
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;

  const binaryText = textToBinary(text) + '00000000';
  let bitIndex = 0;

  for (let i = 0; i < data.length && bitIndex < binaryText.length; i += 4) {
    for (let channel = 0; channel < 3 && bitIndex < binaryText.length; channel++) {
      data[i + channel] = (data[i + channel] & 0xFE) | parseInt(binaryText[bitIndex], 2);
      bitIndex++;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

export function extractInvisibleWatermark(
  ctx: CanvasRenderingContext2D
): string | null {
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;

  let binaryText = '';

  for (let i = 0; i < data.length; i += 4) {
    for (let channel = 0; channel < 3; channel++) {
      binaryText += (data[i + channel] & 1).toString();
      if (binaryText.endsWith('00000000')) {
        return binaryToText(binaryText.slice(0, -8));
      }
    }
  }

  return null;
}

function textToBinary(text: string): string {
  return text.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join('');
}

function binaryToText(binary: string): string {
  let text = '';
  for (let i = 0; i < binary.length; i += 8) {
    text += String.fromCharCode(parseInt(binary.slice(i, i + 8), 2));
  }
  return text;
}

export function mergeImages(
  images: HTMLImageElement[],
  layout: 'horizontal' | 'vertical' | 'grid',
  options: {
    gridCols?: number;
    gap?: number;
  } = {}
): { canvas: HTMLCanvasElement; width: number; height: number } {
  const { gridCols = 2, gap = 0 } = options;

  let totalWidth = 0;
  let totalHeight = 0;

  if (layout === 'horizontal') {
    totalWidth = images.reduce((sum, img) => sum + img.width, 0) + (images.length - 1) * gap;
    totalHeight = Math.max(...images.map(img => img.height));
  } else if (layout === 'vertical') {
    totalHeight = images.reduce((sum, img) => sum + img.height, 0) + (images.length - 1) * gap;
    totalWidth = Math.max(...images.map(img => img.width));
  } else {
    const rows = Math.ceil(images.length / gridCols);
    const colWidths: number[] = Array(gridCols).fill(0);
    const rowHeights: number[] = Array(rows).fill(0);

    images.forEach((img, index) => {
      const col = index % gridCols;
      const row = Math.floor(index / gridCols);
      colWidths[col] = Math.max(colWidths[col], img.width);
      rowHeights[row] = Math.max(rowHeights[row], img.height);
    });

    totalWidth = colWidths.reduce((sum, w) => sum + w, 0) + (gridCols - 1) * gap;
    totalHeight = rowHeights.reduce((sum, h) => sum + h, 0) + (rows - 1) * gap;
  }

  const { canvas, ctx } = createCanvas(totalWidth, totalHeight);

  if (layout === 'horizontal') {
    let currentX = 0;
    images.forEach(img => {
      ctx.drawImage(img, currentX, 0);
      currentX += img.width + gap;
    });
  } else if (layout === 'vertical') {
    let currentY = 0;
    images.forEach(img => {
      ctx.drawImage(img, 0, currentY);
      currentY += img.height + gap;
    });
  } else {
    const rows = Math.ceil(images.length / gridCols);
    const colWidths: number[] = Array(gridCols).fill(0);
    const rowHeights: number[] = Array(rows).fill(0);

    images.forEach((img, index) => {
      const col = index % gridCols;
      const row = Math.floor(index / gridCols);
      colWidths[col] = Math.max(colWidths[col], img.width);
      rowHeights[row] = Math.max(rowHeights[row], img.height);
    });

    images.forEach((img, index) => {
      const col = index % gridCols;
      const row = Math.floor(index / gridCols);
      let currentX = 0;
      for (let c = 0; c < col; c++) {
        currentX += colWidths[c] + gap;
      }
      let currentY = 0;
      for (let r = 0; r < row; r++) {
        currentY += rowHeights[r] + gap;
      }
      ctx.drawImage(img, currentX, currentY);
    });
  }

  return { canvas, width: totalWidth, height: totalHeight };
}

export function replaceColor(
  ctx: CanvasRenderingContext2D,
  targetColor: { r: number; g: number; b: number },
  replacementColor: { r: number; g: number; b: number },
  tolerance: number
): void {
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const distance = Math.sqrt(
      Math.pow(r - targetColor.r, 2) +
      Math.pow(g - targetColor.g, 2) +
      Math.pow(b - targetColor.b, 2)
    );

    if (distance < tolerance) {
      data[i] = replacementColor.r;
      data[i + 1] = replacementColor.g;
      data[i + 2] = replacementColor.b;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

export function drawOnCanvas(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number; color: string; size: number }[],
  canvas: HTMLCanvasElement
): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  points.forEach(point => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, point.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = point.color;
    ctx.fill();
  });
}
