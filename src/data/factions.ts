import { FactionInfo, PavilionManual, SectRank } from '../types/game';

export const FACTIONS: Record<string, FactionInfo> = {
  thanh_van_tong: {
    id: 'thanh_van_tong',
    name: 'Thanh Vân Tông',
    title: 'Chính Đạo Danh Môn Hàng Đầu Đông Hoang',
    description: 'Thanh Vân Tiên Tông ngự trên Thanh Vân Sơn quanh năm mây mù che phủ. Tông môn tôn sùng kiếm đạo và chính khí, nổi tiếng với Thanh Phong Kiếm Trận chém yêu trừ ma.',
    leader: 'Thanh Vân Kiếm Tôn - Lăng Tiêu Tử',
    baseMapId: 'map_thanh_van_tong',
    color: '#0284c7', // Sky Blue
    icon: '🏔️',
  },
  tan_tu_lien_minh: {
    id: 'tan_tu_lien_minh',
    name: 'Liên Minh Tán Tu Thanh Hà',
    title: 'Hội Tán Tu Tự Do Trợ Giúp Lẫn Nhau',
    description: 'Tập hợp các tán tu không môn không phái khắp Thanh Khê và Thanh Hà. Tuy tài nguyên eo hẹp nhưng mạng lưới tin tức cực kỳ linh thông, trọng tự do và sinh tồn.',
    leader: 'Hắc Bào Tán Lão - Tiêu Diêu Tử',
    baseMapId: 'map_phuong_thi',
    color: '#10b981', // Emerald Green
    icon: '🏕️',
  },
  van_bao_thuong_hoi: {
    id: 'van_bao_thuong_hoi',
    name: 'Vạn Bảo Thương Hội',
    title: 'Cự Phách Tài Phú & Mạng Lưới Giao Dịch',
    description: 'Chiếm cứ huyết mạch giao thương Phường Thị Thanh Hà. Tiêu chí bất biến: "Chỉ cần đủ linh thạch, thiên hạ không bảo vật nào không mua được."',
    leader: 'Tổng Các Chủ - Thẩm Vạn Kim',
    baseMapId: 'map_phuong_thi',
    color: '#f59e0b', // Amber Gold
    icon: '💎',
  },
  co_ngoc_bi_an: {
    id: 'co_ngoc_bi_an',
    name: 'Thượng Cổ Di Âm',
    title: 'Khí Tức Ẩn Giấu Sau Mảnh Ngọc Đồng',
    description: 'Tàn dư ý chí của một đại năng thời Thượng Cổ gửi gắm trong Cổ Ngũ Hành Ngọc Đồng. Cảm ứng biến hóa theo các hành vi tìm tòi di tích của Lâm Mặc.',
    leader: 'Cổ Thần Tàn Niệm',
    baseMapId: 'map_ancient_ruins',
    color: '#8b5cf6', // Violet
    icon: '📿',
  },
  bach_thao_coc: {
    id: 'bach_thao_coc',
    name: 'Bách Thảo Cốc',
    title: 'Thánh Địa Dược Đạo & Y Thuật Đông Hoang',
    description: 'Ẩn mình nơi linh sơn u tịch Bách Thảo Cốc, môn phái chuyên về dưỡng sinh, linh điền và đan đạo. Là cứu tinh của vô số tu sĩ trọng thương nhưng giữ thái độ trung lập.',
    leader: 'Dược Vương Cốc Chủ - Tố Vấn Tiên Cô',
    baseMapId: 'map_linh_vu',
    color: '#22c55e', // Green
    icon: '🌱',
  },
  hac_phong_mon: {
    id: 'hac_phong_mon',
    name: 'Hắc Phong Môn',
    title: 'Ma Đạo Tà Giáo Khát Máu Hắc Phong Sơn',
    description: 'Thế lực tà tu ma đạo khát máu chiếm cứ Hắc Phong Sơn và cổ động phủ. Chuyên tu luyện công pháp huyết sát, cướp đoạt mỏ linh thạch và không ngừng gây chiến với Thanh Vân Tông.',
    leader: 'Hắc Phong Môn Chủ - Lệ Cửu U',
    baseMapId: 'map_hac_phong_son',
    color: '#dc2626', // Deep Red
    icon: '⚔️',
  },
  hac_sat_mon: {
    id: 'hac_sat_mon',
    name: 'Hắc Phong Môn (Hắc Sát)',
    title: 'Ma Đạo Tà Giáo Hắc Phong Sơn',
    description: 'Thế lực ma tu tàn bạo chuyên luyện đan bằng hồn phách tu sĩ, cướp bóc linh khoáng và mưu toan giải phóng ma vật cổ đại dưới Cổ Di Tích.',
    leader: 'Hắc Phong Môn Chủ - Lệ Cửu U',
    baseMapId: 'map_hac_phong_son',
    color: '#ef4444', // Red
    icon: '🩸',
  },
};

