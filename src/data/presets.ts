export interface SizePreset {
  id: string;
  name: string;
  nameEn: string;
  width?: number;
  height?: number;
  label: string;
  labelEn: string;
  fixed: boolean;
  isDefaultPreset?: boolean; // 标记为系统默认预设，不可取消固定
}

export interface WatermarkPreset {
  id: string;
  text: string;
  pattern: 'tile' | 'single' | 'diagonal';
  opacity: number;
}

export const sizePresets: SizePreset[] = [
  { id: 'avatar', name: '头像', nameEn: 'Avatar', width: 200, height: 200, label: '头像', labelEn: 'Avatar', fixed: true, isDefaultPreset: true },
  { id: 'portrait', name: '竖屏', nameEn: 'Portrait', width: 1920, height: 1080, label: '竖屏', labelEn: 'Portrait', fixed: true, isDefaultPreset: true },
  { id: 'square', name: '方形', nameEn: 'Square', width: 1080, height: 1080, label: '方形', labelEn: 'Square', fixed: true, isDefaultPreset: true },
  { id: 'wechat_moment', name: '朋友圈', nameEn: 'WeChat Moment', width: 1080, height: 1920, label: '朋友圈', labelEn: 'WeChat Moment', fixed: false },
  { id: 'weibo_cover', name: '微博封面', nameEn: 'Weibo Cover', width: 920, height: 300, label: '微博封面', labelEn: 'Weibo Cover', fixed: false },
  { id: 'weibo_pic', name: '微博配图', nameEn: 'Weibo Post', width: 1024, height: 1024, label: '微博配图', labelEn: 'Weibo Post', fixed: false },
  { id: 'zhihu_article', name: '知乎文章', nameEn: 'Zhihu Article', width: 690, height: 388, label: '知乎文章', labelEn: 'Zhihu Article', fixed: false },
  { id: 'bilibili_cover', name: 'B站封面', nameEn: 'Bilibili Cover', width: 1146, height: 717, label: 'B站封面', labelEn: 'Bilibili Cover', fixed: false },
  { id: 'twitter_cover', name: 'Twitter封面', nameEn: 'Twitter Cover', width: 1500, height: 500, label: 'Twitter封面', labelEn: 'Twitter Cover', fixed: false },
  { id: 'linkedin_banner', name: 'LinkedIn横幅', nameEn: 'LinkedIn Banner', width: 1584, height: 396, label: 'LinkedIn横幅', labelEn: 'LinkedIn Banner', fixed: false },
];

export const watermarkPresets: WatermarkPreset[] = [
  { id: 'resume', text: '仅供XX公司入职使用', pattern: 'tile', opacity: 0.3 },
  { id: 'copyright', text: '© 版权所有 未经许可转载', pattern: 'single', opacity: 0.5 },
  { id: 'sample', text: '样稿 SAMPLE', pattern: 'diagonal', opacity: 0.4 },
  { id: 'confidential', text: '内部资料 请勿外传', pattern: 'tile', opacity: 0.3 },
  { id: 'personal', text: '个人使用', pattern: 'single', opacity: 0.4 },
  { id: 'wechat', text: '微信号: xxxxx', pattern: 'single', opacity: 0.5 },
];

// 移除了 'convert'，格式转换功能已整合到压缩功能中
export type ToolTab = 'compress' | 'edit' | 'watermark' | 'merge' | 'color';

// 支持的导出格式
export const exportFormats = [
  { id: 'jpeg', name: 'JPEG', extension: '.jpg' },
  { id: 'png', name: 'PNG', extension: '.png' },
  { id: 'webp', name: 'WebP', extension: '.webp' },
  { id: 'bmp', name: 'BMP', extension: '.bmp' },
  { id: 'tiff', name: 'TIFF', extension: '.tiff' },
  { id: 'ico', name: 'ICO', extension: '.ico' },
] as const;

export type ExportFormat = typeof exportFormats[number]['id'];
