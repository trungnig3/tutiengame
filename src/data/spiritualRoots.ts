import { ElementType, SpiritualRoot } from '../types/game';

export type RootGrade = 'co_ban' | 'dac_biet' | 'hiem';

export interface SpiritualRootConfig {
  id: string;
  name: string;
  type: ElementType;
  grade: RootGrade;
  description: string;
  lore: string;
  color: string;
  badgeBg: string;
  borderColor: string;
  icon: string;
  probability: number; // percentage weight
  compatibleArtElements: ElementType[];
  talents: {
    atkBonusPercent: number;
    defBonusPercent: number;
    hpBonusPercent: number;
    mpBonusPercent: number;
    speedBonus: number;
    critRateBonus: number;
    breakthroughBonus: number;
  };
  passiveEffect: {
    name: string;
    description: string;
    trigger: string;
  };
  initialElements: {
    kim: number;
    moc: number;
    thuy: number;
    hoa: number;
    tho: number;
  };
}

// ============================================================================
// BẢNG CẤU HÌNH LINH CĂN ROGUELITE — PHÀM TRẦN TIÊN LỘ
// Nhóm Cơ Bản (70%): Kim, Mộc, Thủy, Hỏa, Thổ (14% mỗi loại)
// Nhóm Đặc Biệt (25%): Lôi (8.5%), Phong (8.5%), Băng (8%)
// Nhóm Dị Thường / Hiếm (5%): Quang (2.5%), Ám (2.5%)
// ============================================================================
export const SPIRITUAL_ROOTS: Record<string, SpiritualRootConfig> = {
  kim: {
    id: 'kim',
    name: 'Canh Kim Chân Linh Căn',
    type: 'kim',
    grade: 'co_ban',
    description: 'Bẩm sinh hàm chứa Canh Kim sát khí sắc bén vô song, vạn vật đều có thể trảm phá. Kiếm ý thông linh, công kích mang theo hiệu ứng xuyên giáp.',
    lore: 'Ngươi sinh ra đã có kiếm cốt bẩm sinh, huyết khí sắc bén như mũi bảo kiếm vừa xuất vỏ, thích hợp tu tập tuyệt thế kiếm đạo.',
    color: '#facc15',
    badgeBg: 'bg-amber-950/60 text-amber-300 border-amber-600/50',
    borderColor: '#f59e0b',
    icon: '⚔️',
    probability: 14,
    compatibleArtElements: ['kim', 'ngu_hanh'],
    talents: {
      atkBonusPercent: 0.15,
      defBonusPercent: 0.05,
      hpBonusPercent: 0.05,
      mpBonusPercent: 0.08,
      speedBonus: 10,
      critRateBonus: 0.08,
      breakthroughBonus: 0.04,
    },
    passiveEffect: {
      name: 'Canh Kim Sát Khí',
      description: 'Mọi đòn đánh thường và kiếm pháp bỏ qua 20% phòng ngự của mục tiêu, tăng 8% tỷ lệ Bạo Kích.',
      trigger: 'armor_penetration',
    },
    initialElements: { kim: 92, moc: 25, thuy: 30, hoa: 20, tho: 35 },
  },

  moc: {
    id: 'moc',
    name: 'Ất Mộc Trường Sinh Linh Căn',
    type: 'moc',
    grade: 'co_ban',
    description: 'Thanh mộc sinh sôi không dứt, sinh mệnh lực dồi dào tựa thần thụ ngàn năm. Khí huyết liên tục tự lành, kháng độc và sở hữu mộc trói khống chế.',
    lore: 'Hơi thở mang theo hương cỏ cây linh mộc, sinh cơ bừng bừng, vĩnh viễn không sợ hao kiệt khí huyết bình cảnh.',
    color: '#22c55e',
    badgeBg: 'bg-emerald-950/60 text-emerald-300 border-emerald-600/50',
    borderColor: '#10b981',
    icon: '🌿',
    probability: 14,
    compatibleArtElements: ['moc', 'ngu_hanh'],
    talents: {
      atkBonusPercent: 0.06,
      defBonusPercent: 0.08,
      hpBonusPercent: 0.25,
      mpBonusPercent: 0.15,
      speedBonus: 5,
      critRateBonus: 0.03,
      breakthroughBonus: 0.06,
    },
    passiveEffect: {
      name: 'Ất Mộc Tự Diệu',
      description: 'Mỗi 3 giây tự động hồi phục 2% Khí Huyết tối đa, miễn nhiễm hoàn toàn với các trạng thái trúng độc thông thường.',
      trigger: 'hp_regen_poison_immune',
    },
    initialElements: { kim: 20, moc: 95, thuy: 40, hoa: 25, tho: 30 },
  },

  thuy: {
    id: 'thuy',
    name: 'Huyền Thủy Băng Phách Linh Căn',
    type: 'thuy',
    grade: 'co_ban',
    description: 'Thủy lưu nhu hòa vô hình nhưng có thể bào mòn vạn vật. Hải lượng linh lực mênh mông, công pháp kèm theo hiệu ứng làm chậm và suy yếu đối thủ.',
    lore: 'Tâm cảnh phẳng lặng như mặt hồ ngàn năm không gợn sóng, đan điền linh hải bao la gấp rưỡi tu sĩ đồng giai.',
    color: '#38bdf8',
    badgeBg: 'bg-sky-950/60 text-sky-300 border-sky-600/50',
    borderColor: '#0284c7',
    icon: '💧',
    probability: 14,
    compatibleArtElements: ['thuy', 'ngu_hanh'],
    talents: {
      atkBonusPercent: 0.08,
      defBonusPercent: 0.10,
      hpBonusPercent: 0.12,
      mpBonusPercent: 0.35,
      speedBonus: 5,
      critRateBonus: 0.04,
      breakthroughBonus: 0.05,
    },
    passiveEffect: {
      name: 'Huyền Thủy Lưu Thấu',
      description: 'Linh Lực tối đa tăng 35%, mọi đòn đánh làm giảm 25% tốc độ di chuyển của kẻ địch trong 2 giây.',
      trigger: 'slow_on_hit',
    },
    initialElements: { kim: 30, moc: 35, thuy: 94, hoa: 15, tho: 25 },
  },

  hoa: {
    id: 'hoa',
    name: 'Thuần Dương Chân Hỏa Linh Căn',
    type: 'hoa',
    grade: 'co_ban',
    description: 'Liệt hỏa phần thiên cương mãnh bá đạo! Linh lực sôi trào như dung nham hỏa diệm, uy lực bộc phát tức thời và sát thương bạo kích chí mạng.',
    lore: 'Trong đan điền ẩn chứa một mồi lửa Thuần Dương thiên địa sơ khai, đòn đánh như sóng nhiệt thiêu rụi tà ma.',
    color: '#ef4444',
    badgeBg: 'bg-rose-950/60 text-rose-300 border-rose-600/50',
    borderColor: '#dc2626',
    icon: '🔥',
    probability: 14,
    compatibleArtElements: ['hoa', 'ngu_hanh'],
    talents: {
      atkBonusPercent: 0.22,
      defBonusPercent: 0.02,
      hpBonusPercent: 0.06,
      mpBonusPercent: 0.18,
      speedBonus: 10,
      critRateBonus: 0.12,
      breakthroughBonus: 0.03,
    },
    passiveEffect: {
      name: 'Liệt Diễm Thiêu Đốt',
      description: 'Đòn đánh thường và pháp thuật gây hiệu ứng Thiêu Đốt trong 3 giây (gây sát thương hỏa tương đương 20% Công Kích mỗi giây).',
      trigger: 'burn_dot',
    },
    initialElements: { kim: 25, moc: 20, thuy: 15, hoa: 96, tho: 25 },
  },

  tho: {
    id: 'tho',
    name: 'Huyền Hoàng Hậu Thổ Linh Căn',
    type: 'tho',
    grade: 'co_ban',
    description: 'Dày dặn trầm ổn tựa đại địa non sông. Thể chất kim cương bất hoại, lực phòng ngự cùng thể phách cực thịnh, miễn dịch chấn thương bình cảnh.',
    lore: 'Ngươi đứng trên mặt đất liền như núi cao cắm rễ, không một luồng kình lực nào có thể làm lung lay đạo cơ.',
    color: '#ca8a04',
    badgeBg: 'bg-yellow-950/60 text-yellow-300 border-yellow-600/50',
    borderColor: '#a16207',
    icon: '🛡️',
    probability: 14,
    compatibleArtElements: ['tho', 'ngu_hanh'],
    talents: {
      atkBonusPercent: 0.08,
      defBonusPercent: 0.30,
      hpBonusPercent: 0.25,
      mpBonusPercent: 0.05,
      speedBonus: 0,
      critRateBonus: 0.02,
      breakthroughBonus: 0.08,
    },
    passiveEffect: {
      name: 'Hậu Thổ Bất Hoại',
      description: 'Phòng ngự tăng 30%, khi Khí Huyết xuống dưới 40% tự động nhận Thạch Thuẫn hấp thu 150 điểm sát thương (hồi chiêu 30s).',
      trigger: 'low_hp_earth_shield',
    },
    initialElements: { kim: 30, moc: 25, thuy: 20, hoa: 20, tho: 95 },
  },

  loi: {
    id: 'loi',
    name: 'Cửu Tiêu Thiên Lôi Linh Căn',
    type: 'loi',
    grade: 'dac_biet',
    description: 'Dị biến lôi đình cực hiếm trong thiên địa! Chưởng quản thiên kiếp thần phạt, tốc độ ra đòn cuồng bạo, sát thương mang theo điện giật làm tê liệt mục tiêu.',
    lore: 'Sinh ra trong đêm bão sấm chín tầng trời nộ hống, trong mạch máu có tử điện lưu chuyển, là khắc tinh của vạn loại tà ma yêu ma.',
    color: '#c084fc',
    badgeBg: 'bg-purple-950/60 text-purple-300 border-purple-600/50',
    borderColor: '#9333ea',
    icon: '⚡',
    probability: 8.5,
    compatibleArtElements: ['loi', 'kim', 'ngu_hanh'],
    talents: {
      atkBonusPercent: 0.20,
      defBonusPercent: 0.05,
      hpBonusPercent: 0.08,
      mpBonusPercent: 0.20,
      speedBonus: 25,
      critRateBonus: 0.10,
      breakthroughBonus: 0.05,
    },
    passiveEffect: {
      name: 'Tử Điện Tê Liệt',
      description: 'Tốc độ di chuyển tăng 25 điểm. Mọi kỹ năng có 25% tỷ lệ giáng tia lôi phạt phụ gây tê liệt (choáng 0.5s) đối thủ.',
      trigger: 'lightning_stun_chance',
    },
    initialElements: { kim: 65, moc: 20, thuy: 35, hoa: 60, tho: 20 },
  },

  phong: {
    id: 'phong',
    name: 'Thần Phong Thiên Vũ Linh Căn',
    type: 'loi', // mapped to agile
    grade: 'dac_biet',
    description: 'Hóa thân của phong chi linh khí! Thân pháp quỷ mị như gió thoảng, né tránh kinh người, lướt tàn ảnh liên tục không tiêu hao nhiều linh lực.',
    lore: 'Đạp gió mà đi, vạn trượng hồng trần không dính một hạt bụi, kiếm chiêu như cơn lốc cuốn phăng vạn địch.',
    color: '#2dd4bf',
    badgeBg: 'bg-teal-950/60 text-teal-300 border-teal-600/50',
    borderColor: '#0d9488',
    icon: '🌪️',
    probability: 8.5,
    compatibleArtElements: ['kim', 'moc', 'ngu_hanh'],
    talents: {
      atkBonusPercent: 0.12,
      defBonusPercent: 0.04,
      hpBonusPercent: 0.08,
      mpBonusPercent: 0.15,
      speedBonus: 35,
      critRateBonus: 0.07,
      breakthroughBonus: 0.06,
    },
    passiveEffect: {
      name: 'Linh Phong Ảo Bộ',
      description: 'Thời gian hồi Thần Hành Huyễn Ảnh (Lướt) giảm 40%, tăng 15% tỷ lệ hoàn toàn né tránh sát thương đòn đánh.',
      trigger: 'dodge_buff',
    },
    initialElements: { kim: 55, moc: 50, thuy: 30, hoa: 20, tho: 15 },
  },

  bang: {
    id: 'bang',
    name: 'Cực Hàn Băng Phách Linh Căn',
    type: 'thuy',
    grade: 'dac_biet',
    description: 'Dị biến cực hạn từ Thủy linh căn nơi bắc minh cực hải! Hàn khí thấu xương có thể đóng băng kinh mạch đối thủ, tạo khiên sương giá bảo hộ bản thể.',
    lore: 'Một giọt sương mai ngưng đọng ngàn năm thành băng phách, chạm vào vật gì vật ấy lập tức đóng băng hóa tuyết.',
    color: '#67e8f9',
    badgeBg: 'bg-cyan-950/60 text-cyan-300 border-cyan-600/50',
    borderColor: '#0891b2',
    icon: '❄️',
    probability: 8,
    compatibleArtElements: ['thuy', 'ngu_hanh'],
    talents: {
      atkBonusPercent: 0.14,
      defBonusPercent: 0.15,
      hpBonusPercent: 0.10,
      mpBonusPercent: 0.25,
      speedBonus: 10,
      critRateBonus: 0.06,
      breakthroughBonus: 0.06,
    },
    passiveEffect: {
      name: 'Băng Giáp Tỏa Hàn',
      description: 'Kẻ địch tấn công bạn sẽ bị phản phệ giảm 35% tốc độ đánh và tốc độ chạy trong 2.5 giây. Đòn đánh có 15% tỷ lệ Đóng Băng hoàn toàn.',
      trigger: 'freeze_reaction',
    },
    initialElements: { kim: 40, moc: 20, thuy: 98, hoa: 5, tho: 30 },
  },

  quang: {
    id: 'quang',
    name: 'Hạo Nhiên Thái Vi Quang Linh Căn',
    type: 'ngu_hanh',
    grade: 'hiem',
    description: 'Chí tôn Quang hệ dị linh căn vạn năm khó gặp! Hạo nhiên chính khí thanh tẩy vạn tà, khí tức thần thánh tăng gấp đôi hiệu quả của mọi loại đan dược.',
    lore: 'Tương truyền chỉ có tiên nhân chuyển thế mới mang theo Tiên Thiên Quang Căn, bước đi sinh sen vàng, tà ma cách trăm dặm tự tan biến.',
    color: '#fef08a',
    badgeBg: 'bg-yellow-900/60 text-yellow-200 border-yellow-400/60',
    borderColor: '#facc15',
    icon: '✨',
    probability: 2.5,
    compatibleArtElements: ['kim', 'moc', 'thuy', 'hoa', 'tho', 'loi', 'ngu_hanh'],
    talents: {
      atkBonusPercent: 0.18,
      defBonusPercent: 0.15,
      hpBonusPercent: 0.20,
      mpBonusPercent: 0.30,
      speedBonus: 20,
      critRateBonus: 0.08,
      breakthroughBonus: 0.12,
    },
    passiveEffect: {
      name: 'Thánh Quang Hộ Thể',
      description: 'Miễn dịch mọi trạng thái Tẩu Hỏa Nhập Ma và Suy Thoái. Tăng 12% tỷ lệ Đột Phá cảnh giới và tương dung với tất cả các hệ công pháp!',
      trigger: 'all_element_affinity',
    },
    initialElements: { kim: 80, moc: 80, thuy: 80, hoa: 80, tho: 80 },
  },

  am: {
    id: 'am',
    name: 'Cửu U Minh Ngục Ám Linh Căn',
    type: 'ngu_hanh',
    grade: 'hiem',
    description: 'Ám dạ chi vương, xuất thân từ Cực U chi địa! Sát thương chí mạng tột bậc khi kẻ địch dưới 30% máu, đòn đánh để lại Vết Hằn Hư Vô trảm sát tức thì.',
    lore: 'Bẩm sinh sở hữu con mắt u minh nhìn thấu tử huyệt của sinh linh, ra tay đoạt mệnh vô thanh vô tức.',
    color: '#a855f7',
    badgeBg: 'bg-zinc-950 text-purple-300 border-purple-500/60',
    borderColor: '#7e22ce',
    icon: '🌑',
    probability: 2.5,
    compatibleArtElements: ['kim', 'hoa', 'loi', 'ngu_hanh'],
    talents: {
      atkBonusPercent: 0.28,
      defBonusPercent: 0.02,
      hpBonusPercent: 0.05,
      mpBonusPercent: 0.20,
      speedBonus: 20,
      critRateBonus: 0.15,
      breakthroughBonus: 0.05,
    },
    passiveEffect: {
      name: 'U Minh Trảm Sát',
      description: 'Gây thêm 40% sát thương lên kẻ địch dưới 35% Khí Huyết. Tăng 15% tỷ lệ Bạo Kích và hồi 10 MP khi hạ gục một mục tiêu.',
      trigger: 'execute_damage',
    },
    initialElements: { kim: 75, moc: 15, thuy: 50, hoa: 70, tho: 20 },
  },
};

