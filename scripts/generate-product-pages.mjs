import fs from "node:fs/promises";

const BASE = "https://bslenamhung.github.io/san-pham-me-va-be";
const SITE = "https://bslenamhung.github.io";
const LOGO = SITE + "/theo-doi-thai-ky/clinic-logo-bs-hung.jpg?v=20261011-official-logo";
const ROOT = process.cwd();

const config = await fs.readFile("config.js", "utf8");
const url = config.match(/SUPABASE_URL\s*:\s*"([^"]+)"/)?.[1];
const key = config.match(/SUPABASE_PUBLISHABLE_KEY\s*:\s*"([^"]+)"/)?.[1];
if (!url || !key) throw new Error("Không đọc được cấu hình Supabase công khai; dừng để tránh tạo trang lỗi.");

function esc(value = "") {
  return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
function clean(value = "") {
  return String(value ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
}
function slugify(p) {
  const raw = String(p.slug || p.name || "").trim();
  return raw.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 150);
}
function jsonHtml(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

const endpoint = new URL("/rest/v1/shop_products", url);
endpoint.searchParams.set("select", "id,name,slug,description,category,subcategory,origin,price_vnd,image_url,declared_ingredients,source_url,is_active,created_at,updated_at");
endpoint.searchParams.set("is_active", "eq.true");
endpoint.searchParams.set("order", "name.asc");
const response = await fetch(endpoint, { headers: { apikey: key, Authorization: "Bearer " + key } });
if (!response.ok) throw new Error("Supabase trả về HTTP " + response.status + "; không ghi đè bất kỳ trang nào.");
const products = await response.json();
if (!Array.isArray(products) || products.length === 0) throw new Error("Không có sản phẩm đang hiển thị; dừng để tránh tạo sitemap rỗng.");

const seen = new Set();
for (const p of products) {
  const slug = slugify(p);
  if (!slug) throw new Error("Sản phẩm thiếu slug hợp lệ: " + (p.name || p.id));
  if (seen.has(slug)) throw new Error("Slug sản phẩm bị trùng: " + slug + ". Dừng để tránh ghi đè nhầm.");
  seen.add(slug);
}

await fs.mkdir("san-pham", { recursive: true });
const urls = [];
for (const p of products) {
  const slug = slugify(p);
  const canonical = BASE + "/san-pham/" + encodeURIComponent(slug) + ".html";
  const title = clean(p.name) + " | Cửa hàng Mẹ & Bé · BS Hùng";
  const desc = clean(p.description || ("Thông tin " + p.name + ", xuất xứ, thành phần và giá tham khảo tại Cửa hàng Mẹ & Bé của Phòng khám BS Hùng.")).slice(0, 200);
  const image = /^https:\/\//i.test(String(p.image_url || "")) ? String(p.image_url).trim() : LOGO;
  const category = clean(p.category || "Sản phẩm mẹ và bé");
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: clean(p.name),
    description: desc,
    image: [image],
    url: canonical,
    category,
    brand: { "@type": "Brand", name: "Cửa hàng Mẹ & Bé · BS Hùng" },
    offers: {
      "@type": "Offer",
      url: canonical,
      priceCurrency: "VND",
      price: Number(p.price_vnd) > 0 ? String(Number(p.price_vnd)) : undefined,
      availability: "https://schema.org/InStock"
    }
  };
  const html = `<!doctype html>
<html lang="vi"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#b94d72">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${esc(canonical)}">
<link rel="icon" type="image/jpeg" href="${esc(LOGO)}">
<link rel="preconnect" href="${esc(url)}" crossorigin><link rel="stylesheet" href="/san-pham-me-va-be/style.css?v=20261015-performance-pass">
<meta property="og:type" content="product"><meta property="og:site_name" content="CỬA HÀNG MẸ &amp; BÉ · BS HÙNG"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:image" content="${esc(image)}"><meta property="og:image:secure_url" content="${esc(image)}"><meta property="og:image:alt" content="${esc(clean(p.name))}"><meta property="og:image:type" content="${image.toLowerCase().includes(".png") ? "image/png" : image.toLowerCase().includes(".webp") ? "image/webp" : "image/jpeg"}"><meta property="product:price:amount" content="${Number(p.price_vnd) > 0 ? esc(String(Number(p.price_vnd))) : ""}"><meta property="product:price:currency" content="VND">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(image)}">
<script type="application/ld+json">${jsonHtml(schema)}</script>
</head><body><header class="header"><a class="brand" href="/san-pham-me-va-be/"><img class="clinic-logo-small" src="${esc(LOGO)}" alt="Logo Phòng khám BS Hùng" width="54" height="54"><span><b>CỬA HÀNG MẸ &amp; BÉ</b><small>Phòng khám chuyên khoa phụ sản BS Hùng</small></span></a><a class="detail-back-top" href="/san-pham-me-va-be/">Quay lại cửa hàng</a></header>
<main class="wrap detail-wrap"><div id="detail"><article class="detail-page"><div class="detail-visual">${p.image_url ? '<img src="' + esc(p.image_url) + '" alt="' + esc(clean(p.name)) + '">' : '<img src="' + esc(LOGO) + '" alt="Cửa hàng Mẹ và Bé BS Hùng">'}<b class="price">${Number(p.price_vnd) > 0 ? esc(new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(p.price_vnd))) : "Liên hệ"}</b></div><div class="detail-copy"><small>${esc(category)}${p.subcategory ? " · " + esc(clean(p.subcategory)) : ""}</small><h1>${esc(clean(p.name))}</h1><section class="product-origin-detail"><h2>Xuất xứ</h2><p>${esc(clean(p.origin || "Chưa cập nhật"))}</p></section>${p.description ? '<section><h2>Thông tin sản phẩm</h2><p>' + esc(clean(p.description)) + '</p></section>' : ""}${p.declared_ingredients ? '<section><h2>Thành phần công bố</h2><p>' + esc(clean(p.declared_ingredients)) + '</p></section>' : ""}${p.source_url && /^https:\/\//i.test(p.source_url) ? '<p><a class="source-link" href="' + esc(p.source_url) + '" target="_blank" rel="noopener noreferrer">Xem nguồn công bố ↗</a></p>' : ""}<a class="btn primary detail-back" href="/san-pham-me-va-be/">Quay lại cửa hàng</a></div></article></div></main><footer>Phòng khám chuyên khoa phụ sản BS Hùng · Cửa hàng Mẹ &amp; Bé</footer><script src="/san-pham-me-va-be/config.js"></script><script type="module" src="/san-pham-me-va-be/product.js?v=static-product-meta-20261025"></script></body></html>
`;
  const outputPath = "san-pham/" + slug + ".html";
  try {
    let existing = await fs.readFile(outputPath, "utf8");
    const headEnd = existing.indexOf("</head>");
    if (headEnd < 0) throw new Error("Trang sản phẩm thiếu </head>: " + outputPath);
    let head = existing.slice(0, headEnd);
    const body = existing.slice(headEnd);
    const getMeta = key => {
      const tags = head.match(/<meta\\b[^>]*>/gi) || [];
      const tag = tags.find(t => new RegExp('(?:property|name)=["\\']' + key.replace(/[.*+?^$\\{}()|[\\]\\]/g, "\\\\$&") + '["\\']', "i").test(t));
      return tag?.match(/content=["\\']([^"\\']*)["\\']/i)?.[1] || "";
    };
    const unescape = s => String(s || "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    const oldTitle = unescape(head.match(/<title>([\\s\\S]*?)<\\/title>/i)?.[1] || title);
    const oldDesc = unescape(getMeta("og:description") || getMeta("description") || desc);
    const oldUrl = unescape(getMeta("og:url") || canonical);
    const oldImage = unescape(getMeta("og:image") || getMeta("twitter:image") || image);
    const shareImage = /^https:\\/\\//i.test(oldImage) ? oldImage : image;
    const imageType = /\\.png(?:[?#]|$)/i.test(shareImage) ? "image/png" : /\\.webp(?:[?#]|$)/i.test(shareImage) ? "image/webp" : "image/jpeg";
    const tags = [
      ["property","og:type","product"],["property","og:site_name","CỬA HÀNG MẸ & BÉ · BS HÙNG"],
      ["property","og:title",oldTitle],["property","og:description",oldDesc],["property","og:url",oldUrl],
      ["property","og:image",shareImage],["property","og:image:secure_url",shareImage],["property","og:image:alt",clean(p.name)],["property","og:image:type",imageType],
      ["name","twitter:card","summary_large_image"],["name","twitter:title",oldTitle],["name","twitter:description",oldDesc],["name","twitter:image",shareImage]
    ];
    for (const [attr,key,value] of tags) {
      const tagRe = new RegExp('<meta\\\\b(?=[^>]*' + attr + '=["\\\\']' + key + '["\\\\'])[^>]*>', "i");
      const tag = '<meta ' + attr + '="' + key + '" content="' + esc(value) + '">';
      if (tagRe.test(head)) head = head.replace(tagRe, tag); else head += "\\n" + tag;
    }
    await fs.writeFile(outputPath, head + body, "utf8");
    console.log("Đã chuẩn hóa metadata chia sẻ, giữ nguyên nội dung: " + outputPath);
  } catch (error) {
    if (error?.code === "ENOENT") { await fs.writeFile(outputPath, html, "utf8"); console.log("Đã tạo trang sản phẩm mới: " + outputPath); }
    else throw error;
  }
  urls.push({ url: canonical, modified: p.updated_at || p.created_at || new Date().toISOString() });
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[
  { url: BASE + "/", modified: new Date().toISOString() },
  ...urls
].map(x => "  <url><loc>" + esc(x.url) + "</loc><lastmod>" + esc(new Date(x.modified).toISOString().slice(0, 10)) + "</lastmod></url>").join("\n")}\n</urlset>\n`;
await fs.writeFile("sitemap-products.xml", sitemap, "utf8");
console.log("Đã tạo " + products.length + " trang sản phẩm tĩnh và sitemap-products.xml. Không xóa trang cũ hay sửa dữ liệu Supabase.");
