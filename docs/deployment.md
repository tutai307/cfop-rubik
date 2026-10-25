# Deploy

## Nền tảng

GitHub Pages, build bằng GitHub Actions ([.github/workflows/deploy-pages.yml](../.github/workflows/deploy-pages.yml)).

- Repo: https://github.com/tutai307/cfop-rubik
- URL: https://tutai307.github.io/cfop-rubik/

## Cách deploy

Push lên nhánh `main` là workflow tự chạy `npm ci` → `npm run lint` → `npm test` → `npm run build`
rồi phát hành thư mục `dist`. Có thể chạy tay ở tab **Actions → Deploy to GitHub Pages → Run workflow**.

## Cấu hình liên quan

- `base: '/cfop-rubik/'` trong [vite.config.ts](../vite.config.ts) chỉ áp dụng khi build; `npm run dev` vẫn chạy ở `/`.
  Đổi tên repo hoặc dùng tên miền riêng thì phải sửa giá trị này (tên miền riêng → `'/'`).
- Điều hướng dùng hash (`#/...`) nên không cần cấu hình rewrite 404.
- Không có biến môi trường.

## Rollback

Revert commit lỗi rồi push lên `main`, hoặc mở lần chạy workflow cũ ở tab Actions và chọn **Re-run all jobs**.