export interface FactionDiplomacy {
  targetFactionId: string;
  status: 'ally' | 'friendly' | 'neutral' | 'tension' | 'war';
  description: string;
}

export const FACTION_RELATIONS: Record<string, Record<string, FactionDiplomacy>> = {
  thanh_van_tong: {
    hac_phong_mon: { targetFactionId: 'hac_phong_mon', status: 'war', description: 'Huyết hải thù thâm, tranh đoạt Linh Mạch Hắc Phong Cốc!' },
    bach_thao_coc: { targetFactionId: 'bach_thao_coc', status: 'ally', description: 'Đồng minh lâu đời, thường xuyên trao đổi linh dược và kiếm trận bảo hộ.' },
    tan_tu_lien_minh: { targetFactionId: 'tan_tu_lien_minh', status: 'neutral', description: 'Tôn trọng quy ước phường thị, chiêu mộ đệ tử xuất chúng.' },
    van_bao_thuong_hoi: { targetFactionId: 'van_bao_thuong_hoi', status: 'friendly', description: 'Khách hàng lớn mua sắm khoáng thạch và đan dược.' },
  },
  hac_phong_mon: {
    thanh_van_tong: { targetFactionId: 'thanh_van_tong', status: 'war', description: 'Chiến tranh đoạt địa bàn, quyết tiêu diệt chính đạo.' },
    bach_thao_coc: { targetFactionId: 'bach_thao_coc', status: 'tension', description: 'Thèm khát linh dược bí truyền, thường xuyên cho người phục kích cướp bóc.' },
    tan_tu_lien_minh: { targetFactionId: 'tan_tu_lien_minh', status: 'tension', description: 'Áp bức tán tu, thu phí bảo kê tại các lối vào hoang sơn.' },
    van_bao_thuong_hoi: { targetFactionId: 'van_bao_thuong_hoi', status: 'neutral', description: 'Mua lén lút cấm vật và đan dược hắc thị.' },
  },
  bach_thao_coc: {
    thanh_van_tong: { targetFactionId: 'thanh_van_tong', status: 'ally', description: 'Nhận sự bảo hộ quân sự, cung cấp Hồi Xuân Đan định kỳ.' },
    hac_phong_mon: { targetFactionId: 'hac_phong_mon', status: 'tension', description: 'Cảnh giác ma tu cướp đoạt dược điền và linh tuyền.' },
    tan_tu_lien_minh: { targetFactionId: 'tan_tu_lien_minh', status: 'friendly', description: 'Thu mua dược liệu hoang dã từ tán tu với giá tốt.' },
    van_bao_thuong_hoi: { targetFactionId: 'van_bao_thuong_hoi', status: 'friendly', description: 'Kênh phân phối dược thảo và đan phương chính thống.' },
  },
  tan_tu_lien_minh: {
    thanh_van_tong: { targetFactionId: 'thanh_van_tong', status: 'neutral', description: 'Mong muốn gia nhập môn hạ hoặc giữ quan hệ hòa hảo.' },
    hac_phong_mon: { targetFactionId: 'hac_phong_mon', status: 'tension', description: 'Căm ghét ma tu cướp bóc linh thạch.' },
    bach_thao_coc: { targetFactionId: 'bach_thao_coc', status: 'friendly', description: 'Được các dược sư Bách Thảo Cốc bán thuốc giá rẻ.' },
    van_bao_thuong_hoi: { targetFactionId: 'van_bao_thuong_hoi', status: 'friendly', description: 'Cung cấp nhân lực tiêu cục và bảo tiêu.' },
  },
};

export const SECT_RANKS_ORDER: SectRank[] = ['visitor', 'outer', 'inner', 'core', 'elder', 'master'];

