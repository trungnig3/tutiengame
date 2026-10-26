import { PlayerStats, Item } from '../types/game';

export interface TerritoryStronghold {
  id: string;
  name: string;
  type: 'spirit_mine' | 'herb_field' | 'ancient_abode' | 'rare_ore' | 'relic_site';
  mapId: string;
  x: number;
  y: number;
  defaultOwner: string; // factionId: 'thanh_van_tong' | 'hac_phong_mon' | 'bach_thao_coc' | 'tan_tu_lien_minh' | 'neutral'
  description: string;
  strategicValue: string;
  yieldPerHour: {
    spiritStones?: number;
    contribution?: number;
    items?: { itemId: string; count: number; name: string }[];
  };
  garrison: {
    enemyNames: string[];
    commanderName: string;
    commanderTitle: string;
    realmText: string;
    difficulty: 'easy' | 'medium' | 'hard' | 'nightmare';
  };
}

export const STRONGHOLDS: TerritoryStronghold[] = [
  {
    id: 'stronghold_hac_phong_mine',
    name: 'Mỏ Linh Thạch Hắc Phong Cốc',
    type: 'spirit_mine',
    mapId: 'map_hac_phong_son',
    x: 420,
    y: 350,
    defaultOwner: 'hac_phong_mon',
    description: 'Mạch khoáng linh thạch lớn nhất sườn núi Hắc Phong Sơn, hàng ngày sản xuất hàng trăm linh thạch tinh thuần, là nguồn tài nguyên sống còn.',
    strategicValue: '+120 Linh Thạch và +35 Cống Hiến mỗi lần thu hoạch',
    yieldPerHour: {
      spiritStones: 120,
      contribution: 35,
      items: [{ itemId: 'tinh_thach', count: 2, name: 'Linh Thạch Tinh Thạch' }],
    },
    garrison: {
      enemyNames: ['Hắc Phong Ma Đồ', 'Hắc Sát Đao Thủ', 'Hắc Phong Tiên Phong'],
      commanderName: 'Huyết Đao Đường Chủ - Ma Lệ',
      commanderTitle: 'Thống Lĩnh Mỏ Linh Thạch Hắc Phong Môn',
      realmText: 'Luyện Khí Tầng 9 (Hậu Kỳ)',
      difficulty: 'medium',
    },
  },
  {
    id: 'stronghold_linh_vu_herb_field',
    name: 'Linh Điền Thảo Dược Bách Thảo Trạch',
    type: 'herb_field',
    mapId: 'map_linh_vu',
    x: 1080,
    y: 280,
    defaultOwner: 'bach_thao_coc',
    description: 'Vùng đầm lầy linh khí tụ hợp, đất đai màu mỡ thích hợp ươm mầm Tử U Lan, Ngưng Huyết Thảo và Bách Niên Linh Chi quý hiếm.',
    strategicValue: 'Định kỳ thu hoạch thảo dược quý và gia tăng thiện cảm Bách Thảo Cốc',
    yieldPerHour: {
      spiritStones: 60,
      contribution: 20,
      items: [
        { itemId: 'tu_u_lan', count: 3, name: 'Tử U Lan' },
        { itemId: 'bach_nien_linh_chi', count: 1, name: 'Bách Niên Linh Chi' },
      ],
    },
    garrison: {
      enemyNames: ['Dược Đồng Hộ Vệ', 'Linh Dược Thủ Hộ Thú'],
      commanderName: 'Thanh Thảo Tiên Tử',
      commanderTitle: 'Dược Trưởng Bách Thảo Cốc',
      realmText: 'Luyện Khí Tầng 6 (Trung Kỳ)',
      difficulty: 'easy',
    },
  },
  {
    id: 'stronghold_ancient_cave_core',
    name: 'Cổ Tu Động Phủ Bí Trận',
    type: 'ancient_abode',
    mapId: 'map_hac_phong_bi_canh',
    x: 1100,
    y: 420,
    defaultOwner: 'neutral',
    description: 'Động phủ cổ của tiền bối Thượng Nhân, nơi tụ hội linh mạch đan đạo và kiếm ý thất truyền nghìn năm.',
    strategicValue: '+200 Linh Thạch, nhận Cổ Tiên Đan Dược và +50 Cống Hiến',
    yieldPerHour: {
      spiritStones: 200,
      contribution: 50,
      items: [{ itemId: 'tu_khi_dan', count: 2, name: 'Tụ Khí Đan' }],
    },
    garrison: {
      enemyNames: ['Cổ Động Thủ Hộ Thú', 'Hắc Phong Quỷ Lang'],
      commanderName: 'Hắc Huyết Viên Vương Tàn Hồn',
      commanderTitle: 'Thú Vương Trấn Giữ Cổ Động',
      realmText: 'Bán Bộ Trúc Cơ',
      difficulty: 'hard',
    },
  },
  {
    id: 'stronghold_phuong_thi_checkpoint',
    name: 'Cửa Khẩu Tiêu Cục Phường Thị Thanh Hà',
    type: 'rare_ore',
    mapId: 'map_phuong_thi',
    x: 1200,
    y: 380,
    defaultOwner: 'tan_tu_lien_minh',
    description: 'Trạm kiểm soát giao thương giữa Phường Thị và Hắc Phong Sơn, thu thuế tiêu cục và bảo tiêu hàng hóa cho Vạn Bảo Thương Hội.',
    strategicValue: '+90 Linh Thạch và cung cấp bảo tiêu phù lục cho liên minh',
    yieldPerHour: {
      spiritStones: 90,
      contribution: 25,
      items: [{ itemId: 'kim_quang_phu', count: 1, name: 'Kim Quang Hộ Thân Phù' }],
    },
    garrison: {
      enemyNames: ['Tán Tu Tiêu Sư', 'Giang Hồ Hiệp Khách'],
      commanderName: 'Thiết Kiếm Thiết Đầu Lĩnh',
      commanderTitle: 'Tổng Tiêu Đầu Liên Minh Tán Tu',
      realmText: 'Luyện Khí Tầng 7',
      difficulty: 'medium',
    },
  },
];
