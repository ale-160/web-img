// sitemap 配置 — 添加新页面只需在此添加
const SITEMAP_PAGES = [
  {
    path: "",
    priority: 1.0,
    changefreq: "weekly" as const,
  },
  {
    path: "pdf",
    priority: 0.9,
    changefreq: "monthly" as const,
  },
  {
    path: "zh",
    priority: 0.9,
    changefreq: "weekly" as const,
  },
  {
    path: "zh/pdf",
    priority: 0.8,
    changefreq: "monthly" as const,
  },
];

export function generateSitemapXml(): string {
  const today = new Date().toISOString().split("T")[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

  SITEMAP_PAGES.forEach((item) => {
    const loc = item.path
      ? `https://web-img.ale160.com/${item.path}/`
      : "https://web-img.ale160.com/";

    xml += `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://web-img.ale160.com/${item.path.replace('zh/', '')}/"/>
    <xhtml:link rel="alternate" hreflang="zh" href="https://web-img.ale160.com/zh/${item.path.replace('zh/', '')}/"/>
  </url>
`;
  });

  xml += `</urlset>`;
  return xml;
}

// 控制台输出 sitemap.xml 内容（用于手动复制到 public 目录）
if (typeof require !== "undefined" && require.main === module) {
  console.log(generateSitemapXml());
}