/**
 * Gieo xúc xắc ngẫu nhiên linh căn khi BẮT ĐẦU MỘT LƯỢT CHƠI MỚI (New Roguelite Run)
 * Tuân thủ đúng bảng xác suất cấu hình:
 * Cơ bản: 70% | Đặc biệt: 25% | Hiếm: 5%
 */
export function rollRandomSpiritualRoot(): SpiritualRoot {
  const roll = Math.random() * 100;
  let cumulative = 0;

  const rootList = Object.values(SPIRITUAL_ROOTS);
  for (const root of rootList) {
    cumulative += root.probability;
    if (roll <= cumulative) {
      return {
        name: root.name,
        type: root.type,
        purity: root.grade === 'hiem' ? 95 : root.grade === 'dac_biet' ? 82 : 70,
        description: root.description,
        elements: { ...root.initialElements },
      };
    }
  }

  // Fallback an toàn
  const fallback = SPIRITUAL_ROOTS.kim;
  return {
    name: fallback.name,
    type: fallback.type,
    purity: 75,
    description: fallback.description,
    elements: { ...fallback.initialElements },
  };
}

/**
 * Tìm cấu hình chi tiết theo tên hoặc type của Linh Căn
 */
export function getSpiritualRootConfig(root: SpiritualRoot | undefined | null): SpiritualRootConfig {
  if (!root) return SPIRITUAL_ROOTS.kim;
  
  // Match by name first
  for (const key in SPIRITUAL_ROOTS) {
    const cfg = SPIRITUAL_ROOTS[key];
    if (cfg.name === root.name || cfg.id === key) {
      return cfg;
    }
  }

  // Match by element type
  for (const key in SPIRITUAL_ROOTS) {
    const cfg = SPIRITUAL_ROOTS[key];
    if (cfg.type === root.type) {
      return cfg;
    }
  }

  return SPIRITUAL_ROOTS.kim;
}