export const SECT_RANK_DETAILS: Record<SectRank, {
  name: string;
  minContribution: number;
  minRealmIndex: number; // 0=Phàm Nhân, 1=LK T1, 5=LK T5, 9=LK T9, 13=LK Đỉnh, 14=Trúc Cơ
  salaryPerDay: number; // Spirit stones allowance
  bonusStats: { atk: number; def: number; maxHp: number };
  badge: string;
  perks: string;
}> = {
  visitor: {
    name: 'Khách Viếng Thăm / Tán Tu',
    minContribution: 0,
    minRealmIndex: 0,
    salaryPerDay: 0,
    bonusStats: { atk: 0, def: 0, maxHp: 0 },
    badge: '🏷️',
    perks: 'Có thể đi lại tự do trong quảng trường và giao dịch cơ bản.',
  },
  outer: {
    name: 'Ngoại Môn Đệ Tử',
    minContribution: 0,
    minRealmIndex: 1, // Luyện Khí Tầng 1+
    salaryPerDay: 15,
    bonusStats: { atk: 5, def: 3, maxHp: 30 },
    badge: '🥉',
    perks: 'Mở khóa Tàng Kinh Các tầng 1, nhận nhiệm vụ ngoại môn và bổng lộc hàng ngày.',
  },
  inner: {
    name: 'Nội Môn Đệ Tử',
    minContribution: 250,
    minRealmIndex: 5, // Luyện Khí Tầng 5+
    salaryPerDay: 40,
    bonusStats: { atk: 18, def: 12, maxHp: 90 },
    badge: '🥈',
    perks: 'Mở khóa Tàng Kinh Các tầng 2, khu tu luyện đệ tử và giảm 10% giá đổi cống hiến.',
  },
  core: {
    name: 'Chân Truyền Đệ Tử',
    minContribution: 800,
    minRealmIndex: 10, // Luyện Khí Tầng 10+
    salaryPerDay: 100,
    bonusStats: { atk: 45, def: 30, maxHp: 250 },
    badge: '🥇',
    perks: 'Học kiếm quyết tuyệt phẩm, tiếp cận cấm địa và nhận chỉ điểm từ Tông Môn Trưởng Lão.',
  },
  elder: {
    name: 'Chấp Sự Trưởng Lão',
    minContribution: 2000,
    minRealmIndex: 14, // Trúc Cơ Sơ Kỳ+
    salaryPerDay: 250,
    bonusStats: { atk: 110, def: 75, maxHp: 650 },
    badge: '👑',
    perks: 'Quyền uy tối cao trong môn phái, mở khóa toàn bộ Tàng Kinh Các và đan phòng cấp cao.',
  },
  master: {
    name: 'Tông Chủ / Đại Trưởng Lão',
    minContribution: 5000,
    minRealmIndex: 16,
    salaryPerDay: 600,
    bonusStats: { atk: 250, def: 180, maxHp: 1500 },
    badge: '⚡',
    perks: 'Chưởng quản toàn bộ Thanh Vân Tiên Tông.',
  },
};

