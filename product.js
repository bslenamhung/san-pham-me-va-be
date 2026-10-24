import {createClient} from "https://esm.sh/@supabase/supabase-js@2.57.0";
const db=createClient(window.SHOP_CONFIG.SUPABASE_URL,window.SHOP_CONFIG.SUPABASE_PUBLISHABLE_KEY);
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const slugify=s=>String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/Đ/g,"d").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const money=n=>new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND",maximumFractionDigits:0}).format(n||0);
async function load(){
const id=new URLSearchParams(location.search).get("id"),match=location.pathname.match(/\/san-pham\/([^/]+)\.html$/),slug=match?decodeURIComponent(match[1]):"";
const {data:all,error}=await db.from("shop_products").select("id,name,slug,description,category,subcategory,origin,price_vnd,image_url,declared_ingredients,source_url").eq("is_active",true);
const p=error||!all?null:(id?all.find(x=>x.id===id):slug?all.find(x=>slugify(x.slug||x.name)===slug):null);
if(error||!p){$("#detail").innerHTML="<p>Không tìm thấy sản phẩm hoặc sản phẩm đã ngừng hiển thị. <a href='/san-pham-me-va-be/'>Quay lại cửa hàng</a></p>";return}
document.title=p.name+" · Sản phẩm mẹ và bé";
const origin='<section class="product-origin-detail"><h2>Xuất xứ</h2><p>'+esc(p.origin||"Chưa cập nhật")+'</p></section>';
$("#detail").innerHTML='<article class="detail-page"><div class="detail-visual">'+(p.image_url?'<img src="'+esc(p.image_url)+'" alt="'+esc(p.name)+'">':'♡')+'<b class="price">'+money(p.price_vnd)+'</b></div><div class="detail-copy"><small>'+esc(p.category==="Hỗ trợ sinh sản"?"Hỗ trợ sinh sản-làm đẹp":p.category||"Sản phẩm")+(p.subcategory?" · "+esc(p.subcategory):"")+'</small><h1>'+esc(p.name)+'</h1>'+origin+(p.description?'<section><h2>Thông tin sản phẩm</h2><p>'+esc(p.description)+'</p></section>':'')+(p.declared_ingredients?'<section><h2>Thành phần công bố</h2><p>'+esc(p.declared_ingredients)+'</p></section>':'')+(p.source_url?'<p><a class="source-link" href="'+esc(p.source_url)+'" target="_blank" rel="noopener noreferrer">Xem nguồn công bố ↗</a></p>':'')+'<a class="btn primary detail-back" href="./">Quay lại cửa hàng</a></div></article>';
const related=all.filter(x=>x.id!==p.id&&x.category===p.category&&(!p.subcategory||x.subcategory===p.subcategory)).slice(0,6);
if(related.length){
const cards=related.map(x=>'<article class="product"><div class="product-visual"><div class="photo">'+(x.image_url?'<img src="'+esc(x.image_url)+'" alt="'+esc(x.name)+'" loading="lazy">':'♡')+'</div><b class="price">'+money(x.price_vnd)+'</b></div><div class="pbody"><h3>'+esc(x.name)+'</h3><a class="product-detail-link" href="./product.html?id='+encodeURIComponent(x.id)+'">Xem chi tiết</a></div></article>').join("");
$("#detail").insertAdjacentHTML("beforeend",'<section class="related-section"><h2>Sản phẩm cùng loại</h2><p>Các sản phẩm thuộc cùng danh mục'+(p.subcategory?' phụ '+esc(p.subcategory):'')+'.</p><div class="grid">'+cards+'</div></section>');
}
}
load().catch(err=>{console.error('Product detail loading failed',err);const el=document.querySelector('#detail');if(el)el.innerHTML='<p>Chưa tải được thông tin sản phẩm. Vui lòng tải lại trang hoặc quay lại cửa hàng.</p>';});