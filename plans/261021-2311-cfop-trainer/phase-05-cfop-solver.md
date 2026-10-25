---
phase: 5
title: "Solver CFOP"
status: completed
priority: P1
effort: "3d"
dependencies: [1, 2]
---

# Phase 5: Solver CFOP

## Overview
Từ một scramble, sinh lời giải chia chặng Cross → F2L (4 cặp) → OLL → PLL, chạy trong Web Worker.

## Requirements
- Functional:
  - Đầu vào: chuỗi scramble (WCA: trắng trên, xanh lá trước). Bước đầu tiên của lời giải là `z2`.
  - Cross: lời giải cross trắng **ngắn nhất** (HTM) bằng IDA*.
  - F2L: giải 4 cặp, mỗi cặp bằng IDA*; thử mọi thứ tự cặp (cây 4 → 3 → 2 → 1, tối đa 64 lần tìm cặp), lấy tổng HTM nhỏ nhất.
    <!-- Updated: Validation Session 1 - F2L xoay y về khe FR, nhóm nước U R F L -->
    Trước mỗi cặp, xoay `y`/`y'`/`y2` (0 HTM, hiện rõ trong lời giải) để khe đích nằm ở FR,
    rồi chỉ tìm với nhóm nước `U R F L` (mỗi mặt 3 biến thể = 12 nước). Lời giải dễ làm theo
    và cùng góc nhìn với thư viện F2L (mọi ca ở khe FR); chấp nhận dài hơn 0–2 nước so với 18 nước.
  - OLL/PLL: nhận diện ca bằng `recognize.ts` (phase 2), xuất `preAuf + alg`; PLL thêm AUF cuối.
  - Kết quả: `SolveStep[] = { stage: "Cross"|"F2L"|"OLL"|"PLL"|"Xoay"; label; moves: string; caseId?; moveCount }`.
    Nhãn F2L ghi khe (FR/FL/BR/BL); nếu trạng thái cặp trước khi giải khớp 1 trong 41 ca thì gắn `caseId`, không thì ghi "cặp không ở dạng chuẩn".
  - Có thể huỷ (người dùng tạo scramble mới khi đang giải).
- Non-functional: p95 toàn bộ solve ≤ 5 giây trong worker trên máy dev; UI không bị chặn.

## Architecture
- Biểu diễn cubie cho tìm kiếm (nhanh hơn facelet): cạnh = (vị trí, hướng), góc = (vị trí, hướng).
- **Cross**: bảng pruning BFS cho 4 cạnh trắng (24·22·20·18 = 190 080 trạng thái, ~190 KB),
  dựng một lần khi worker khởi động; IDA* 18 nước, cắt nhánh cùng mặt / mặt đối song song theo thứ tự.
- **F2L một cặp**: trạng thái đã xoay `y` sao cho khe đích là FR; nhóm nước `U R F L`.
  Heuristic = max(khoảng cách cross từ bảng cross dựng cho nhóm `U R F L`, khoảng cách
  (góc+cạnh của cặp FR) từ bảng 24×24 = 576, khoảng cách của từng cặp đã xong tra từ cùng
  bảng 576 sau khi liên hợp bằng `y`). Mỗi heuristic đều admissible với nhóm nước này → lời giải
  tối ưu cho cặp trong `<U, R, F, L>` với ràng buộc giữ cross + cặp đã xong. Giới hạn độ sâu 14.
  Chỉ cần một bảng cặp (cho FR) nhờ liên hợp `y`; bảng cross cho F2L dựng riêng vì nhóm nước khác Cross.
- **Thứ tự cặp**: DFS trên cây thứ tự, cắt nhánh khi tổng hiện tại ≥ tốt nhất; ghi nhớ kết quả theo (tập cặp đã xong, trạng thái) nếu lặp.
- **Ngân sách thời gian**: nếu vượt 4 giây, trả kết quả tốt nhất đã có (ít nhất là đường tham lam chạy trước tiên) và đánh dấu `approximate: true` để UI ghi chú.
- `solve.ts` thuần (test được ở Node), `solver.worker.ts` chỉ là lớp vỏ `postMessage`.

## Related Code Files
- Create: `src/solver/cubie.ts`, `pruning.ts`, `cross.ts`, `f2l.ts`, `last-layer.ts`, `solve.ts`, `solver.worker.ts`, `types.ts`
- Create: `src/solver/solver.test.ts`, `src/solver/fixtures/scrambles-100.json`, `scripts/bench-solver.ts` (đo thời gian, chạy bằng `npx vite-node` hoặc vitest bench)

## Implementation Steps
1. `cubie.ts`: chuyển facelet ↔ cubie, bảng nước cho cubie; test khớp với model facelet.
2. Cross: bảng pruning + IDA*; test cross tối ưu bằng so với BFS vét cạn trên 20 scramble (độ dài bằng nhau).
3. F2L một cặp: xoay `y` đưa khe về FR, IDA* trong `<U, R, F, L>` với heuristic kết hợp;
   test giữ cross + cặp đã xong, lời giải chỉ chứa `U R F L` (và `y` giữa các cặp).
4. Tìm theo thứ tự cặp + ngân sách thời gian + fallback tham lam.
5. OLL/PLL qua `recognize.ts`; PLL thêm AUF cuối.
6. Ghép `solve()`, rút gọn nước nối giữa chặng (vd `U` cuối F2L + `U'` pre-AUF OLL) nhưng giữ ranh giới chặng.
7. Worker + API huỷ.
8. Test 100 scramble từ fixture `src/solver/fixtures/scrambles-100.json` (sinh một lần bằng
   `randomScrambleForEvent("333")`, commit vào repo để test lặp lại được và không phụ thuộc worker của cubing trong Node):
   sau mỗi chặng kiểm điều kiện (cross xong → +1..4 slot → U vàng → solved), cuối cùng solved.
9. Bench 100 scramble, ghi p50/p95 thời gian và trung bình số nước mỗi chặng vào phần ghi chú của phase này.

## Success Criteria
- [ ] 100/100 scramble giải đúng; mỗi chặng đạt điều kiện.
- [ ] Mọi bước F2L chỉ gồm `y`-xoay đầu bước + các nước `U R F L`.
- [ ] Cross khớp độ dài tối ưu vét cạn trên 20 scramble.
- [ ] p95 ≤ 5 giây (nếu không đạt: báo số liệu thật, bật fallback và báo người dùng trước khi tiếp tục).
- [ ] Lint/build/test sạch.

## Risk Assessment
- F2L chậm ở cặp khó (cặp kẹt trong khe sai): heuristic yếu → thêm bảng pruning (cross + 1 cặp) nếu bench cho thấy cần; chỉ làm khi số liệu chứng minh.
- Nhận diện OLL/PLL trượt ca → test phủ đủ ở phase 2 đã bảo đảm.

## Ghi chú hoàn thành (2026-10-23)
- 100/100 scramble fixture giải đúng, mỗi chặng đạt điều kiện; cross khớp độ dài tối ưu
  (đối chiếu tìm vét cạn cho lời giải ≤ 6 nước).
- Bench (Node): p50 ≈ 30–55 ms, p95 ≈ 80–140 ms, max ≈ 300 ms — chưa cần bảng pruning bổ sung hay fallback.
- Trung bình HTM: Cross 5.7, F2L 5.3/cặp, OLL 10.8, PLL 14.6.
