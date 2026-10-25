---
phase: 2
title: "Dữ liệu thuật toán, SVG minh hoạ, test xác minh"
status: completed
priority: P1
effort: "2d"
dependencies: [1]
---

# Phase 2: Dữ liệu thuật toán và minh hoạ

## Overview
Nhập 41 F2L, 57 OLL, 21 PLL, 2-look OLL (10), 2-look PLL (6) và nội dung hướng dẫn
Cross; sinh hình SVG từ model khối; test chứng minh từng thuật toán đúng.

## Requirements
- Functional:
  - Mỗi ca: `id` (vd `OLL 21`, `PLL Ua`, `F2L 7`), `name`, `group` (vd "Chữ T", "Góc"),
    `alg` chính, `alternatives?`, `note?` tiếng Việt (mẹo nhận diện/fingertrick ngắn).
  - Trạng thái minh hoạ của ca = `invert(alg)` áp dụng lên khối solved.
  - SVG: kiểu `top` (mặt U + viền 4 mặt bên, dùng cho OLL/PLL/2-look; OLL tô xám mọi
    thứ trừ vàng) và kiểu `iso` (3 mặt U/F/R, dùng cho F2L, tô xám tầng cuối không liên quan).
  - Cross: trang hướng dẫn trực giác (khái niệm, 4 tình huống cạnh cơ bản kèm thuật toán ngắn, mẹo lên kế hoạch ≤8 nước).
- Non-functional: dữ liệu là TS thuần (`as const`), không tải mạng.

## Architecture
- `src/algorithms/types.ts`: `AlgCase { id; set: "F2L"|"OLL"|"PLL"|"OLL2"|"PLL2"; group; name; alg; alternatives?; note? }`.
- Một file dữ liệu mỗi bộ; `index.ts` gom và export.
- `src/cube/render-svg.ts`: hàm thuần trả chuỗi/JSX SVG từ `Facelets` + kiểu hiển thị + mặt nạ tô xám.
- Nhận diện (dùng chung với solver, phase 5): `recognizeOll(state)`, `recognizePll(state)` thử
  4 pre-AUF × mọi ca, trả `{ caseId, preAuf }`.

## Related Code Files
- Create: `src/algorithms/types.ts`, `f2l.ts`, `oll.ts`, `pll.ts`, `two-look.ts`, `cross-guide.ts`, `recognize.ts`, `index.ts`
- Create: `src/algorithms/algorithms.test.ts`
- Create: `src/cube/render-svg.ts`, `src/components/CaseDiagram.tsx`

## Implementation Steps
1. Định nghĩa type, nhập dữ liệu từ bộ thuật toán phổ biến cộng đồng speedsolving
   (thuật toán thông dụng nhất mỗi ca + 1–2 thay thế), ghi nguồn tham khảo trong comment đầu file.
   <!-- Updated: Validation Session 1 - xác nhận nguồn speedsolving phổ biến -->
   F2L lưu ở góc nhìn khe FR, khớp với lời giải solver (phase 5 xoay `y` về FR).
2. Viết test xác minh, chạy trước khi làm UI:
   - **Cú pháp**: mọi `alg`/`alternatives` parse được.
   - **OLL**: setup giữ F2L + cross; sau `alg` mặt U toàn vàng; 57 setup phân biệt
     đôi một modulo AUF (so dạng chuẩn hoá theo 4 phép xoay `y`); không ca nào đã định hướng sẵn.
   - **PLL**: setup có U toàn vàng + F2L xong; sau `alg` (+ AUF) solved; 21 ca phân biệt modulo AUF trước/sau.
   - **F2L**: setup giữ cross + 3 slot còn lại, slot FR chưa xong; sau `alg` slot FR xong,
     cross và 3 slot khác nguyên; 41 ca phân biệt.
   - **2-look**: OLL2 — 3 ca cạnh cho chữ thập vàng + 7 ca góc (OCLL) cho mặt vàng;
     PLL2 — 2 ca góc + 4 ca cạnh, mỗi ca đạt đúng mục tiêu bước của nó.
   - **Alternatives**: mỗi thuật toán thay thế cho cùng kết quả với `alg` chính.
   - **Phủ đủ**: liệt kê mọi trạng thái định hướng LL hợp lệ (đạt được) → mỗi trạng thái nhận diện được đúng 1 ca OLL; tương tự hoán vị LL cho PLL.
3. Viết `render-svg.ts` + `CaseDiagram`; kiểm tay vài ca nổi tiếng (OLL 27 Sune, PLL T, F2L 1) so với hình chuẩn.
4. Viết nội dung `cross-guide.ts` tiếng Việt.

## Success Criteria
- [ ] Toàn bộ test ở bước 2 xanh.
- [ ] Đếm: F2L 41, OLL 57, PLL 21, OLL2 10, PLL2 6.
- [ ] SVG của Sune / T-perm / F2L 1 khớp hình tham khảo khi xem bằng mắt.

## Risk Assessment
- Thuật toán sai hoặc trùng ca → test phân biệt + phủ đủ thất bại, chỉ rõ id.
- Quy ước góc nhìn (ca hiển thị lệch AUF so với tài liệu phổ biến) → chấp nhận được vì
  hình sinh từ chính thuật toán; ghi chú ở `note` nếu cần.

## Lưu ý từ phase 1
- `stateOf(alg)` tính trong hướng WCA (trắng trên). Trạng thái minh hoạ thư viện phải ở hướng giải
  (vàng trên, trắng đáy): dùng `z2` trước `invert(alg)`, nếu không SVG OLL/PLL sẽ hiện mặt trắng ở trên.
  Các hàm kiểm so với tâm nên vẫn đúng, chỉ màu hình bị sai — test phase 2 nên kiểm màu tâm U là vàng.
- Dữ liệu thuật toán chỉ dùng ký hiệu parser hỗ trợ (xem ghi chú hoàn thành phase 1).
