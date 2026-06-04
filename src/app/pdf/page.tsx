'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as pdfjsLib from 'pdfjs-dist';
import { UploadZone } from '@/components/ui/UploadZone';
import { isPdfFile } from '@/utils/pdfToImage';
import { FileText, ArrowLeft, Download, X, Loader2 } from 'lucide-react';
import { GlobalWorkerOptions } from 'pdfjs-dist';

// 设置 worker 源（客户端才需要）
if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export default function PdfPage() {
  const router = useRouter();
  const [currentPdfFile, setCurrentPdfFile] = useState<File | null>(null);
  const [pdfObjectUrl, setPdfObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 拖拽相关状态
  const [isDragging, setIsDragging] = useState(false);
  
  // PDF 文档相关
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageScale, setPageScale] = useState(2.0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderLockRef = useRef(false);
  
  // 下载模态框
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('png');
  const [downloadQuality, setDownloadQuality] = useState('100'); // 默认最佳质量
  const [pageRangeInput, setPageRangeInput] = useState('1');
  const [converting, setConverting] = useState(false);

  const handleShowDownloadModal = () => {
    setPageRangeInput(currentPage.toString());
    setShowDownloadModal(true);
  };

  // 清理资源
  useEffect(() => {
    return () => {
      if (pdfObjectUrl) {
        URL.revokeObjectURL(pdfObjectUrl);
      }
    };
  }, [pdfObjectUrl]);

  // 监听 pdfDoc 变化，渲染第一页（解决首次加载不显示问题）
  useEffect(() => {
    if (pdfDoc && canvasRef.current && !renderLockRef.current) {
      renderLockRef.current = true;
      renderPage(1, pdfDoc).then(() => {
        renderLockRef.current = false;
      });
    }
  }, [pdfDoc]);

  // 处理文件选择
  const handleFilesSelected = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const pdfFile = fileArray.find(isPdfFile);
    
    if (!pdfFile) {
      setError('请选择 PDF 文件');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // 清理之前的资源
    if (pdfObjectUrl) {
      URL.revokeObjectURL(pdfObjectUrl);
    }
    
    const objectUrl = URL.createObjectURL(pdfFile);
    setCurrentPdfFile(pdfFile);
    setPdfObjectUrl(objectUrl);
    
    // 加载 PDF 文档
    await loadPdfDocument(pdfFile);
    setLoading(false);
  };

  // 全局拖拽处理 - dragOver
  const handleDragOver = useCallback((e: React.DragEvent | DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  // 全局拖拽处理 - dragLeave
  const handleDragLeave = useCallback((e: React.DragEvent | DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  // 全局拖拽处理 - drop
  const handleDrop = useCallback((e: React.DragEvent | DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const items = (e as any).dataTransfer?.items;
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
    
    if (filesToProcess.length === 0 && (e as any).dataTransfer?.files.length > 0) {
      filesToProcess = Array.from((e as any).dataTransfer.files);
    }
    
    if (filesToProcess.length > 0) {
      const validPdfFiles = filesToProcess.filter(isPdfFile);
      if (validPdfFiles.length > 0) {
        handleFilesSelected(validPdfFiles);
      } else if (filesToProcess.length > 0) {
        setError('请选择 PDF 文件');
      }
    }
  }, []);

  // 添加全局拖拽事件监听
  useEffect(() => {
    if (!currentPdfFile) {
      const handleNativeDragOver = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
      };
      
      const handleNativeDragLeave = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
      };
      
      const handleNativeDrop = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        const filesToProcess = Array.from(e.dataTransfer.files);
        if (filesToProcess.length > 0) {
          const validPdfFiles = filesToProcess.filter(isPdfFile);
          if (validPdfFiles.length > 0) {
            handleFilesSelected(validPdfFiles);
          } else if (filesToProcess.length > 0) {
            setError('请选择 PDF 文件');
          }
        }
      };
      
      window.addEventListener('dragover', handleNativeDragOver);
      window.addEventListener('dragleave', handleNativeDragLeave);
      window.addEventListener('drop', handleNativeDrop);
      
      return () => {
        window.removeEventListener('dragover', handleNativeDragOver);
        window.removeEventListener('dragleave', handleNativeDragLeave);
        window.removeEventListener('drop', handleNativeDrop);
      };
    }
  }, [currentPdfFile]);

  // 加载 PDF 文档
  const loadPdfDocument = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setCurrentPage(1);
      // 第一页渲染由 useEffect 处理
    } catch (err) {
      console.error('加载 PDF 失败:', err);
      setError('加载 PDF 失败，请重试');
    }
  };

  // 渲染指定页面
  const renderPage = async (pageNum: number, doc: any = pdfDoc) => {
    if (!doc || !canvasRef.current) return;
    
    try {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: pageScale });
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      setCurrentPage(pageNum);
    } catch (err) {
      console.error('渲染页面失败:', err);
      setError('渲染页面失败');
    }
  };

  // 上一页
  const handlePrevPage = () => {
    if (currentPage > 1) {
      renderPage(currentPage - 1);
    }
  };

  // 下一页
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      renderPage(currentPage + 1);
    }
  };

  // 解析页面范围输入
  const parsePageRange = (input: string): number[] => {
    const result: number[] = [];
    // 同时兼容英文逗号和中文逗号
    const parts = input.replace(/，/g, ',').split(',');
    
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(s => parseInt(s.trim()));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
            if (i > 0 && i <= totalPages) {
              result.push(i);
            }
          }
        }
      } else {
        const num = parseInt(trimmed);
        if (!isNaN(num) && num > 0 && num <= totalPages) {
          result.push(num);
        }
      }
    }
    
    // 去重并排序
    return [...new Set(result)].sort((a, b) => a - b);
  };

  // 转换并下载
  const handleConvertAndDownload = async () => {
    if (!pdfDoc || !currentPdfFile) return;
    
    const pages = parsePageRange(pageRangeInput);
    if (pages.length === 0) {
      setError('请输入有效的页面范围');
      return;
    }
    
    setConverting(true);
    
    try {
      const baseName = currentPdfFile.name.replace(/\.pdf$/i, '');
      const quality = parseInt(downloadQuality) / 100;
      
      // 创建临时画布进行渲染
      const tempCanvas = document.createElement('canvas');
      
      for (let i = 0; i < pages.length; i++) {
        const pageNum = pages[i];
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: pageScale });
        
        tempCanvas.width = viewport.width;
        tempCanvas.height = viewport.height;
        
        const context = tempCanvas.getContext('2d');
        if (!context) continue;
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        // 生成数据 URL
        let dataUrl: string;
        let ext: string;
        
        switch (downloadFormat) {
          case 'jpeg':
            dataUrl = tempCanvas.toDataURL('image/jpeg', quality);
            ext = '.jpg';
            break;
          case 'webp':
            dataUrl = tempCanvas.toDataURL('image/webp', quality);
            ext = '.webp';
            break;
          default:
            dataUrl = tempCanvas.toDataURL('image/png');
            ext = '.png';
        }
        
        // 下载单页
        const filename = pages.length === 1 
          ? `${baseName}${ext}` 
          : `${baseName}_page${pageNum}${ext}`;
        
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        link.click();
        
        // 添加小延迟避免浏览器阻止多次下载
        if (i < pages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }
      
      setShowDownloadModal(false);
    } catch (err) {
      console.error('转换失败:', err);
      setError('转换失败，请重试');
    } finally {
      setConverting(false);
    }
  };

  // 关闭 PDF
  const handleClose = () => {
    if (pdfObjectUrl) {
      URL.revokeObjectURL(pdfObjectUrl);
    }
    setCurrentPdfFile(null);
    setPdfObjectUrl(null);
    setPdfDoc(null);
    setError(null);
    setCurrentPage(1);
    setTotalPages(0);
  };

  return (
    <div 
      className={`flex flex-col min-h-screen bg-background text-foreground transition-colors duration-200 ${
        isDragging && !currentPdfFile ? 'bg-primary/5' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 全局拖拽指示器 */}
      {isDragging && !currentPdfFile && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 pointer-events-none">
          <div className="bg-card p-8 rounded-xl shadow-2xl border-2 border-dashed border-primary flex flex-col items-center gap-4">
            <FileText className="w-16 h-16 text-primary" />
            <p className="text-lg font-semibold">拖拽 PDF 到此处</p>
          </div>
        </div>
      )}

      {/* 顶部导航 */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回</span>
          </button>
          <h1 className="text-lg font-bold text-primary">PDF 转换工具</h1>
        </div>
      </header>

      {/* 主内容 */}
      <main className="flex-1 flex flex-col">
        {!currentPdfFile ? (
          // 上传区域
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-2xl">
              <div className="text-center mb-8">
                <FileText className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h2 className="text-2xl font-bold mb-2">上传您的 PDF 文件</h2>
                <p className="text-muted-foreground">
                  选择或拖拽一个 PDF 文件进行转换
                </p>
              </div>
              
              {/* 自定义上传区域，提示文字改为PDF相关 */}
              <div className="relative flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 h-48 hover:border-primary/50 hover:bg-muted/50">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      const validFiles = Array.from(files).filter(isPdfFile);
                      if (validFiles.length > 0) {
                        handleFilesSelected(validFiles);
                      }
                    }
                    e.target.value = '';
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <FileText className="w-12 h-12" />
                  <p className="text-sm font-medium">
                    拖拽 PDF 到此处
                  </p>
                  <p className="text-xs">或点击选择文件</p>
                </div>
              </div>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
                  {error}
                </div>
              )}
            </div>
          </div>
        ) : (
          // PDF 预览区域
          <div className="flex-1 flex flex-col">
            {/* 工具栏 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <span className="font-semibold truncate max-w-md">
                  {currentPdfFile.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({totalPages} 页)
                </span>
              </div>
              <div className="flex items-center gap-3">
                {pdfDoc && (
                  <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage <= 1}
                      className="px-3 py-1.5 rounded hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      ‹
                    </button>
                    <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage >= totalPages}
                      className="px-3 py-1.5 rounded hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      ›
                    </button>
                  </div>
                )}
                <button
                  onClick={handleShowDownloadModal}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>转换并下载</span>
                </button>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PDF 渲染区域 - 扩大显示 */}
            <div className="flex-1 overflow-auto bg-[#1a1a1a] p-8 flex items-start justify-center">
              {loading ? (
                <div className="flex items-center justify-center h-full text-white">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                    <p>正在加载 PDF...</p>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-none flex items-start justify-center">
                  <div className="bg-white shadow-2xl rounded-lg overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      className="w-full h-auto"
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                  </div>
                </div>
              )}
              {error && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                  {error}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 下载模态框 */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <h3 className="text-lg font-semibold">转换并下载</h3>
              <button
                onClick={() => setShowDownloadModal(false)}
                disabled={converting}
                className="p-2 rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">下载格式</label>
                <select
                  value={downloadFormat}
                  onChange={(e) => setDownloadFormat(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  disabled={converting}
                >
                  <option value="png">PNG - 便携式网络图形</option>
                  <option value="jpeg">JPEG - 联合图像专家组</option>
                  <option value="webp">WebP - Google 格式</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">图片质量 (1-100)</label>
                <select
                  value={downloadQuality}
                  onChange={(e) => setDownloadQuality(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  disabled={converting}
                >
                  <option value="100">最佳 (100%)</option>
                  <option value="90">高 (90%)</option>
                  <option value="75">中 (75%)</option>
                  <option value="50">低 (50%)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">页面范围</label>
                <input
                  type="text"
                  value={pageRangeInput}
                  onChange={(e) => setPageRangeInput(e.target.value)}
                  placeholder="例如: 1-3, 5"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  disabled={converting}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  单页: 1 · 范围: 1-3 · 多个: 1,3,5 或 1，3，5
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-4 py-3 border-t border-border">
              <button
                onClick={() => setShowDownloadModal(false)}
                disabled={converting}
                className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleConvertAndDownload}
                disabled={converting}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {converting && <Loader2 className="w-4 h-4 animate-spin" />}
                {converting ? '转换中...' : '下载'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 功能说明 */}
      <div className="px-4 py-3 border-t border-border bg-muted/10 text-xs text-muted-foreground text-center">
        支持多页转换 · 使用高分辨率渲染确保转换效果最佳
      </div>
    </div>
  );
}
