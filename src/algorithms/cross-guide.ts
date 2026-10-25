// Hướng dẫn Cross trực giác. Thuật toán viết ở hướng giải: trắng ở đáy,
// cạnh cần đưa về nằm ở vị trí ghi trong `setup` (áp dụng lên khối đã giải).

export interface CrossSituation {
  title: string
  description: string
  /** Moves that create the situation from a solved cube (solving orientation). */
  setup: string
  alg: string
}

export const CROSS_INTRO = [
  'Cross là bước đầu tiên của CFOP: ghép 4 cạnh trắng thành dấu cộng ở mặt đáy, mỗi cạnh khớp màu với tâm mặt bên.',
  'Khác phương pháp cho người mới, CFOP làm cross ngay ở mặt đáy để khi chuyển sang F2L không cần lật khối và nhìn được các cặp ở tầng trên.',
  'Cross không cần học thuộc thuật toán. Hãy hiểu mỗi cạnh đi đường nào, rồi tập lên kế hoạch cả 4 cạnh trong thời gian quan sát.',
] as const

export const CROSS_SITUATIONS: readonly CrossSituation[] = [
  {
    title: 'Cạnh ở tầng trên, màu trắng hướng lên',
    description: 'Xoay U để cạnh nằm trên tâm cùng màu, rồi xoay mặt đó nửa vòng.',
    setup: 'F2',
    alg: 'F2',
  },
  {
    title: 'Cạnh ở tầng trên, màu trắng hướng ra ngoài',
    description: 'Đưa cạnh lên trên tâm bên cạnh tâm đích, rồi dùng 3 nước để lật và hạ xuống mà không phá cạnh đã đặt.',
    setup: "R' F' R U",
    alg: "U' R' F R",
  },
  {
    title: 'Cạnh ở tầng giữa',
    description: 'Xoay mặt bên chứa cạnh để hạ thẳng xuống đáy. Nếu cạnh khác đã đặt bị đẩy đi, xoay D trước rồi trả lại sau.',
    setup: "F'",
    alg: 'F',
  },
  {
    title: 'Cạnh ở đáy nhưng sai chỗ hoặc lật ngược',
    description: 'Đưa cạnh lên tầng trên (một nước mặt bên), rồi xử lý như một trong các tình huống trên.',
    setup: "F2 U' R' F R",
    alg: "R' F' R U F2",
  },
]

export const CROSS_TIPS = [
  'Lên kế hoạch toàn bộ cross trong 15 giây quan sát; cross tối ưu luôn có thể làm trong 8 nước trở xuống.',
  'Ưu tiên cạnh nào đi được 1–2 nước trước; xem các cạnh còn lại đã ở đúng vị trí tương đối với nhau chưa.',
  'Giữ trắng ở đáy ngay từ đầu, đừng làm cross ở mặt trên rồi lật khối.',
  'Dùng màn Luyện tập: tạo scramble, tự làm cross rồi so với lời giải cross tối ưu của solver.',
] as const
