---
phase: 1
title: "Nền tảng: deps, model khối, Singmaster"
status: completed
priority: P1
effort: "1d"
dependencies: []
---

# Phase 1: Nền tảng

## Overview
Cài deps, cấu hình Vite/Vitest cho cubing.js, dọn scaffold, và viết model khối
facelet + parser Singmaster đủ dùng cho mọi phase sau.

## Requirements
- Functional:
  - Model 54 facelet, áp dụng chuỗi Singmaster gồm: `U D L R F B` (`'`, `2`),
    wide `u d l r f b` và `Uw…`, slice `M E S`, xoay khối `x y z`.
  - Đảo chuỗi (`invert`), rút gọn nước liền kề cùng mặt (`simplify`), đếm nước HTM.
  - Kiểm trạng thái: solved, cross trắng xong, slot F2L xong, mặt U cùng màu.
- Non-functional: thuần TS, không phụ thuộc DOM; áp dụng 1 nước ≤ vài µs (dùng bảng hoán vị Int8Array).

## Architecture
- `Facelets = Uint8Array(54)`, thứ tự mặt U R F D L B (chuẩn Kociemba), giá trị = màu 0..5.
- Mỗi nước cơ bản là một hoán vị 54 phần tử, sinh một lần lúc load từ định nghĩa
  chu trình; nước còn lại ghép từ hoán vị cơ bản (`R2 = R∘R`, `r = R M'`, `x = R M' L'`).
- Parser: tokenize theo regex, ném lỗi có vị trí token khi gặp ký hiệu lạ.

## Related Code Files
- Create: `src/cube/facelets.ts`, `src/cube/moves.ts`, `src/cube/notation.ts`, `src/cube/checks.ts`, `src/cube/index.ts`
- Create: `src/cube/cube.test.ts`
- Modify: `package.json` (deps `cubing@0.66.1`; devDeps `vitest`; script `test`), `vite.config.ts`
- Modify: `src/App.tsx`, `src/App.css`, `src/index.css` (bỏ demo scaffold, khung layout + điều hướng hash)
- Delete: `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg` nếu không còn dùng
- Modify: `README.md` mục Bắt đầu (thêm `npm test`) và mục Mã nguồn

## Implementation Steps
1. `npm install cubing@0.66.1` và `npm install -D vitest@5.0.5` (engines đã xác minh: Node v22.13.1 thoả `cubing >=22.3.0` và `vitest ^22.12.0`).
2. `vite.config.ts`: `worker: { format: "es" }`, `optimizeDeps: { exclude: ["cubing"] }`, khối `test` của Vitest (environment `node`).
3. Viết hoán vị 6 mặt bằng chu trình facelet, suy ra mọi nước khác; viết parser + `applyAlg(state, alg)`.
4. Viết `invert`, `simplify`, `countMoves`, các hàm kiểm trong `checks.ts`.
5. Test: `R4 = id`, `(R U R' U')×6 = id`, `alg + invert(alg) = id`, `x = R M' L'`, sexy move đếm 4 nước, parser báo lỗi đúng vị trí.
6. Đối chiếu chéo với `cubing/kpuzzle`: 20 chuỗi ngẫu nhiên áp dụng bằng cả hai cho cùng kết quả (bắt sai quy ước chiều quay).
7. Dọn `App.tsx` thành layout 2 tab tiếng Việt: "Thư viện công thức", "Luyện tập".

## Success Criteria
- [x] `npm test` chạy và xanh; `npm run lint`, `npm run build` sạch.
- [x] Model khớp cubing/kpuzzle trên 20 chuỗi ngẫu nhiên.
- [x] App chạy `npm run dev`, hiển thị 2 tab rỗng.

## Risk Assessment
- Sai quy ước chiều `M E S` / `x y z` → bước 6 bắt sớm.
- Engines đã xác minh tương thích Node v22.13.1; không cần nâng Node.

## Ghi chú hoàn thành (2026-10-21)
- 49 test xanh; model khớp `cubing/kpuzzle` trên cả 18 họ nước và 20 chuỗi ngẫu nhiên 30 nước.
- Build thật với `import('cubing/scramble')` sinh chunk `search-worker-entry` → cấu hình worker ổn ở mức build; chạy worker trong trình duyệt kiểm ở phase 4 (`preview`).
- Parser chấp nhận: `R R2 R' R2'`, `r`/`Rw`, `M E S`, `x y z`, prime `'` `’` `′`, nhóm `( )n` và `( )'` (lặp ≤ 99).
  Không hỗ trợ `[ , ]` (commutator) và dấu `.` → dữ liệu phase 2 không dùng các ký hiệu này.