// Pavilion manuals available for learning / trading
export const PAVILION_MANUALS: PavilionManual[] = [
  // 1. Cơ sở
  {
    id: 'man_truong_sinh',
    name: 'Trường Sinh Quyết (Toàn Thư)',
    category: 'co_so',
    artId: 'truong_sinh_quyet',
    grade: 'hoang',
    element: 'moc',
    requiredRealmIndex: 0,
    requiredSectRank: 'visitor',
    priceSpiritStones: 120,
    priceContribution: 30,
    description: 'Chính tông Đạo môn dưỡng sinh quyết pháp. Tăng tốc độ hồi phục khí huyết và bình ổn đạo tâm.',
    effects: '+25% HP, +12% Def, mở khóa kỹ năng Hồi Xuân Thuật.',
  },
  {
    id: 'man_thanh_van_tam_phap',
    name: 'Thanh Vân Nhập Môn Khẩu Quyết',
    category: 'co_so',
    artId: 'truong_sinh_quyet',
    grade: 'hoang',
    element: 'phong' as any,
    requiredRealmIndex: 1,
    requiredSectRank: 'outer',
    priceSpiritStones: 80,
    priceContribution: 25,
    description: 'Tâm pháp cơ bản đệ tử Thanh Vân Tông nhập môn bắt buộc phải học để tẩy trừ tạp niệm trần tục.',
    effects: '+15% Tốc độ tu vi, +10 Linh Lực tối đa.',
  },

  // 2. Kiếm Quyết
  {
    id: 'man_thanh_phong_kiem',
    name: 'Thanh Phong Kiếm Quyết',
    category: 'kiem_quyet',
    artId: 'thanh_phong_kiem_quyet',
    grade: 'huyen',
    element: 'kim',
    requiredRealmIndex: 3,
    requiredSectRank: 'outer',
    priceSpiritStones: 350,
    priceContribution: 100,
    description: 'Kiếm pháp danh bất hư truyền của Thanh Vân Tông. Kiếm xuất như phong lôi trảm kích.',
    effects: '+25% Atk, mở khóa Kiếm Trảm Phong cấp tiến và Vạn Kiếm Quy Tông.',
  },
  {
    id: 'man_van_kiem_quy_tong',
    name: 'Vạn Kiếm Quy Tông Tàn Thiên',
    category: 'kiem_quyet',
    artId: 'thanh_phong_kiem_quyet',
    grade: 'dia',
    element: 'kim',
    requiredRealmIndex: 8,
    requiredSectRank: 'inner',
    priceSpiritStones: 1200,
    priceContribution: 350,
    description: 'Tuyệt kỹ ngự kiếm phóng thích 6 thanh linh kiếm hộ thể xoay tròn nghiền nát quân thù.',
    effects: 'Kích hoạt Vạn Kiếm hộ thể gây sát thương liên tục quanh người.',
  },

  // 3. Pháp Thuật Ngũ Hành
  {
    id: 'man_thuan_duong_hoa',
    name: 'Thuần Dương Chân Hỏa Quyết',
    category: 'phap_thuat',
    artId: 'thuan_duong_hoa_quyet',
    grade: 'huyen',
    element: 'hoa',
    requiredRealmIndex: 4,
    requiredSectRank: 'outer',
    priceSpiritStones: 400,
    priceContribution: 120,
    description: 'Luyện khí hóa thành ngọn lửa thuần dương cực nóng, uy lực thiêu đốt vạn vật.',
    effects: '+30% Atk, mở khóa Huyền Lôi Hỏa Trảm uy lực bạo kích cao.',
  },
  {
    id: 'man_huyen_bang_quyet',
    name: 'Huyền Băng Linh Thủy Quyết',
    category: 'phap_thuat',
    artId: 'huyen_bang_quyet',
    grade: 'huyen',
    element: 'thuy',
    requiredRealmIndex: 4,
    requiredSectRank: 'outer',
    priceSpiritStones: 380,
    priceContribution: 110,
    description: 'Ngưng tụ hàn sương bảo vệ tâm mạch đan điền, dập tắt ma chướng và tăng trữ lượng linh lực.',
    effects: '+35% Mp, +20% Def, hồi phục linh lực khi thi triển kỹ năng.',
  },

  // 4. Phòng Ngự & Thân Pháp
  {
    id: 'man_kim_cuong_than',
    name: 'Kim Cương Bất Hoại Thân',
    category: 'phong_ngu',
    artId: 'kim_cuong_than',
    grade: 'huyen',
    element: 'tho',
    requiredRealmIndex: 6,
    requiredSectRank: 'inner',
    priceSpiritStones: 500,
    priceContribution: 150,
    description: 'Thối luyện gân cốt như hoàng kim bất toái, miễn nhiễm đẩy lùi và giảm sát thương vật lý.',
    effects: '+35% Def, +40% Max HP, mở khóa Kim Chung Hộ Thể.',
  },
  {
    id: 'man_than_hanh_huyen_anh',
    name: 'Huyễn Quang Thần Hành Bộ',
    category: 'than_phap',
    artId: 'truong_sinh_quyet',
    grade: 'huyen',
    element: 'phong' as any,
    requiredRealmIndex: 3,
    requiredSectRank: 'outer',
    priceSpiritStones: 300,
    priceContribution: 90,
    description: 'Thân pháp thượng thừa lướt gió không lưu dấu vết, giảm thời gian hồi chiêu của Thần Hành.',
    effects: '+25 Tốc độ di chuyển, -0.4s thời gian hồi né tránh chuột phải.',
  },

  // 5. Thần Thông Trấn Phái & Cổ Di Tích
  {
    id: 'man_co_ngu_hanh',
    name: 'Cổ Huyền Ngũ Hành Chân Kinh',
    category: 'tu_luyen',
    artId: 'co_ngu_hanh_quyet',
    grade: 'dia',
    element: 'ngu_hanh',
    requiredRealmIndex: 9,
    requiredSectRank: 'core',
    requiredReputation: 150,
    priceSpiritStones: 3000,
    priceContribution: 900,
    description: 'Chí tôn tâm pháp thất truyền của Cổ Tiên Giới, hóa hợp ngũ hành tương sinh tương khắc!',
    effects: '+30% Atk, +25% Def, +30% HP, +40% MP, tăng 65% tốc độ tu vi!',
  },
];
