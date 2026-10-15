# Cổng sản phẩm mẹ và bé BS Hùng

- `index.html`: khách xem sản phẩm, giỏ hàng, gửi đơn.
- `admin.html`: quản trị đơn hàng và danh mục sản phẩm.
- Không có quản lý tồn kho hoặc thanh toán trực tuyến.

## Xuất bản
GitHub repository Settings → Pages → Deploy from a branch → `main` / `/(root)` → Save.
URL dự kiến: https://bslenamhung.github.io/san-pham-me-va-be/

## Supabase
Dùng project hiện có theo phương án đã thống nhất; dữ liệu shop nằm trong các bảng `shop_products` và `shop_orders`. Frontend chỉ chứa publishable key, tuyệt đối không đưa service-role/secret key vào GitHub.
Hàm Edge Function `submit-shop-order` cần hoạt động và cấu hình secret phía máy chủ. Tài khoản quản trị phải đăng nhập Supabase Auth và có user_id trong bảng `admin_users`.

Chưa có sản phẩm ban đầu. Hãy thêm sản phẩm qua trang quản trị sau khi xác nhận đăng nhập. Kiểm tra gửi đơn thử và trạng thái đơn trước khi nhận đơn thật. Email/SMS chưa cấu hình.