# cfop-rubik

Web app hỗ trợ học và luyện giải Rubik 3x3 theo phương pháp **CFOP**.

## Thuật ngữ

CFOP gồm 4 bước, ứng dụng dùng đúng các tên này trong code và giao diện:

| Bước | Tên đầy đủ | Ý nghĩa |
|---|---|---|
| Cross | Cross | Ghép dấu cộng ở mặt đáy |
| F2L | First Two Layers | Ghép đồng thời góc + cạnh để hoàn thành 2 tầng đầu |
| OLL | Orientation of the Last Layer | Định hướng tầng cuối (mặt trên cùng màu) |
| PLL | Permutation of the Last Layer | Hoán vị tầng cuối để hoàn thành khối |

Thuật toán ghi theo **ký hiệu Singmaster** (`R U R' U'`, ...).

## Quyết định kỹ thuật

- **Vite + React + TypeScript**: chọn thay vì HTML/JS thuần vì dự án dự kiến có
  nhiều màn hình tương tác (bảng thuật toán, timer, mô phỏng khối), cần
  component và kiểu dữ liệu chặt chẽ cho thuật toán/trạng thái khối.
- **Oxlint** thay ESLint: đi kèm template, nhanh, cấu hình tại [.oxlintrc.json](.oxlintrc.json).
- Nội dung hiển thị cho người dùng viết bằng **tiếng Việt**.

## Phạm vi

Đã chốt (2026-10-21). Tính năng mới ngoài danh sách này phải được chốt và ghi
vào đây trước khi làm.

1. **Thư viện công thức**: hướng dẫn Cross trực giác, 41 F2L, 57 OLL, 21 PLL,
   kèm bộ 2-look OLL (10) và 2-look PLL (6) cho người mới. Mỗi ca có hình SVG
   minh hoạ sinh từ model khối, thuật toán Singmaster và phát trên khối 3D.
   Mọi thuật toán được test tự động: áp dụng lên ca của nó phải giải đúng.
2. **Scramble chuẩn WCA**: random-state 3x3 qua `cubing.js`
   (`randomScrambleForEvent("333")`), không dùng random-move.
3. **Giải theo CFOP**: lời giải chia chặng Cross → F2L (4 cặp) → OLL → PLL,
   bước tới/lui từng nước, ghi rõ ca tương ứng trong thư viện.
   - Hướng cố định: cross **trắng ở đáy, xanh lá ở trước**.
   - Cross: tìm kiếm IDA*, ngắn nhất thật sự.
   - F2L: IDA* từng cặp, thử cả 24 thứ tự cặp, lấy tổng ngắn nhất; chạy trong
     Web Worker để không chặn UI. Trước mỗi cặp xoay `y` đưa khe về FR và chỉ
     dùng `U R F L`, để lời giải dễ làm theo và cùng góc nhìn với thư viện
     (chấp nhận dài hơn vài nước so với dùng đủ 18 nước). Mục tiêu p95 ≤ 5 giây.
   - OLL/PLL: nhận diện ca và tra thư viện (kèm AUF).
   - "Tối ưu" nghĩa là tối ưu trong khuôn khổ CFOP, không phải lời giải ngắn
     nhất tuyệt đối (Kociemba bị loại vì không chia bước CFOP).
4. **Khối 3D** ở giữa màn luyện tập: `TwistyPlayer` của `cubing.js`
   (lazy-load vì bundle lớn), xoay quan sát được, có hoạt ảnh theo từng nước.
5. **BLD bịt mắt** (chốt 2026-10-23): phương pháp **Old Pochmann**, bảng chữ
   cái **Speffz**, cầm trắng trên, xanh lá trước.
   - Tài liệu OP: memo, buffer/đích, bảng setup cho từng chữ cái, parity.
   - Luyện bảng chữ cái: tô sáng một sticker, gõ chữ tương ứng.
   - Luyện memo: từ scramble WCA, gõ chuỗi chữ cạnh/góc, app chấm và hiện luôn memo đáp án.
   - Tạo scramble chọn được có/không parity (vẫn random-state: sinh lại đến khi khớp).
   - Thực hành bịt mắt: che khối 3D, đi qua từng lượt đổi chỗ, cuối cùng mở mắt kiểm tra.
   - Lời giải OP và bảng setup do app tính, được test đưa 100 scramble về solved.

Model khối dạng facelet tự viết dùng cho solver, test và hình minh hoạ; test
bằng Vitest.

**Ngoài phạm vi**: timer/thống kê, tài khoản, puzzle khác 3x3, Roux/ZZ, BLD M2/R2
hoặc 3-style, chọn
màu cross (color neutral), nhập khối bằng camera hoặc tô màu tay, backend.

## Bắt đầu

Yêu cầu Node.js (đã kiểm thử với v22). Các lệnh có sẵn nằm trong mục `scripts`
của [package.json](package.json).

```
npm install
npm run dev
npm test
```

## Mã nguồn

- Điểm vào: [src/main.tsx](src/main.tsx) → [src/App.tsx](src/App.tsx)
- Cấu hình build và test: [vite.config.ts](vite.config.ts)
- Model khối facelet + ký hiệu Singmaster: [src/cube/](src/cube/) (hoán vị sinh
  từ toạ độ 3D của sticker; test đối chiếu với `cubing/kpuzzle`)
- Điều hướng bằng hash (`#/thu-vien`, `#/luyen-tap`, `#/bld`): [src/lib/hash-route.ts](src/lib/hash-route.ts)
- Dữ liệu F2L/OLL/PLL/2-look, hướng dẫn Cross, nhận diện ca: [src/algorithms/](src/algorithms/)
  (test chứng minh mỗi bộ phân biệt và phủ đủ mọi trạng thái)
- Solver CFOP chạy trong Web Worker: [src/solver/](src/solver/); fixture 100 scramble WCA ở
  [src/solver/fixtures/](src/solver/fixtures/)
- BLD Old Pochmann (bảng Speffz, setup, memo, lời giải): [src/bld/](src/bld/)
- Giao diện: [src/pages/](src/pages/), [src/components/](src/components/) (`CubeViewer` bọc
  `TwistyPlayer`), [src/hooks/](src/hooks/)

## Số liệu đo

Đo ngày 2026-10-23 trên máy dev (Node 22, 100 scramble fixture):

- Solver CFOP: p50 ≈ 30–55 ms, p95 ≈ 80–140 ms, chậm nhất ≈ 300 ms (mục tiêu p95 ≤ 5 giây).
  Trung bình số nước: Cross 5.7, mỗi cặp F2L 5.3, OLL 10.8, PLL 14.6.
- Bundle (`npm run build`): chunk khởi tạo `index-*.js` ≈ 274 kB (gzip ≈ 87 kB), không chứa
  cubing.js. cubing.js chỉ tải khi mở khối 3D hoặc tạo scramble: `twisty-dynamic-3d` ≈ 504 kB,
  `twisty` ≈ 115 kB, wasm sinh scramble ≈ 671 kB.
