import { Quest } from '../types/game';

export const INITIAL_QUESTS: Record<string, Quest> = {
  // === CHƯƠNG 1: PHÀM TRẦN KHỞI MỘNG ===
  quest_c1_1: {
    id: 'quest_c1_1',
    chapter: 1,
    title: 'Hái Thuốc Cứu Mẹ',
    description: 'Mẹ của Lâm Mặc lâm bệnh hoạn, lang y trong làng dặn phải hái đủ 3 cây Ngưng Huyết Thảo bên bờ suối bìa rừng Thanh Khê để sắc thuốc.',
    type: 'main',
    giverNpcId: 'npc_truong_thon',
    objectives: [
      {
        id: 'c1_1_gather',
        text: 'Hái 3 cây Ngưng Huyết Thảo bên bờ suối',
        type: 'gather',
        targetId: 'ngung_huyet_thao',
        targetCount: 3,
        currentCount: 0,
        completed: false,
      },
      {
        id: 'c1_1_wolves',
        text: 'Tiêu diệt 2 con Thanh Khê Dã Lang gây nguy hiểm',
        type: 'kill',
        targetId: 'enemy_wolf',
        targetCount: 2,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
      exp: 80,
      spiritStones: 20,
      items: [{ itemId: 'kim_sang_dan', count: 2 }],
    },
    status: 'active',
  },

  quest_c1_2: {
    id: 'quest_c1_2',
    chapter: 1,
    title: 'Dị Tượng Suối Nước & Cổ Ngọc',
    description: 'Sau khi dẹp yên bầy sói, Lâm Mặc thấy dưới đáy khe suối phát ra ánh quang ngũ sắc kỳ lạ. Hãy đến bờ suối phía đông điều tra và nhặt lấy vật phát sáng.',
    type: 'main',
    giverNpcId: 'npc_truong_thon',
    objectives: [
      {
        id: 'c1_2_inspect',
        text: 'Khảo sát đáy suối và nhặt Cổ Ngũ Hành Ngọc Đồng',
        type: 'gather',
        targetId: 'co_ngoc_dong',
        targetCount: 1,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
      exp: 100,
      spiritStones: 30,
      items: [{ itemId: 'tu_khi_dan', count: 1 }],
    },
    status: 'available',
  },

  quest_c1_3: {
    id: 'quest_c1_3',
    chapter: 1,
    title: 'Thương Thế Mạc Lão',
    description: 'Một lão giả y phục rách tả tơi đang dựa vào tảng đá gần rừng rậm rên rỉ vì trúng kịch độc. Hãy tiếp cận và tìm cách cứu mạng hoặc thương lượng với ông ta.',
    type: 'main',
    giverNpcId: 'npc_mac_lao',
    objectives: [
      {
        id: 'c1_3_talk',
        text: 'Nói chuyện với Mạc Lão và cho ông uống Kim Sáng Đan',
        type: 'talk',
        targetId: 'npc_mac_lao',
        targetCount: 1,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
      exp: 150,
      spiritStones: 50,
      items: [
        { itemId: 'tu_khi_dan', count: 2 },
        { itemId: 'thanh_phong_kiem', count: 1 }
      ],
    },
    status: 'available',
  },

  quest_c1_4: {
    id: 'quest_c1_4',
    chapter: 1,
    title: 'Dẫn Khí Nhập Thể',
    description: 'Được Mạc Lão truyền thụ khẩu quyết Trường Sinh Quyết, hãy tĩnh tâm tu luyện, tích lũy đủ Tu Vi và đột phá lên Luyện Khí Tầng 1.',
    type: 'main',
    giverNpcId: 'npc_mac_lao',
    objectives: [
      {
        id: 'c1_4_breakthrough',
        text: 'Đột phá cảnh giới đạt tới Luyện Khí Tầng 1',
        type: 'breakthrough',
        targetCount: 1,
        currentCount: 0,
        completed: false,
      },
      {
        id: 'c1_4_kill_boar',
        text: 'Thử nghiệm kiếm khí tiêu diệt Thiết Bì Dã Trư thủ lĩnh',
        type: 'kill',
        targetId: 'enemy_boar',
        targetCount: 1,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
      exp: 250,
      spiritStones: 80,
      items: [{ itemId: 'than_hanh_phu', count: 3 }],
    },
    status: 'available',
  },

  // === CHƯƠNG 2: SƠ NHẬP TIÊN MÔN ===
  quest_c2_1: {
    id: 'quest_c2_1',
    chapter: 2,
    title: 'Linh Căn Khảo Nghiệm & Lựa Chọn',
    description: 'Sứ giả Thanh Vân Tông là Tiêu Trưởng Lão đang có mặt tại ranh giới rừng. Hãy tới diện kiến để kiểm tra tư chất linh căn và quyết định con đường tương lai.',
    type: 'main',
    giverNpcId: 'npc_tieu_truong_lao',
    objectives: [
      {
        id: 'c2_1_talk',
        text: 'Gặp Tiêu Trưởng Lão tại cổng Rừng Linh Vụ',
        type: 'talk',
        targetId: 'npc_tieu_truong_lao',
        targetCount: 1,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
      exp: 300,
      spiritStones: 100,
      items: [{ itemId: 'thanh_van_dao_bao', count: 1 }],
    },
    status: 'available',
  },

  quest_c2_2: {
    id: 'quest_c2_2',
    chapter: 2,
    title: 'Thảo Dược Rừng Linh Vụ',
    description: 'Rừng Linh Vụ tràn ngập sương mù và linh khí. Hãy vào sâu trong rừng thu hái 3 bông Tử U Lan và săn 4 con Linh Hầu cướp bóc.',
    type: 'main',
    giverNpcId: 'npc_tieu_truong_lao',
    objectives: [
      {
        id: 'c2_2_gather',
        text: 'Thu thập 3 Tử U Lan trong Rừng Linh Vụ',
        type: 'gather',
        targetId: 'tu_u_lan',
        targetCount: 3,
        currentCount: 0,
        completed: false,
      },
      {
        id: 'c2_2_kill',
        text: 'Tiêu diệt 4 con Cuồng Bạo Linh Hầu',
        type: 'kill',
        targetId: 'enemy_monkey',
        targetCount: 4,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
      exp: 500,
      spiritStones: 150,
      items: [{ itemId: 'boi_nguyen_dan', count: 2 }],
    },
    status: 'available',
  },

  quest_c2_3: {
    id: 'quest_c2_3',
    chapter: 2,
    title: 'Luyện Đan Nhập Môn',
    description: 'Sử dụng lò luyện đan, kết hợp thảo dược đã hái để tự tay luyện chế ra một viên Tụ Khí Đan hoặc Kim Sáng Đan.',
    type: 'main',
    giverNpcId: 'npc_dan_su',
    objectives: [
      {
        id: 'c2_3_alchemy',
        text: 'Mở lò luyện đan và chế tạo thành công 1 viên đan dược bất kỳ',
        type: 'gather',
        targetId: 'tu_khi_dan',
        targetCount: 1,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
      exp: 400,
      spiritStones: 120,
      items: [{ itemId: 'bach_nien_linh_chi', count: 2 }],
    },
    status: 'available',
  },

  // === CHƯƠNG 3: TU TIÊN GIỚI TÀN KHỐC ===
  quest_c3_1: {
    id: 'quest_c3_1',
    chapter: 3,
    title: 'Phường Thị Thanh Hà & Manh Mối',
    description: 'Băng qua Rừng Linh Vụ tiến vào Phường Thị Thanh Hà. Hãy đến Vạn Bảo Các gặp Chưởng quầy Thẩm Vạn Kim để trao đổi tin tức.',
    type: 'main',
    giverNpcId: 'npc_tham_van_kim',
    objectives: [
      {
        id: 'c3_1_talk',
        text: 'Nói chuyện với Thẩm Vạn Kim tại Vạn Bảo Các',
        type: 'talk',
        targetId: 'npc_tham_van_kim',
        targetCount: 1,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
      exp: 600,
      spiritStones: 200,
      items: [{ itemId: 'ngoc_boi_linh_te', count: 1 }],
    },
    status: 'available',
  },

  quest_c3_2: {
    id: 'quest_c3_2',
    chapter: 3,
    title: 'Thảo Phạt Hắc Sát Môn',
    description: 'Ma tu Hắc Sát Môn chiếm cứ Hắc Phong Sơn, cướp bóc linh thạch và tàn sát tán tu. Hãy lên núi tiêu diệt 5 tên Hắc Sát Ma Đồ.',
    type: 'main',
    giverNpcId: 'npc_tham_van_kim',
    objectives: [
      {
        id: 'c3_2_kill',
        text: 'Tiêu diệt 5 tên Hắc Sát Ma Đồ trên núi Hắc Phong Sơn',
        type: 'kill',
        targetId: 'enemy_cultist',
        targetCount: 5,
        currentCount: 0,
        completed: false,
      },
      {
        id: 'c3_2_token',
        text: 'Tìm thu được Hắc Sát Truy Sát Lệnh',
        type: 'gather',
        targetId: 'hac_sat_lenh',
        targetCount: 1,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
      exp: 1200,
      spiritStones: 350,
      items: [
        { itemId: 'tay_tuy_dan', count: 2 },
        { itemId: 'huyen_loi_tinh', count: 2 }
      ],
    },
    status: 'available',
  },

  quest_c3_3: {
    id: 'quest_c3_3',
    chapter: 3,
    title: 'Ngưng Khí Hóa Dịch - Trúc Cơ Trảm Đạo',
    description: 'Chuẩn bị đủ tài nguyên, luyện chế Trúc Cơ Đan và xung kích phá tan bình cảnh để đúc thành Tiên Thiên Đạo Cơ!',
    type: 'main',
    giverNpcId: 'npc_mac_lao',
    objectives: [
      {
        id: 'c3_3_breakthrough',
        text: 'Đột phá thành công cảnh giới Trúc Cơ (Sơ kỳ)',
        type: 'breakthrough',
        targetCount: 1,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
      exp: 2500,
      spiritStones: 600,
      items: [
        { itemId: 'can_khon_gioi', count: 1 },
        { itemId: 'bi_canh_tieu_phu', count: 1 }
      ],
    },
    status: 'available',
  },

  // === CHƯƠNG 4: BÍ CẢNH NGÀN NĂM ===
  quest_c4_1: {
    id: 'quest_c4_1',
    chapter: 4,
    title: 'Tiến Vào Cổ Di Tích Bí Cảnh',
    description: 'Sử dụng Thượng Cổ Bí Cảnh Phù Ấn để mở phong ấn cổ trận pháp, tiến vào khu di tích ngàn năm sâu dưới lòng núi Hắc Phong Sơn.',
    type: 'main',
    giverNpcId: 'npc_mac_lao',
    objectives: [
      {
        id: 'c4_1_explore',
        text: 'Tiến vào bản đồ Cổ Di Tích Bí Cảnh',
        type: 'explore',
        targetId: 'map_ancient_ruins',
        targetCount: 1,
        currentCount: 0,
        completed: false,
      },
      {
        id: 'c4_1_skeletons',
        text: 'Tiêu diệt 4 Cổ Thi Thủ Hộ Giả',
        type: 'kill',
        targetId: 'enemy_corpse_guard',
        targetCount: 4,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
      exp: 3500,
      spiritStones: 800,
      items: [{ itemId: 'cuu_u_minh_thiet', count: 2 }],
    },
    status: 'available',
  },

  quest_c4_2: {
    id: 'quest_c4_2',
    chapter: 4,
    title: 'Đại Chiến Ma Linh Hạt Vương',
    description: 'Trùm yêu thú cổ đại Ma Linh Hạt Vương đang trấn thủ điện thờ ngọc tỷ. Hãy tiêu diệt nó để mở đường tới tâm trận!',
    type: 'main',
    giverNpcId: 'npc_mac_lao',
    objectives: [
      {
        id: 'c4_2_boss',
        text: 'Đánh bại Boss Ma Linh Hạt Vương',
        type: 'kill',
        targetId: 'boss_scorpion_king',
        targetCount: 1,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
      exp: 6000,
      spiritStones: 1500,
      items: [
        { itemId: 'han_bang_kiem', count: 1 },
        { itemId: 'chu_qua', count: 1 },
      ],
    },
    status: 'available',
  },

  // === CHƯƠNG 5: NGHỊCH MỆNH TRƯỜNG SINH ===
  quest_c5_1: {
    id: 'quest_c5_1',
    chapter: 5,
    title: 'Ngũ Hành Viên Mãn - Trảm Diệt Ma Tôn',
    description: 'Thủ lĩnh tối cao của thế lực hắc ám - Cổ Thi Ma Vương đã tỉnh giấc mưu toan đoạt lấy Cổ Ngọc để phá hủy cấm chế thế gian! Dốc toàn bộ sức mạnh để trảm ma!',
    type: 'main',
    giverNpcId: 'npc_mac_lao',
    objectives: [
      {
        id: 'c5_1_final_boss',
        text: 'Tiêu diệt Cổ Thi Ma Tôn trong Cổ Di Tích',
        type: 'kill',
        targetId: 'boss_corpse_emperor',
        targetCount: 1,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
      exp: 20000,
      spiritStones: 5000,
      items: [
        { itemId: 'co_khuyet_kiem', count: 1 },
        { itemId: 'pha_canh_dan', count: 2 }
      ],
    },
    status: 'available',
  },

  // === NHIỆM VỤ THANH VÂN TÔNG (SECT MISSIONS) ===
  sect_quest_herbs: {
    id: 'sect_quest_herbs',
    chapter: 2,
    title: '[Tông Môn] Thu Thập Linh Dược Đan Đường',
    description: 'Chấp Sự Đường phát lệnh thu gom dược liệu khẩn cho Đan Phòng. Hãy vào Rừng Linh Vụ thu hái đủ 4 bông Tử U Lan dâng nộp cho tông môn.',
    type: 'sect',
    giverNpcId: 'npc_chap_su_tong_mon',
    objectives: [
      {
        id: 'sq_gather_herbs',
        text: 'Thu thập 4 bông Tử U Lan trong Rừng Linh Vụ',
        type: 'gather',
        targetId: 'tu_u_lan',
        targetCount: 4,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
      exp: 450,
      spiritStones: 120,
      contributionPoints: 60,
      reputation: 25,
      factionId: 'thanh_van_tong',
      items: [{ itemId: 'tu_khi_dan', count: 2 }],
    },
    status: 'available',
  },

  sect_quest_beasts: {
    id: 'sect_quest_beasts',
    chapter: 2,
    title: '[Tông Môn] Trừ Yêu Rừng Linh Vụ',
    description: 'Lũ Cuồng Bạo Linh Hầu quấy nhiễu đường lên núi của đệ tử Thanh Vân Tông. Hãy tiêu diệt 5 con Linh Hầu hung hãn để bảo vệ bình yên cho tông môn.',
    type: 'sect',
    giverNpcId: 'npc_chap_su_tong_mon',
    objectives: [
      {
        id: 'sq_kill_monkeys',
        text: 'Tiêu diệt 5 con Cuồng Bạo Linh Hầu',
        type: 'kill',
        targetId: 'enemy_monkey',
        targetCount: 5,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
      exp: 600,
      spiritStones: 160,
      contributionPoints: 90,
      reputation: 35,
      factionId: 'thanh_van_tong',
      items: [{ itemId: 'boi_nguyen_dan', count: 1 }],
    },
    status: 'available',
  },

  sect_quest_patrol_ores: {
    id: 'sect_quest_patrol_ores',
    chapter: 3,
    title: '[Tông Môn] Khảo Sát Linh Khoáng Hắc Phong',
    description: 'Luyện Khí Đường cần Huyền Thiết để rèn đúc phi kiếm cho đệ tử. Hãy lên chân núi Hắc Phong Sơn thu thập 3 quặng Hắc Phong Huyền Thiết.',
    type: 'sect',
    giverNpcId: 'npc_chap_su_tong_mon',
    objectives: [
      {
        id: 'sq_gather_ore',
        text: 'Khai thác 3 Hắc Phong Huyền Thiết',
        type: 'gather',
        targetId: 'huyen_thiet',
        targetCount: 3,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
      exp: 950,
      spiritStones: 220,
      contributionPoints: 140,
      reputation: 45,
      factionId: 'thanh_van_tong',
      items: [{ itemId: 'tay_tuy_dan', count: 1 }],
    },
    status: 'available',
  },

  sect_quest_slay_cultists: {
    id: 'sect_quest_slay_cultists',
    chapter: 3,
    title: '[Tông Môn] Trảm Ma Vệ Đạo',
    description: 'Ma tu Hắc Sát Môn tàn sát đồng đạo tại Hắc Phong Sơn. Hãy lên núi tiêu diệt 6 tên Hắc Sát Ma Đồ để nêu cao chính khí Thanh Vân Tông!',
    type: 'sect',
    giverNpcId: 'npc_chap_su_tong_mon',
    objectives: [
      {
        id: 'sq_kill_cultists',
        text: 'Tiêu diệt 6 Hắc Sát Ma Đồ',
        type: 'kill',
        targetId: 'enemy_cultist',
        targetCount: 6,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
      exp: 1500,
      spiritStones: 380,
      contributionPoints: 200,
      reputation: 60,
      factionId: 'thanh_van_tong',
      items: [{ itemId: 'dinh_than_dan', count: 1 }, { itemId: 'thanh_phong_kiem', count: 1 }],
    },
    status: 'available',
  },

  // === NHIỆM VỤ PHƯỜNG THỊ & TÁN TU LIÊN MINH ===
  quest_market_escort: {
    id: 'quest_market_escort',
    chapter: 3,
    title: '[Phường Thị] Bảo Hộ Tiêu Cục Vận Chuyển',
    description: 'Thương hội Vạn Bảo cần chuyển một chuyến đan dược quý qua vùng ranh giới Rừng Linh Vụ. Hãy tiêu diệt 4 Thực Cốt Báo Yêu phục kích.',
    type: 'side',
    giverNpcId: 'npc_moi_gioi_phuong_thi',
    objectives: [
      {
        id: 'me_kill_leopards',
        text: 'Tiêu diệt 4 Thực Cốt Báo Yêu chặn đường',
        type: 'kill',
        targetId: 'Thực Cốt Báo Yêu',
        targetCount: 4,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
      exp: 800,
      spiritStones: 300,
      reputation: 40,
      factionId: 'van_bao_thuong_hoi',
      items: [{ itemId: 'boi_nguyen_dan', count: 2 }],
    },
    status: 'available',
  },

  quest_market_secret_trade: {
    id: 'quest_market_secret_trade',
    chapter: 3,
    title: '[Phường Thị] Bí Mật Giao Dịch Cổ Ngọc',
    description: 'Người môi giới nghe phong thanh một tên ma tu tẩu thoát mang theo manh mối về Cổ Di Tích Bí Cảnh. Hãy tìm gặp hắn tại góc chợ.',
    type: 'secret',
    giverNpcId: 'npc_moi_gioi_phuong_thi',
    objectives: [
      {
        id: 'mst_talk_broker',
        text: 'Trao đổi với Tán Tu Môi Giới tại Phường Thị',
        type: 'talk',
        targetId: 'npc_moi_gioi_phuong_thi',
        targetCount: 1,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
      exp: 500,
      spiritStones: 150,
      reputation: 30,
      factionId: 'tan_tu_lien_minh',
      items: [{ itemId: 'kim_quang_phu', count: 2 }],
    },
    status: 'available',
  },

  // === NHIỆM VỤ BÍ CẢNH HẮC PHONG & TRANH ĐOẠT CƠ DUYÊN ===
  quest_bi_canh_hac_phong_explore: {
    id: 'quest_bi_canh_hac_phong_explore',
    chapter: 4,
    title: '[Bí Cảnh] Trảm Vương Đoạt Đan – Hắc Phong Cổ Động',
    description: 'Hắc Phong Cổ Bí Cảnh xuất thế tại sườn núi Hắc Phong Sơn! Nơi đây ẩn chứa động phủ của Hắc Phong Thượng Nhân, vô số linh dược thượng phẩm cùng dã thú hung tàn. Hãy tiến vào trảm diệt Hắc Huyết Viên Vương và thu thập cơ duyên!',
    type: 'secret',
    giverNpcId: 'npc_moi_gioi_phuong_thi',
    objectives: [
      {
        id: 'bchp_gather_herbs',
        text: 'Thu hái 2 Thiên Linh Thảo hoặc Huyết Tinh Chi trong bí cảnh',
        type: 'gather',
        targetId: 'thien_linh_thao',
        targetCount: 2,
        currentCount: 0,
        completed: false,
      },
      {
        id: 'bchp_kill_beasts',
        text: 'Tiêu diệt 4 Hắc Phong Quỷ Lang canh giữ cửa động',
        type: 'kill',
        targetId: 'Hắc Phong Quỷ Lang',
        targetCount: 4,
        currentCount: 0,
        completed: false,
      },
      {
        id: 'bchp_slay_boss',
        text: 'Trảm diệt Boss Bí Cảnh: Hắc Huyết Viên Vương',
        type: 'kill',
        targetId: 'Hắc Huyết Viên Vương',
        targetCount: 1,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
      exp: 4000,
      spiritStones: 1000,
      reputation: 100,
      factionId: 'thanh_van_tong',
      items: [
        { itemId: 'truc_co_dan', count: 1 },
        { itemId: 'bi_canh_thoat_hiem_phu', count: 2 },
        { itemId: 'bi_tich_hac_phong_kiem', count: 1 },
      ],
    },
    status: 'available',
  },

  quest_bi_canh_stele: {
    id: 'quest_bi_canh_stele',
    chapter: 4,
    title: '[Cơ Duyên] Tham Ngộ Cổ Đạo Bia Đá',
    description: 'Bên trong Hắc Phong Bí Cảnh có tấm Cổ Đạo Thạch Bi ngàn năm khắc họa kiếm ngân của tiền bối thượng cổ. Hãy tìm thấy thạch bi và lĩnh ngộ bí pháp.',
    type: 'secret',
    giverNpcId: 'stele_hac_phong',
    objectives: [
      {
        id: 'stele_investigate',
        text: 'Tìm thấy và tham ngộ Bia Đá Cổ Đạo tại Bí Cảnh',
        type: 'explore',
        targetId: 'stele_hac_phong',
        targetCount: 1,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
      exp: 1500,
      spiritStones: 400,
      items: [
        { itemId: 'co_ngoc_di_thu', count: 1 },
        { itemId: 'tu_khi_dan', count: 3 },
      ],
    },
    status: 'available',
  },

  // === NHIỆM VỤ ĐỘT PHÁ & THIÊN KIẾP ĐẠI CẢNH GIỚI ===
  quest_breakthrough_truc_co: {
    id: 'quest_breakthrough_truc_co',
    chapter: 4,
    title: '[Thiên Kiếp] Nghịch Mệnh Trúc Cơ – Vượt Lôi Kiếp Đúc Đạo Cơ',
    description: 'Tu vi đạt Luyện Khí Tầng 13 Viên Mãn, luyện hóa một viên Trúc Cơ Đan, nghênh đón Thiên Kiếp Lôi Đình và chiến thắng Tâm Ma ảo cảnh để chính thức bước vào Trúc Cơ Kỳ!',
    type: 'main',
    objectives: [
      {
        id: 'obj_reach_luyenkhi_13',
        text: 'Đạt Luyện Khí Thập Tam Tầng Viên Mãn (17,000 Tu Vi)',
        type: 'breakthrough',
        targetId: 'luyen_khi_13',
        targetCount: 1,
        currentCount: 0,
        completed: false,
      },
      {
        id: 'obj_prepare_truc_co_dan',
        text: 'Sở hữu 1 Trúc Cơ Đan trong túi đồ (Luyện Đan hoặc đoạt từ Boss Bí Cảnh)',
        type: 'gather',
        targetId: 'truc_co_dan',
        targetCount: 1,
        currentCount: 0,
        completed: false,
      },
      {
        id: 'obj_survive_truc_co_tribulation',
        text: 'Nghênh đón Thiên Kiếp Lôi Đình, trảm diệt Tâm Ma, tấn thăng Trúc Cơ Kỳ',
        type: 'breakthrough',
        targetId: 'truc_co_so',
        targetCount: 1,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
      exp: 5000,
      spiritStones: 2000,
      reputation: 150,
      factionId: 'thanh_van_tong',
      items: [
        { itemId: 'bich_tieu_ti_loi_phu', count: 2 },
        { itemId: 'ho_tam_bao_kinh', count: 1 },
      ],
    },
    status: 'available',
  },

  // === CHUỖI NHIỆM VỤ CHIẾN TRANH TÔNG MÔN & TRANH ĐOẠT TÀI NGUYÊN ===
  quest_war_capture_mine: {
    id: 'quest_war_capture_mine',
    chapter: 4,
    title: '[Chiến Tranh] Tranh Đoạt Mỏ Linh Thạch Hắc Phong Cốc',
    description: 'Hắc Phong Môn hung hãn độc chiếm Mỏ Linh Thạch, cắt đứt nguồn cung linh thạch của các môn phái. Trưởng lão Thanh Vân Tông hạ lệnh xuất kích quét sạch cứ điểm, đoạt lại mỏ khoáng cho chính đạo!',
    type: 'sect',
    objectives: [
      {
        id: 'obj_kill_mine_cultists',
        text: 'Tiêu diệt 4 tên Ma Đồ Hắc Phong Môn canh gác',
        type: 'kill',
        targetId: 'cultist',
        targetCount: 4,
        currentCount: 0,
        completed: false,
      },
      {
        id: 'obj_capture_mine_commander',
        text: 'Đánh bại Thống Lĩnh Mỏ Linh Thạch Ma Lệ (Luyện Khí Tầng 9)',
        type: 'kill',
        targetId: 'cultist_boss',
        targetCount: 1,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
      exp: 2500,
      spiritStones: 600,
      contributionPoints: 150,
      reputation: 80,
      factionId: 'thanh_van_tong',
      items: [
        { itemId: 'tinh_thach', count: 4 },
        { itemId: 'tay_tuy_dan', count: 1 },
      ],
    },
    status: 'available',
  },

  quest_war_rescue_disciples: {
    id: 'quest_war_rescue_disciples',
    chapter: 4,
    title: '[Chiến Tranh] Phá Vòng Vây – Giải Cứu Dược Sư Bách Thảo Cốc',
    description: 'Toán dược sư Bách Thảo Cốc đang thu hái linh dược thì bị phân đội Hắc Phong Môn bao vây đòi bắt cóc luyện tà đan. Hãy kịp thời chi viện, phá vòng vây!',
    type: 'sect',
    objectives: [
      {
        id: 'obj_rescue_herb_masters',
        text: 'Đến Rừng Linh Vụ đánh tan toán phục kích giải vây',
        type: 'kill',
        targetId: 'cultist',
        targetCount: 5,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
      exp: 1800,
      spiritStones: 450,
      contributionPoints: 100,
      reputation: 100,
      factionId: 'bach_thao_coc',
      items: [
        { itemId: 'hoi_xuan_dan', count: 3 },
        { itemId: 'bach_nien_linh_chi', count: 2 },
      ],
    },
    status: 'available',
  },

  quest_war_decisive_battle: {
    id: 'quest_war_decisive_battle',
    chapter: 5,
    title: '[Chiến Tranh Tổng Lực] Huyết Chiến Đỉnh Phong – Trảm Ma Định Càn Khôn',
    description: 'Trận quyết chiến cuối cùng giữa liên quân Thanh Vân Tông & Tán Tu với Hắc Phong Môn bùng nổ trên sườn Hắc Phong Sơn. Hãy tiêu diệt Hắc Sát Ma Tướng, san bằng sào huyệt ma đạo!',
    type: 'sect',
    objectives: [
      {
        id: 'obj_slay_war_boss',
        text: 'Trảm sát Ma Tướng Chỉ Huy Hắc Phong Môn',
        type: 'kill',
        targetId: 'boss_corpse_emperor',
        targetCount: 1,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
      exp: 6000,
      spiritStones: 2500,
      contributionPoints: 300,
      reputation: 200,
      factionId: 'thanh_van_tong',
      items: [
        { itemId: 'pha_canh_dan', count: 1 },
        { itemId: 'co_tien_dan_duoc', count: 1 },
      ],
    },
    status: 'available',
  },

  // === NHIỆM VỤ KHÁM PHÁ THANH PHONG SƠN & CỔ THẠCH ĐỘNG ===
  quest_tps_snake_hunt: {
    id: 'quest_tps_snake_hunt',
    chapter: 2,
    title: '[Thanh Phong Sơn] Trảm Xà Đoạt Đảm – Thám Cổ Thạch Động',
    description: 'Dãy Thanh Phong Sơn có loài Thanh Mộc Xà Yêu mang kịch độc hoành hành, sâu trong Cổ Thạch Động còn có Thanh Phong Cự Mãng canh giữ thảo dược và cổ bảo rương. Tiêu Dao Tán Tu ủy thác đạo hữu lên núi trừ hại!',
    type: 'side',
    giverNpcId: 'npc_tieu_dao_tan_tu',
    objectives: [
      {
        id: 'tps_snakes',
        text: 'Tiêu diệt 3 con Thanh Mộc Xà Yêu trên sườn Thanh Phong Sơn',
        type: 'kill',
        targetId: 'Thanh Mộc Xà Yêu',
        targetCount: 3,
        currentCount: 0,
        completed: false,
      },
      {
        id: 'tps_boss_snake',
        text: 'Trảm diệt Lĩnh Chủ: Thanh Phong Cự Mãng',
        type: 'kill',
        targetId: 'Thanh Phong Cự Mãng',
        targetCount: 1,
        currentCount: 0,
        completed: false,
      },
      {
        id: 'tps_gather_herb',
        text: 'Thu hái 1 cây Thanh Phong Linh Thảo hoặc mở rương ẩn',
        type: 'gather',
        targetId: 'thanh_phong_thao',
        targetCount: 1,
        currentCount: 0,
        completed: false,
      },
    ],
    rewards: {
      exp: 750,
      spiritStones: 220,
      reputation: 40,
      factionId: 'tan_tu_lien_minh',
      items: [
        { itemId: 'thanh_moc_xa_dam', count: 2 },
        { itemId: 'tu_khi_dan', count: 2 },
      ],
    },
    status: 'available',
  },
};

