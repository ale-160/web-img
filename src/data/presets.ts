export interface SizePreset {
  id: string;
  name: string;
  nameEn: string;
  width: number;
  height: number;
  label: string;
  labelEn: string;
}

export interface WatermarkPreset {
  id: string;
  text: string;
  pattern: 'tile' | 'single' | 'diagonal';
  opacity: number;
}

export const sizePresets: SizePreset[] = [
  { id: 'xiaohongshu_cover', name: '小红书封面', nameEn: 'Xiaohongshu Cover', width: 1242, height: 1660, label: '1242×1660', labelEn: '1242×1660' },
  { id: 'xiaohongshu_square', name: '小红书方形', nameEn: 'Xiaohongshu Square', width: 1080, height: 1080, label: '1080×1080', labelEn: '1080×1080' },
  { id: 'wechat_avatar', name: '微信头像', nameEn: 'WeChat Avatar', width: 200, height: 200, label: '200×200', labelEn: '200×200' },
  { id: 'wechat_moment', name: '朋友圈', nameEn: 'WeChat Moment', width: 1080, height: 1920, label: '1080×1920', labelEn: '1080×1920' },
  { id: 'weibo_cover', name: '微博封面', nameEn: 'Weibo Cover', width: 920, height: 300, label: '920×300', labelEn: '920×300' },
  { id: 'weibo_pic', name: '微博配图', nameEn: 'Weibo Post', width: 1024, height: 1024, label: '1024×1024', labelEn: '1024×1024' },
  { id: 'zhihu_article', name: '知乎文章', nameEn: 'Zhihu Article', width: 690, height: 388, label: '690×388', labelEn: '690×388' },
  { id: 'douyin_cover', name: '抖音封面', nameEn: 'Douyin Cover', width: 1080, height: 1920, label: '1080×1920', labelEn: '1080×1920' },
  { id: 'bilibili_cover', name: 'B站封面', nameEn: 'Bilibili Cover', width: 1146, height: 717, label: '1146×717', labelEn: '1146×717' },
  { id: 'twitter_cover', name: 'Twitter封面', nameEn: 'Twitter Cover', width: 1500, height: 500, label: '1500×500', labelEn: '1500×500' },
  { id: 'instagram_post', name: 'Instagram帖子', nameEn: 'Instagram Post', width: 1080, height: 1080, label: '1080×1080', labelEn: '1080×1080' },
  { id: 'linkedin_banner', name: 'LinkedIn横幅', nameEn: 'LinkedIn Banner', width: 1584, height: 396, label: '1584×396', labelEn: '1584×396' },
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
  { id: 'gif', name: 'GIF', extension: '.gif' },
  { id: 'bmp', name: 'BMP', extension: '.bmp' },
  { id: 'tiff', name: 'TIFF', extension: '.tiff' },
] as const;

export type ExportFormat = typeof exportFormats[number]['id'];
