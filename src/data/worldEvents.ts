import { PlayerStats, Item } from '../types/game';

export interface WorldEvent {
  id: string;
  title: string;
  subtitle: string;
  category: 'beast_tide' | 'ambush' | 'auction' | 'rare_herb' | 'secret_realm' | 'sect_war_skirmish';
  mapId: string;
  x: number;
  y: number;
  description: string;
  targetObjective: string;
  requiredRealmIndex: number;
  timeLimitHours: number; // in-game hours
  activeFactions: string[];
  rewards: {
    exp: number;
    spiritStones: number;
    contribution?: number;
    reputationChange: Record<string, number>;
    items?: { itemId: string; count: number; name: string }[];
  };
  consequencesText: string;
  // Trigger condition:
  minGameDay: number;
}

export const WORLD_EVENTS: WorldEvent[] = [
  {
    id: 'event_beast_tide_village',
    title: 'Thú Triều Cuồng Nộ Tràn Xuống Thôn Dân',
    subtitle: 'Nguy Cơ Diệt Thôn Tại Thanh Khê',
    category: 'beast_tide',
    mapId: 'map_thanh_khe',
    x: 750,
    y: 500,
    description: 'Linh mạch biến động khiến đàn Dã Lang và Dã Trư phát cuồng, lũ lượt tràn về uy hiếp nhà cửa và thôn dân Thanh Khê thôn. Trưởng thôn khẩn thiết cầu cứu người tu tiên trấn áp!',
    targetObjective: 'Đến Thanh Khê thôn tiêu diệt 5 con dã thú cuồng nộ và đẩy lùi thú triều',
    requiredRealmIndex: 1, // Luyện Khí Tầng 1+
    timeLimitHours: 24,
    activeFactions: ['tan_tu_lien_minh', 'thanh_van_tong'],
    rewards: {
      exp: 450,
      spiritStones: 120,
      contribution: 25,
      reputationChange: {
        tan_tu_lien_minh: 30,
        thanh_van_tong: 20,
      },
      items: [
        { itemId: 'ngung_huyet_thao', count: 4, name: 'Ngưng Huyết Thảo' },
        { itemId: 'yeu_dan_so_cap', count: 2, name: 'Hạ Phẩm Yêu Đan' },
      ],
    },
    consequencesText: 'Cứu vãn hàng chục sinh mạng phàm nhân, thôn làng an cư lạc nghiệp, tăng mạnh Đạo Tâm thiện hạnh!',
    minGameDay: 1,
  },
  {
    id: 'event_ambush_caravan',
    title: 'Đoàn Tiêu Cục Vạn Bảo Bị Ma Tu Phục Kích',
    subtitle: 'Huyết Chiến Bên Bờ Rừng Linh Vụ',
    category: 'ambush',
    mapId: 'map_linh_vu',
    x: 950,
    y: 420,
    description: 'Thương đội vận chuyển khoáng thạch quý của Vạn Bảo Thương Hội bị một toán đệ tử Hắc Phong Môn mai phục cướp đoạt. Các tiêu sư đang cố thủ chờ tiếp viện!',
    targetObjective: 'Giải cứu Tiêu Sư Vạn Bảo Thương Hội, đẩy lui đám phục kích Hắc Phong Môn',
    requiredRealmIndex: 3, // Luyện Khí Tầng 3+
    timeLimitHours: 18,
    activeFactions: ['van_bao_thuong_hoi', 'hac_phong_mon', 'thanh_van_tong'],
    rewards: {
      exp: 600,
      spiritStones: 220,
      contribution: 40,
      reputationChange: {
        van_bao_thuong_hoi: 45,
        thanh_van_tong: 25,
        hac_phong_mon: -35,
      },
      items: [
        { itemId: 'thanh_cuong_sa', count: 3, name: 'Thanh Cương Sa' },
        { itemId: 'bich_tieu_ti_loi_phu', count: 1, name: 'Bích Tiêu Tị Lôi Phù' },
      ],
    },
    consequencesText: 'Thương hội ghi nhận đại ân, giảm giá 10% khi giao dịch tại Phường Thị và mở ra tuyến hợp tác thân cận.',
    minGameDay: 1,
  },
  {
    id: 'event_rare_herb_bloom',
    title: 'Huyết Tinh Chi Nghìn Năm Xuất Thế',
    subtitle: 'Linh Khí Xung Thiên Tại Bách Thảo Trạch',
    category: 'rare_herb',
    mapId: 'map_linh_vu',
    x: 1120,
    y: 250,
    description: 'Cây Huyết Tinh Chi quý hiếm ngàn năm tại Bách Thảo Trạch đang độ nở hoa tỏa hương thơm ngát. Các tán tu và dược sư Bách Thảo Cốc đang tụ hội tranh đoạt linh duyên.',
    targetObjective: 'Đến hái Huyết Tinh Chi quý hiếm hoặc bảo hộ dược sư Bách Thảo Cốc thu hái',
    requiredRealmIndex: 4,
    timeLimitHours: 12,
    activeFactions: ['bach_thao_coc', 'tan_tu_lien_minh'],
    rewards: {
      exp: 750,
      spiritStones: 180,
      reputationChange: {
        bach_thao_coc: 50,
        tan_tu_lien_minh: 20,
      },
      items: [
        { itemId: 'huyet_tinh_chi', count: 2, name: 'Huyết Tinh Chi' },
        { itemId: 'hoi_xuan_dan', count: 2, name: 'Hồi Xuân Đan' },
      ],
    },
    consequencesText: 'Bách Thảo Cốc biết ơn, dược sư tặng kèm đan phương và đan dược điều dưỡng kinh mạch thượng hạng.',
    minGameDay: 2,
  },
  {
    id: 'event_market_secret_auction',
    title: 'Phường Thị Tổ Chức Đấu Giá Bí Mật',
    subtitle: 'Đại Hội Đấu Giá Hắc Thị Vạn Bảo Các',
    category: 'auction',
    mapId: 'map_phuong_thi',
    x: 480,
    y: 220,
    description: 'Tổng Các Chủ Thẩm Vạn Kim bí mật mở hội đấu giá hắc thị, tung ra vô số bí kíp công pháp tàn thiên, đan dược Trúc Cơ và linh khoáng hiếm.',
    targetObjective: 'Tham gia đại hội đấu giá tại Phường Thị Thanh Hà, hoàn thành giao dịch bảo vật',
    requiredRealmIndex: 2,
    timeLimitHours: 36,
    activeFactions: ['van_bao_thuong_hoi', 'tan_tu_lien_minh'],
    rewards: {
      exp: 300,
      spiritStones: 150,
      reputationChange: {
        van_bao_thuong_hoi: 40,
      },
      items: [
        { itemId: 'dinh_than_dan', count: 1, name: 'Định Thần Đan' },
      ],
    },
    consequencesText: 'Thu được đan dược trân quý hỗ trợ đột phá, danh tiếng uy chấn giới thương buôn.',
    minGameDay: 2,
  },
  {
    id: 'event_cultist_incursion',
    title: 'Ma Tu Hắc Phong Môn Tập Kích Sơn Môn',
    subtitle: 'Tiếng Chuông Cảnh Báo Vang Dội Thanh Vân Tiên Tông',
    category: 'sect_war_skirmish',
    mapId: 'map_thanh_van_tong',
    x: 650,
    y: 800,
    description: 'Lợi dụng lúc chưởng môn bế quan, một đội cảm tử Hắc Phong Môn xông lên bậc thang sơn môn ném lôi hỏa đạn, toan cướp phá Tàng Kinh Các!',
    targetObjective: 'Cùng các đồng môn đệ tử hợp lực đẩy lùi quân tiên phong Hắc Phong Môn',
    requiredRealmIndex: 5, // Luyện Khí Tầng 5+
    timeLimitHours: 12,
    activeFactions: ['thanh_van_tong', 'hac_phong_mon'],
    rewards: {
      exp: 1000,
      spiritStones: 350,
      contribution: 100,
      reputationChange: {
        thanh_van_tong: 75,
        hac_phong_mon: -60,
      },
      items: [
        { itemId: 'tay_tuy_dan', count: 1, name: 'Tẩy Tủy Đan' },
        { itemId: 'ho_tam_bao_kinh', count: 1, name: 'Hộ Tâm Bảo Kính' },
      ],
    },
    consequencesText: 'Bảo vệ thành công Tàng Kinh Các! Tông môn thưởng lớn điểm cống hiến và phong danh hiệu Kiếm Tu Kiên Dũng.',
    minGameDay: 3,
  },
];