/**
 * KIỂM TRA TÍNH TƯƠNG THÍCH LINH CĂN & CÔNG PHÁP / KỸ NĂNG (Core Gameplay Rule)
 * @returns { compatible: boolean; reason: string }
 */
export function checkArtCompatibility(
  playerRoot: SpiritualRoot | undefined | null,
  artElement: ElementType
): { compatible: boolean; reason: string } {
  if (!playerRoot) {
    return { compatible: true, reason: 'Chưa phát hiện linh căn' };
  }

  const rootConfig = getSpiritualRootConfig(playerRoot);

  // Cổ Ngũ Hành hoặc Quang Linh Căn tương thích vạn pháp
  if (rootConfig.id === 'quang' || rootConfig.type === 'ngu_hanh' || playerRoot.name.includes('Ngũ Hành')) {
    return {
      compatible: true,
      reason: `${rootConfig.name} có khả năng dung nạp vạn pháp, tương thích hoàn toàn!`,
    };
  }

  // Công pháp thuộc tính Ngu Hanh có thể tu luyện bởi mọi linh căn
  if (artElement === 'ngu_hanh') {
    return {
      compatible: true,
      reason: 'Công pháp thuộc tính Ngũ Hành hỗn nguyên, thích hợp mọi linh căn.',
    };
  }

  // Kiểm tra danh sách compatibleArtElements
  const isCompatible = rootConfig.compatibleArtElements.includes(artElement);

  if (isCompatible) {
    return {
      compatible: true,
      reason: `${rootConfig.name} tương dung tuyệt hảo với công pháp hệ [${artElement.toUpperCase()}].`,
    };
  }

  return {
    compatible: false,
    reason: `Linh căn của đạo hữu là [${rootConfig.name}], tương khắc hoặc không thể vận chuyển công pháp hệ [${artElement.toUpperCase()}]! Có thể đem bán lấy Linh Thạch hoặc đổi bí tịch tương thích.`,
  };
}
