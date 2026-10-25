---
phase: 6
title: "UI giải theo chặng + hoàn thiện"
status: completed
priority: P1
effort: "1d"
dependencies: [4, 5]
---

# Phase 6: UI giải theo chặng

## Overview
Nút "Giải theo CFOP" gọi worker, hiển thị lời giải theo chặng và điều khiển khối 3D bước tới/lui.

## Requirements
- Functional:
  - Nút "Giải theo CFOP" (bật khi có scramble), trạng thái "Đang tìm lời giải…", nút huỷ.
  - `StepTimeline`: danh sách chặng Cross / F2L 1–4 / OLL / PLL, mỗi chặng ghi số nước,
    thuật toán, `caseId` (bấm mở ca tương ứng trong thư viện), màu theo chặng.
  - Điều khiển: về đầu, lui 1 nước, phát/dừng, tới 1 nước, nhảy đến đầu chặng; nước hiện tại được tô sáng.
  - Phím tắt: ← → (nước), ↑ ↓ (chặng), Space (phát/dừng).
  - Tổng số nước (HTM, không tính xoay `z2`/`y`) và ghi chú nếu `approximate`.
  - Xoay `y` đầu mỗi bước F2L hiển thị như một nước riêng có nhãn "Xoay khối" để người học không bị lạc hướng.
  - Khi đang ở chặng OLL/PLL, `experimentalStickering` đổi theo chặng để làm nổi phần cần nhìn.
- Non-functional: điều hướng bước không giật (đặt timestamp, không dựng lại player).

## Architecture
- `CubeViewer` nhận `setupAlg = scramble`, `alg = toàn bộ lời giải nối chặng`; map chỉ số nước ↔ timestamp qua `timestampRequest`/indexer của cubing.
- `useSolver()` hook quản lý vòng đời worker, huỷ khi scramble đổi.

## Related Code Files
- Create: `src/components/StepTimeline.tsx`, `src/hooks/useSolver.ts`
- Modify: `src/pages/PracticePage.tsx`, `src/components/CubeViewer.tsx`
- Modify: `README.md` (mục Mã nguồn: các thư mục mới; mục Quyết định kỹ thuật nếu có quyết định mới phát sinh)

## Implementation Steps
1. `useSolver` + nút giải + trạng thái chờ/huỷ.
2. `StepTimeline` + điều khiển + phím tắt.
3. Đồng bộ chỉ số nước ↔ player, đổi stickering theo chặng.
4. Đo kích thước bundle (`npm run build`), xác nhận cubing nằm trong chunk lazy, ghi số liệu vào README.
5. Kiểm tay 5 scramble đầu-cuối trên bản `preview`: bước tới/lui khớp chuỗi, cuối cùng khối solved.

## Success Criteria
- [ ] Đi hết lời giải bằng phím → khối 3D solved; lùi về đầu → khớp trạng thái scramble.
- [ ] Bấm `caseId` mở đúng ca trong thư viện.
- [ ] Chunk khởi tạo (không gồm cubing) được ghi vào README cùng kích thước chunk cubing.
- [ ] `npm run lint`, `npm run build`, `npm test` sạch.

## Risk Assessment
- Ánh xạ nước ↔ timestamp của cubing là API nội bộ → nếu không ổn định, fallback: đặt `alg` = tiền tố lời giải đến nước hiện tại và `jumpToEnd` (đơn giản, mất hoạt ảnh lùi).
