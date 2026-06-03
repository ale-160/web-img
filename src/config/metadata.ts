import { Metadata } from "next";

export const METADATA_ZH = {
  title: "web-img · 在线图片处理工具 - 压缩、水印、格式转换",
  description: "纯前端在线图片处理工具箱，支持图片压缩、格式转换、图片水印、裁剪、旋转、镜像、RGB调色等功能。所有图片在本地处理，不会上传到服务器，保护您的隐私安全。",
  keywords: [
    "web-img",
    "图片处理",
    "图片压缩",
    "在线压缩",
    "图片水印",
    "格式转换",
    "PNG转WebP",
    "JPG压缩",
    "在线工具",
    "隐私保护",
    "无需注册",
    "无需服务器",
    "纯前端",
    "裁剪",
    "旋转",
    "镜像",
  ],
  authors: [{ name: "Ale", url: "https://ale160.com" }],
  creator: "Ale",
  publisher: "Ale",
  openGraph: {
    title: "web-img · 在线图片处理工具",
    description: "纯前端在线图片处理工具箱，支持压缩、水印、格式转换。所有图片本地处理，保护隐私。",
    url: "https://web-img.ale160.com",
    siteName: "web-img 官方网站",
    locale: "zh_CN",
    type: "website",
    images: [
      {
        url: "https://ale160.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "web-img 预览图"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "web-img · 在线图片处理工具",
    description: "纯前端在线图片处理工具箱，支持压缩、水印、格式转换。所有图片本地处理。",
    images: ["https://ale160.com/og-image.png"],
    creator: "@ale160"
  },
  alternates: {
    canonical: "https://web-img.ale160.com",
    languages: {
      "en": "https://web-img.ale160.com",
      "zh-CN": "https://web-img.ale160.com",
    }
  }
};

export const METADATA_EN = {
  title: "web-img · Online Image Tool - Compress, Watermark, Convert",
  description: "A privacy-focused online image toolbox with compression, format conversion, watermark, crop, rotate, flip, and RGB adjustment. All images are processed locally — never uploaded to any server.",
  keywords: [
    "web-img",
    "image processing",
    "image compression",
    "online compress",
    "watermark",
    "format conversion",
    "PNG to WebP",
    "JPG compress",
    "online tool",
    "privacy focused",
    "no registration",
    "no server",
    "client-side",
    "crop",
    "rotate",
    "flip",
  ],
  authors: [{ name: "Ale", url: "https://ale160.com" }],
  creator: "Ale",
  publisher: "Ale",
  openGraph: {
    title: "web-img · Online Image Tool",
    description: "A privacy-focused online image toolbox with compression, watermark, and format conversion. All images processed locally.",
    url: "https://web-img.ale160.com",
    siteName: "web-img Official Website",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://ale160.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "web-img Preview"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "web-img · Online Image Tool",
    description: "A privacy-focused online image toolbox with compression, watermark, and format conversion. All images processed locally.",
    images: ["https://ale160.com/og-image.png"],
    creator: "@ale160"
  },
  alternates: {
    canonical: "https://web-img.ale160.com",
    languages: {
      "en": "https://web-img.ale160.com",
      "zh-CN": "https://web-img.ale160.com",
    }
  }
};

export function getMetadata(lang: string = "en"): Metadata {
  const metadata = lang === "en" ? METADATA_EN : METADATA_ZH;

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords,
    authors: metadata.authors,
    creator: metadata.creator,
    publisher: metadata.publisher,
    icons: {
      icon: "https://ale160.com/favicon.ico",
    },
    formatDetection: {
      email: false,
      telephone: false,
    },
    openGraph: metadata.openGraph,
    twitter: metadata.twitter,
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
    alternates: metadata.alternates,
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
};
