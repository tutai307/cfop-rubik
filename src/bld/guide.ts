import type { PieceKind } from './speffz'
import { CORNER_BUFFER, CORNER_HELPER, CORNER_SWAP, EDGE_BUFFER, EDGE_HELPER, EDGE_SWAP, PARITY_ALG } from './op'

// Nội dung tài liệu Old Pochmann. Buffer, thuật toán và bảng setup lấy từ op.ts
// nên tài liệu luôn khớp với lời giải mà app tính.

export interface GuideSection {
  title: string
  paragraphs: readonly string[]
  alg?: string
  /** Show the generated setup table for this piece type. */
  setupTable?: PieceKind
}

export const BLD_INTRO: readonly string[] = [
  'Giải bịt mắt (BLD) gồm hai phần: quan sát khối và ghi nhớ (memo), rồi bịt mắt và giải hoàn toàn theo trí nhớ.',
  'Old Pochmann (OP) là phương pháp BLD cho người mới: mỗi lần chỉ đưa đúng một mảnh về chỗ bằng cách đổi nó với một vị trí cố định gọi là buffer. Chậm hơn các phương pháp nâng cao nhưng chỉ cần 3 thuật toán bạn đã biết từ PLL.',
  'Luôn cầm khối trắng trên, xanh lá trước, cả lúc memo lẫn lúc giải, và không xoay khối trong suốt quá trình.',
]

export const BLD_SECTIONS: readonly GuideSection[] = [
  {
    title: 'Bảng chữ cái Speffz',
    paragraphs: [
      'Mỗi sticker góc và mỗi sticker cạnh mang một chữ từ A đến X. Mặt U là A–D, L là E–H, F là I–L, R là M–P, B là Q–T, D là U–X; trên mỗi mặt chữ đi theo chiều kim đồng hồ, với góc bắt đầu từ góc trên-trái, với cạnh bắt đầu từ cạnh trên.',
      'Góc và cạnh dùng chung các chữ nhưng là hai bảng riêng: chữ "A" góc là sticker U của góc trái-sau, chữ "A" cạnh là sticker U của cạnh sau.',
      'Học thuộc bảng này trước tiên; chế độ "Bảng chữ cái" giúp bạn luyện nhận chữ thật nhanh.',
    ],
  },
  {
    title: 'Memo: theo dõi chu trình',
    paragraphs: [
      'Nhìn mảnh đang nằm ở buffer, đọc màu của sticker ở vị trí buffer: màu đó cho biết sticker này thuộc về vị trí nào. Ghi lại chữ của vị trí đó.',
      'Khi giải, mảnh trong buffer được đưa về đúng chỗ, và mảnh đang ở chỗ đó bị đẩy vào buffer. Vì vậy chữ tiếp theo đọc từ chính vị trí vừa ghi, cứ thế đến khi mảnh của buffer quay về buffer.',
      'Cycle break: nếu buffer đang chứa chính mảnh buffer mà vẫn còn mảnh sai chỗ, hãy "bắn" buffer tới một mảnh chưa xong bất kỳ (app chọn chữ nhỏ nhất) rồi đọc tiếp từ đó. Mảnh đúng chỗ nhưng bị lật (cạnh) hoặc xoắn (góc) cũng xử lý bằng cycle break và tốn 2 chữ.',
      'Ghép chữ thành cặp (AB CD …) và đặt cho mỗi cặp một từ hoặc hình ảnh để nhớ lâu hơn. Ghi nhớ cạnh trước, góc sau.',
    ],
  },
  {
    title: 'Giải cạnh',
    paragraphs: [
      `Buffer cạnh là ${EDGE_BUFFER} (cạnh UR, sticker trên mặt U). Đích hoán đổi là ${EDGE_HELPER} (cạnh UL). T-perm đổi đúng hai cạnh này (và hai góc bên phải, sẽ tự huỷ theo cặp).`,
      `Với mỗi chữ trong memo cạnh: làm setup để đưa sticker đó tới vị trí ${EDGE_HELPER}, làm T-perm, rồi làm ngược setup. Setup không bao giờ chạm vào buffer.`,
    ],
    alg: EDGE_SWAP,
    setupTable: 'edge',
  },
  {
    title: 'Parity',
    paragraphs: [
      'Nếu memo cạnh có số chữ lẻ thì memo góc cũng lẻ. Khi đó, sau khi xong cạnh và trước khi làm góc, thực hiện thuật toán parity dưới đây (Ra-perm rồi U\').',
      'Nó đưa hai góc bên phải về như cũ và đổi chỗ cạnh UL với UB; lượt đổi góc cuối cùng sẽ trả hai cạnh này về đúng chỗ.',
    ],
    alg: PARITY_ALG,
  },
  {
    title: 'Giải góc',
    paragraphs: [
      `Buffer góc là ${CORNER_BUFFER} (góc ULB, sticker trên mặt U). Đích hoán đổi là ${CORNER_HELPER} (góc RDF, sticker trên mặt R). Thuật toán dưới đây là Y-perm bỏ F đầu và F' cuối.`,
      `Với mỗi chữ trong memo góc: setup đưa sticker tới ${CORNER_HELPER} chỉ bằng R, D, F, làm thuật toán, rồi làm ngược setup.`,
    ],
    alg: CORNER_SWAP,
    setupTable: 'corner',
  },
]

export const BLD_TIPS: readonly string[] = [
  'Thứ tự luyện: học bảng chữ → làm OP mở mắt theo memo viết ra giấy → luyện memo → giải bịt mắt.',
  'Lỗi hay gặp nhất là quên làm ngược setup hoặc làm sai chiều; đọc to từng bước khi mới tập.',
  'Đếm số chữ cạnh ngay lúc memo để biết có parity hay không.',
  'Nếu mất dấu, đừng đoán: mở mắt và dùng chế độ "Bịt mắt" của app để tìm bước sai.',
]
