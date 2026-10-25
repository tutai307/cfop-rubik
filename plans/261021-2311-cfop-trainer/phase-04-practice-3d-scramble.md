---
phase: 4
title: "Màn luyện tập: khối 3D + scramble WCA"
status: completed
priority: P1
effort: "1d"
dependencies: [1]
---

# Phase 4: Màn luyện tập

## Overview
Khối 3D ở giữa màn hình, nút tạo scramble random-state WCA, khối hiển thị trạng thái sau scramble.

## Requirements
- Functional:
  - `CubeViewer`: bọc `TwistyPlayer` (puzzle `3x3x3`, visualization `3D`, xoay quan sát bằng kéo chuột/chạm, ẩn control panel mặc định của cubing để dùng control riêng).
  - Nút "Tạo scramble" gọi `randomScrambleForEvent("333")` (import động), hiển thị chuỗi bằng font mono, có nút sao chép.
  - Nút "Phát scramble" chạy hoạt ảnh scramble từ solved; mặc định nhảy tới trạng thái cuối.
  - Ô nhập scramble tay (parse bằng model phase 1, báo lỗi tiếng Việt) — chỉ để dán lại scramble, không phải nhập trạng thái tô màu.
  - Trạng thái chờ khi đang sinh scramble (lần đầu cubing khởi tạo worker có thể mất 1–2 giây).
- Non-functional: khối chiếm vùng trung tâm, co giãn theo màn hình; trang không cuộn ngang ở 360px.

## Architecture
- `CubeViewer` nhận props `setupAlg`, `alg`, `stickering?`, `controller` (ref có `jumpToStart/End`, `play`, `pause`, đặt timestamp) để phase 6 điều khiển theo bước.
- `PracticePage` giữ state `scramble: string | null`.

## Related Code Files
- Create: `src/components/CubeViewer.tsx`, `src/pages/PracticePage.tsx`, `src/lib/scramble.ts`
- Modify: `src/App.tsx`

## Implementation Steps
1. `CubeViewer` với `React.lazy` + import động `cubing/twisty`; dọn `TwistyPlayer` khi unmount.
2. `scramble.ts`: wrapper `generateScramble(): Promise<string>` quanh `randomScrambleForEvent("333")`.
3. `PracticePage`: layout 3 vùng (trái: scramble; giữa: khối; phải: chỗ trống cho lời giải phase 6).
4. Kiểm bằng `npm run build && npm run preview` (worker cubing phải chạy ở bản build, không chỉ dev).

## Success Criteria
- [ ] Bản `preview` sinh được scramble; chuỗi dài 17–22 nước, không có nước liền kề cùng mặt.
- [ ] Trạng thái 3D sau scramble khớp model phase 1 (so `applyAlg` với 2D net của cubing ở 3 scramble).
- [ ] Lint/build sạch.

## Risk Assessment
- Worker của cubing lỗi khi build → cấu hình phase 1; nếu vẫn lỗi, ghi cách khắc phục vào README mục Quyết định kỹ thuật.
