---
title: "BLD bịt mắt: tài liệu Old Pochmann + 3 chế độ luyện"
status: completed
priority: P2
created: 2026-10-23
---

# BLD bịt mắt (Old Pochmann)

## Brainstorm contract
- **Outcome:** trang BLD có tài liệu OP, luyện bảng chữ cái Speffz, luyện memo, thực hành bịt mắt từng lượt đổi chỗ.
- **Constraints:** Old Pochmann; bảng chữ Speffz; cầm WCA (trắng trên, xanh lá trước); tái dùng model khối, scramble WCA, `CubeViewer`.
- **Non-goals:** M2/R2, 3-style, timer/thống kê, lưu tiến độ.
- **Acceptance:** test: lời giải OP (setup + thuật toán + undo, parity) đưa 100 scramble fixture về solved đúng tuyệt đối;
  mọi chữ cái (trừ buffer) có setup hợp lệ; memo khớp số lượt đổi chỗ; lint/build/test sạch.

## Quyết định (đã đo bằng model, không dựa trí nhớ)
- Cạnh: buffer **B** (UR), đích **D** (UL), `T-perm` — đổi UR↔UL và góc UFR↔UBR.
- Góc: buffer **A** (ULB), đích **P** (RDF), `R U' R' U' R U R' F' R U R' U' R' F R` — đổi ULB↔RDF và cạnh UL↔UB.
- Parity (số chữ cạnh lẻ, làm sau cạnh): `Ra-perm + U'` — đổi UFR↔UBR và UL↔UB, đúng phần dư của hai bước trên.
- Setup sinh bằng BFS trên vị trí sticker với nhóm nước không chạm buffer/vùng thuật toán:
  cạnh `L D l d M E`, góc `R D F`. Bảng setup trong tài liệu sinh từ đây nên luôn đúng.
- Cycle break: mảnh chưa xong đầu tiên theo thứ tự chữ cái.

## Files
- `src/bld/speffz.ts`, `op.ts`, `guide.ts`, `bld.test.ts`
- `src/cube/render-svg.ts` (thêm kiểu `net`), `src/components/CubeNet.tsx`
- `src/pages/BldPage.tsx` + css, `src/App.tsx` (trang `#/bld`)
- `README.md` mục Phạm vi + Mã nguồn

## Kết quả (2026-10-23)
- 100/100 scramble fixture + superflip, cạnh lật / góc xoắn tại chỗ (kể cả buffer) đều về solved tuyệt đối.
- Memo chấm bằng mô phỏng: chấp nhận cả memo dùng cycle break khác của app.
- Tab Bịt mắt mặc định ẩn memo/thuật toán, bật bằng "Hiện gợi ý".
- Review: không có lỗi nghiêm trọng; các mục trung bình/nhỏ đã sửa. Lint/build/test sạch (570 test).
