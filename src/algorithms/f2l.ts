import { caseState, describeFrPair } from './case-state'
import { defineCases } from './types'

// Thuật toán thông dụng theo bảng F2L 41 ca của cộng đồng speedsolving
// (speedsolving.com wiki, "F2L"); vài ca dùng lời giải ngắn nhất trong <R, U, F>.
// Mọi ca đặt ở khe trước-phải (FR), chỉ dùng R U F để khớp với lời giải của
// solver (xoay `y` đưa khe về FR). Tên ca sinh từ vị trí cặp nên luôn khớp hình.

const TOP = 'Cả hai ở tầng trên'
const CORNER_IN = 'Góc trong khe'
const EDGE_IN = 'Cạnh trong khe'
const BOTH_IN = 'Cả hai trong khe'

const ROWS: [number, string, string][] = [
  [1, TOP, "U R U' R'"],
  [2, TOP, "U' F' U F"],
  [3, TOP, "F' U' F"],
  [4, TOP, "R U R'"],
  [5, TOP, "U' R U R' U2 R U' R'"],
  [6, TOP, "U F' U' F U2 F' U F"],
  [7, TOP, "U' R U2 R' U2 R U' R'"],
  [8, TOP, "U F' U2 F U2 F' U F"],
  [9, TOP, "U' R U' R' U F' U' F"],
  [10, TOP, "U' R U R' U R U R'"],
  [11, TOP, "U' R U2 R' U F' U' F"],
  [12, TOP, "R U' R' U R U' R' U2 R U' R'"],
  [13, TOP, "U F' U F U' F' U' F"],
  [14, TOP, "U' R U' R' U R U R'"],
  [15, TOP, "R U R' U2 R U R' U' R U R'"],
  [16, TOP, "R U' R' U2 R U R'"],
  [17, TOP, "R U2 R' U' R U R'"],
  [18, TOP, "F' U2 F U F' U' F"],
  [19, TOP, "U R U2 R' U R U' R'"],
  [20, TOP, "U' F' U2 F U' F' U F"],
  [21, TOP, "U2 F' U F U2 R U R'"],
  [22, TOP, "U2 F' U' F U' F' U F"],
  [23, TOP, "R U' R' U2 F' U' F"],
  [24, TOP, "U' F' U F U F' U F U' F' U F"],
  [25, CORNER_IN, "U' R' F R F' R U R'"],
  [26, CORNER_IN, "U R U' R' F R' F' R"],
  [27, CORNER_IN, "R U' R' U R U' R'"],
  [28, CORNER_IN, "F' U F U' F' U F"],
  [29, CORNER_IN, "R' F R F2 U' F"],
  [30, CORNER_IN, "R U R' U' R U R'"],
  [31, EDGE_IN, "U' R' F R F' R U' R'"],
  [32, EDGE_IN, "U R U' R' U R U' R' U R U' R'"],
  [33, EDGE_IN, "U' R U' R' U2 R U' R'"],
  [34, EDGE_IN, "U R U R' U2 R U R'"],
  [35, EDGE_IN, "U' R U R' U F' U' F"],
  [36, EDGE_IN, "U F' U' F U' R U R'"],
  [37, BOTH_IN, "R2 U2 F R2 F' U2 R' U R'"],
  [38, BOTH_IN, "R U' R' U' R U R' U2 R U' R'"],
  [39, BOTH_IN, "R U' R' U R U2 R' U R U' R'"],
  [40, BOTH_IN, "R U F R U R' U' F' R'"],
  [41, BOTH_IN, "R F U R U' R' F' U' R'"],
]

export const F2L = defineCases(
  'F2L',
  'F2L',
  ROWS.map(([key, group, alg]) => [key, group, describeFrPair(caseState({ alg })), alg] as const),
)
