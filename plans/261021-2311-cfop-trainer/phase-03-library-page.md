---
phase: 3
title: "Trang thư viện công thức"
status: completed
priority: P2
effort: "1d"
dependencies: [2, 4]
---

# Phase 3: Trang thư viện công thức

## Overview
Trang duyệt toàn bộ ca theo bộ và nhóm, mỗi ca có hình SVG, thuật toán và nút xem
phát trên khối 3D.

## Requirements
- Functional:
  - Tab con: Cross, F2L, OLL, PLL, 2-look OLL, 2-look PLL. Tab Cross hiển thị `cross-guide`.
  - Lưới thẻ `AlgCard`: hình `CaseDiagram`, id + tên, thuật toán chính (mono), thuật toán thay thế, ghi chú.
  - Lọc theo nhóm và tìm theo id/tên.
  - Bấm thẻ mở khung xem: một `CubeViewer` dùng `experimentalSetupAlg = invert(alg)`,
    `alg = alg`, `experimentalStickering` theo bộ (`F2L`/`OLL`/`PLL`), có nút phát/tua.
- Non-functional: chỉ một `CubeViewer` sống cùng lúc (không tạo WebGL context cho từng thẻ); dùng được bằng bàn phím; hiển thị tốt ở 360px.

## Architecture
- Dùng lại `CubeViewer` của phase 4 (bọc `TwistyPlayer` qua `React.lazy`).
- Trạng thái bộ/nhóm đang chọn giữ trong hash (`#/thu-vien/oll`).

## Related Code Files
- Create: `src/pages/LibraryPage.tsx`, `src/components/AlgCard.tsx`, `src/components/CaseModal.tsx`
- Modify: `src/App.tsx` (gắn route)
- Reuse: `src/components/CaseDiagram.tsx`, `src/components/CubeViewer.tsx`

## Implementation Steps
1. Dựng `LibraryPage` với tab con + bộ lọc nhóm + ô tìm kiếm.
2. `AlgCard` hiển thị thông tin ca; `CaseModal` chứa `CubeViewer` phát thuật toán.
3. Kiểm phát 3D vài ca mỗi bộ: trạng thái đầu khớp hình SVG, cuối đúng mục tiêu.

## Success Criteria
- [ ] Đủ 6 tab, số thẻ khớp số ca.
- [ ] Mở/đóng modal không rò WebGL context (mở 20 lần liên tiếp không cảnh báo "Too many active WebGL contexts").
- [ ] Lint/build sạch.

## Risk Assessment
- `experimentalStickering` là API thử nghiệm của cubing.js → bọc trong `CubeViewer`, thay đổi chỉ chạm 1 file.
