import { defineCases } from './types'

// Thuật toán thông dụng theo bảng PLL của cộng đồng speedsolving
// (speedsolving.com wiki, "PLL"). Mọi thuật toán không để lại xoay khối.

export const PLL = defineCases('PLL', 'PLL', [
  ['Aa', 'Chỉ đổi góc', 'Aa', "x R' U R' D2 R U' R' D2 R2 x'"],
  ['Ab', 'Chỉ đổi góc', 'Ab', "x R2 D2 R U R' D2 R U' R x'"],
  ['E', 'Chỉ đổi góc', 'E', "x' R U' R' D R U R' D' R U R' D R U' R' D' x"],
  ['H', 'Chỉ đổi cạnh', 'H', 'M2 U M2 U2 M2 U M2'],
  ['Ua', 'Chỉ đổi cạnh', 'Ua', "M2 U M U2 M' U M2", ["R U' R U R U R U' R' U' R2"]],
  ['Ub', 'Chỉ đổi cạnh', 'Ub', "M2 U' M U2 M' U' M2", ["R2 U R U R' U' R' U' R' U R'"]],
  ['Z', 'Chỉ đổi cạnh', 'Z', "M' U M2 U M2 U M' U2 M2"],
  ['F', 'Đổi góc kề', 'F', "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R"],
  ['Ja', 'Đổi góc kề', 'Ja', "R' U L' U2 R U' R' U2 R L"],
  ['Jb', 'Đổi góc kề', 'Jb', "R U R' F' R U R' U' R' F R2 U' R'"],
  ['Ra', 'Đổi góc kề', 'Ra', "R U' R' U' R U R D R' U' R D' R' U2 R'"],
  ['Rb', 'Đổi góc kề', 'Rb', "R2 F R U R U' R' F' R U2 R' U2 R"],
  ['T', 'Đổi góc kề', 'T', "R U R' U' R' F R2 U' R' U' R U R' F'"],
  ['Ga', 'Chữ G', 'Ga', "R2 U R' U R' U' R U' R2 U' D R' U R D'"],
  ['Gb', 'Chữ G', 'Gb', "R' U' R U D' R2 U R' U R U' R U' R2 D"],
  ['Gc', 'Chữ G', 'Gc', "R2 U' R U' R U R' U R2 U D' R U' R' D"],
  ['Gd', 'Chữ G', 'Gd', "R U R' U' D R2 U' R U' R' U R' U R2 D'"],
  ['Na', 'Đổi góc chéo', 'Na', "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'"],
  ['Nb', 'Đổi góc chéo', 'Nb', "R' U R U' R' F' U' F R U R' F R' F' R U' R"],
  ['V', 'Đổi góc chéo', 'V', "R' U R' U' R D' R' D R' U D' R2 U' R2 D R2"],
  ['Y', 'Đổi góc chéo', 'Y', "F R U' R' U' R U R' F' R U R' U' R' F R F'"],
])
