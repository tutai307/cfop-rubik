---
title: "Web học và luyện CFOP: thư viện công thức, scramble WCA, giải theo chặng, khối 3D"
description: "Xây toàn bộ phạm vi đã chốt trong README mục Phạm vi trên scaffold Vite + React + TS"
status: completed
priority: P1
effort: 9d
branch: master
tags: [cfop, solver, cubing.js, react, three-d]
blockedBy: []
blocks: []
created: 2026-10-21
---

# Web học và luyện CFOP

## Overview

Repo hiện là scaffold Vite + React 19 + TS trống. Plan này xây đủ 4 tính năng
đã chốt ở [README.md mục Phạm vi](../../README.md#phạm-vi):

1. Thư viện công thức (Cross hướng dẫn, 41 F2L, 57 OLL, 21 PLL, 2-look OLL/PLL) có hình SVG.
2. Scramble random-state chuẩn WCA (`cubing/scramble`).
3. Solver CFOP chia chặng: Cross IDA* tối ưu, F2L IDA* (xoay `y` về khe FR, nhóm `U R F L`) thử 24 thứ tự cặp trong Web Worker, OLL/PLL tra bảng + AUF.
4. Khối 3D `TwistyPlayer` ở giữa màn luyện tập, bước tới/lui theo chặng.

Brainstorm đã chốt; không mở rộng phạm vi trong plan này.

## Quyết định nền (đã chốt, không bàn lại)

- `cubing@0.66.1` (MPL-2.0 OR GPL-3.0+) cho 3D + scramble. Đã kiểm tra typings:
  `randomScrambleForEvent(eventID): Promise<Alg>`; `TwistyPlayer` có `alg`,
  `experimentalSetupAlg`, `experimentalSetupAnchor`, `experimentalStickering`
  (có `Cross`, `F2L`, `OLL`, `PLL`), `visualization` (`3D`, `2D`,
  `experimental-2D-LL`), `jumpToStart/jumpToEnd/play/pause`, `timestampRequest`.
  cubing.js tự tạo worker bằng `new URL(..., import.meta.url)` → cần cấu hình Vite (phase 1).
- Model khối facelet tự viết (`src/cube/`) là nguồn sự thật cho solver, test, SVG.
- Hướng giải cố định: trắng đáy, xanh lá trước. Scramble WCA tính theo trắng trên,
  xanh lá trước → solver bắt đầu bằng `z2` (giữ xanh lá ở trước).
- Vitest cho test. Không thêm router: điều hướng bằng hash (`#/thu-vien`, `#/luyen-tap`).

## Phases

| Phase | Name | Status | Effort | Depends |
|-------|------|--------|--------|---------|
| 1 | [Nền tảng: deps, model khối, Singmaster](./phase-01-foundation-cube-model.md) | Completed | 1d | — |
| 2 | [Dữ liệu thuật toán, SVG minh hoạ, test xác minh](./phase-02-algorithm-data-and-diagrams.md) | Completed | 2d | 1 |
| 3 | [Trang thư viện công thức](./phase-03-library-page.md) | Completed | 1d | 2, 4 |
| 4 | [Màn luyện tập: khối 3D + scramble WCA](./phase-04-practice-3d-scramble.md) | Completed | 1d | 1 |
| 5 | [Solver CFOP](./phase-05-cfop-solver.md) | Completed | 3d | 1, 2 |
| 6 | [UI giải theo chặng + hoàn thiện](./phase-06-step-solution-ui.md) | Completed | 1d | 4, 5 |

Thứ tự làm: 1 → 2 → 4 → 3 → 5 → 6. Phase 3 dùng `CubeViewer` của phase 4;
phase 5 cần dữ liệu và `recognize.ts` của phase 2.

## Kiến trúc tổng thể

```
src/
  cube/        model facelet, parser Singmaster, moves, render SVG   (thuần TS, có test)
  algorithms/  dữ liệu F2L/OLL/PLL/2-look + nhận diện ca              (thuần TS, có test)
  solver/      cross.ts, f2l.ts, last-layer.ts, solve.ts, solver.worker.ts
  components/  CubeViewer (lazy TwistyPlayer), CaseDiagram, AlgCard, StepTimeline
  pages/       LibraryPage, PracticePage
  App.tsx      layout + điều hướng hash
```

Luồng luyện tập: `randomScrambleForEvent("333")` → hiển thị scramble trên 3D →
bấm "Giải theo CFOP" → worker chạy `solve(scramble)` → trả `SolveStep[]`
(`stage`, `label`, `moves`, `caseId?`) → timeline bước tới/lui điều khiển `TwistyPlayer`.

## Acceptance (toàn plan)

- [ ] `npm run lint`, `npm run build`, `npm test` sạch.
- [ ] Test: mọi thuật toán thư viện giải đúng ca; 57 OLL / 21 PLL / 41 F2L là các ca phân biệt và phủ đủ.
- [ ] Test: solver giải 100 scramble random-state, 100% về solved, mỗi chặng đạt điều kiện của nó.
- [ ] Scramble đến từ `randomScrambleForEvent("333")`.
- [ ] 3D phát đúng scramble và lời giải; bước tới/lui theo chặng hoạt động.
- [ ] F2L solve trong worker: p95 ≤ 5 giây trên máy dev (đo và ghi lại ở phase 5).

## Rủi ro chính

| Rủi ro | Giảm thiểu |
|---|---|
| Gõ sai trong 135 thuật toán | Test tính phân biệt + phủ đủ ca (phase 2) bắt cả sai ca lẫn sai cú pháp |
| F2L 24 thứ tự quá chậm | Bảng pruning, giới hạn độ sâu, ngân sách thời gian, fallback tham lam (phase 5) |
| cubing.js worker lỗi với Vite | Cấu hình `worker.format: "es"`, `optimizeDeps.exclude: ["cubing"]`, kiểm ở phase 1 bằng build thật |
| Bundle cubing lớn (~2 MB unpacked) | `React.lazy` cho CubeViewer, import động `cubing/scramble`; đo kích thước chunk ở phase 6 |

## Open questions

None.

## Validation Log

### Session 1 — 2026-10-21
**Trigger:** `/ak:plan validate` sau khi tạo plan.
**Questions asked:** 3

#### Verification Results
- Claims checked: 18
- Verified: 18 | Failed: 0 | Unverified: 0
- Tier: Full (6 phases)
- Đã xác minh: engines `vitest@5.0.5` (`^22.12.0`) và `cubing@0.66.1` (`>=22.3.0`) thoả Node v22.13.1;
  typings cubing có `cube3x3x3.kpuzzle()`, `KPattern.applyAlg`, `randomScrambleForEvent`,
  `timestampRequest`, `indexer.indexToMoveStartTimestamp`, stickering `Cross/F2L/OLL/PLL`;
  `src/assets/{hero.png,react.svg,vite.svg}` và các mục README Phạm vi/Bắt đầu/Mã nguồn tồn tại;
  số trạng thái 190 080 (cross), 576 (cặp), 2-look 10 + 6 đúng.
- Failures: none.

#### Questions & Answers

1. **[Tradeoffs]** Solver F2L nên tìm lời giải kiểu nào?
   - Options: Xoay y + <U R F L> | Đủ 18 nước, không xoay
   - **Answer:** Xoay y + <U R F L>
   - **Rationale:** 18 nước cho lời giải đầy B/D, khó học; xoay về FR khớp góc nhìn thư viện.
2. **[Assumptions]** Thời gian chờ lời giải chấp nhận được?
   - Options: p95 ≤ 5 giây | ≤ 1 giây
   - **Answer:** p95 ≤ 5 giây
   - **Rationale:** Giữ tìm kiếm đủ 24 thứ tự cặp.
3. **[Assumptions]** Dùng bộ thuật toán nguồn nào cho thư viện?
   - Options: Bộ phổ biến speedsolving | Theo J Perm
   - **Answer:** Bộ phổ biến speedsolving
   - **Rationale:** Thuật toán thông dụng nhất mỗi ca kèm 1–2 thay thế.

#### Confirmed Decisions
- F2L: xoay `y` đưa khe về FR, IDA* trong `<U, R, F, L>` — dễ làm theo, chấp nhận dài hơn 0–2 nước.
- Ngân sách: p95 ≤ 5 giây, fallback tham lam sau 4 giây — giữ nguyên.
- Nguồn thuật toán: bộ phổ biến speedsolving — giữ nguyên.
- Scramble cho test: fixture 100 scramble commit vào repo (mặc định, không hỏi) — tránh phụ thuộc worker cubing trong Node.

#### Impact on Phases
- Phase 1: ghim `vitest@5.0.5`, gỡ rủi ro Node.
- Phase 2: F2L lưu ở góc nhìn khe FR; xác nhận nguồn thuật toán.
- Phase 5: nhóm nước `U R F L` + xoay `y`, một bảng cặp FR qua liên hợp, bảng cross riêng cho F2L, fixture scramble.
- Phase 6: hiển thị xoay `y` như bước "Xoay khối"; số nước không tính xoay.

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01 … phase-06
- Decision deltas checked: 4 (nhóm nước F2L, góc nhìn FR, fixture scramble, gỡ rủi ro Node)
- Reconciled stale references: 3 (plan.md Overview mục 3, bảng rủi ro Node, phase-01 rủi ro Vitest)
- Unresolved contradictions: 0
