import { defineCases } from './types'

// 2-look OLL/PLL cho người mới: ít thuật toán hơn, giải tầng cuối trong 4 bước.

export const OLL2 = defineCases('OLL2', '2-look OLL', [
  ['Chấm', 'Bước 1: chữ thập vàng', 'Chấm', "F R U R' U' F' f R U R' U' f'", [], 'Không cạnh vàng nào hướng lên.'],
  ['Chữ L', 'Bước 1: chữ thập vàng', 'Chữ L', "f R U R' U' f'", [], 'Cầm chữ L ở góc sau-trái.'],
  ['Đường thẳng', 'Bước 1: chữ thập vàng', 'Đường thẳng', "F R U R' U' F'", [], 'Cầm đường thẳng nằm ngang.'],
  ['Sune', 'Bước 2: mặt vàng', 'Sune', "R U R' U R U2 R'"],
  ['Antisune', 'Bước 2: mặt vàng', 'Antisune', "R U2 R' U' R U' R'"],
  ['H', 'Bước 2: mặt vàng', 'H', "R U R' U R U' R' U R U2 R'"],
  ['Pi', 'Bước 2: mặt vàng', 'Pi', "R U2 R2 U' R2 U' R2 U2 R"],
  ['Headlights', 'Bước 2: mặt vàng', 'Headlights', "R2 D' R U2 R' D R U2 R"],
  ['T', 'Bước 2: mặt vàng', 'T', "r U R' U' r' F R F'"],
  ['Bowtie', 'Bước 2: mặt vàng', 'Bowtie', "F' r U R' U' r' F R"],
])

export const PLL2 = defineCases('PLL2', '2-look PLL', [
  ['Góc kề', 'Bước 1: hoán vị góc', 'Đổi 2 góc kề (T-perm)', "R U R' U' R' F R2 U' R' U' R U R' F'", [], 'Đặt cặp "đèn pha" (2 góc cùng màu) ở bên trái.'],
  ['Góc chéo', 'Bước 1: hoán vị góc', 'Đổi 2 góc chéo (Y-perm)', "F R U' R' U' R U R' F' R U R' U' R' F R F'"],
  ['Ua', 'Bước 2: hoán vị cạnh', 'Ua', "M2 U M U2 M' U M2"],
  ['Ub', 'Bước 2: hoán vị cạnh', 'Ub', "M2 U' M U2 M' U' M2"],
  ['H', 'Bước 2: hoán vị cạnh', 'H', 'M2 U M2 U2 M2 U M2'],
  ['Z', 'Bước 2: hoán vị cạnh', 'Z', "M' U M2 U M2 U M' U2 M2"],
])
