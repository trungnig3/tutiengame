import { RealmInfo } from '../types/game';

export interface TribulationWave {
  waveIndex: number;
  totalStrikes: number;
  strikeDelayMs: number;
  damagePerStrike: number;
  areaRadius: number;
  warningDurationMs: number;
  description: string;
}

export interface InnerDemonChallenge {
  id: string;
  title: string;
  subtitle: string;
  demonName: string;
  loreIntro: string;
  dialogueChoices: {
    id: string;
    text: string;
    description: string;
    outcomeType: 'combat' | 'enlightenment' | 'sacrifice' | 'temptation';
    karmaChange: number;
    demonHpMultiplier: number;
    bonusSuccessRate: number;
    loreOutcome: string;
  }[];
  baseDemonHp: number;
  baseDemonAtk: number;
  baseDemonDef: number;
}

export interface TribulationConfig {
  realmId: string;
  name: string;
  cloudsColor: string;
  lightningColor: string;
  totalWaves: number;
  waves: TribulationWave[];
  innerDemon?: InnerDemonChallenge;
}

export const INNER_DEMONS: Record<string, InnerDemonChallenge> = {
  demon_thanh_khe_memory: {
    id: 'demon_thanh_khe_memory',
    title: 'Hồi Ức Thanh Khê Thôn',
    subtitle: 'Ảo Cảnh Cố Hương & Phàm Trần Trói Buộc',
    demonName: 'Tâm Ma Thần Niệm (Bản Ngã Phàm Trần)',
    loreIntro: 'Trong sương mù lôi kiếp hỗn độn, ngươi đột nhiên thấy lại Thanh Khê thôn năm xưa. Người thân, phụ mẫu đã khuất, cùng những mái nhà tranh êm ấm hiện ra trước mắt. Một giọng nói thầm thì bên tai: "Đạo hữu, tu tiên cô độc ngàn năm, nghịch thiên làm chi để chịu thống khổ lôi kiếp? Hãy ở lại đây vui hưởng trăm năm phàm trần..."',
    dialogueChoices: [
      {
        id: 'choice_firm_dao',
        text: 'Kiên Định Đạo Tâm: "Phàm trần đã qua, nghịch thiên tu đạo mới là chí hướng đời ta!"',
        description: 'Tăng Đạo Tâm, giảm 25% sát thương lôi kiếp và tiêu trừ tâm ma bằng tu vi thuần khiết.',
        outcomeType: 'enlightenment',
        karmaChange: 15,
        demonHpMultiplier: 0.75,
        bonusSuccessRate: 0.15,
        loreOutcome: 'Đạo tâm ngươi trong sáng như ngọc! Ảo ảnh phàm trần vỡ tan thành từng mảnh linh quang bao bọc kinh mạch!',
      },
      {
        id: 'choice_fight_demon',
        text: 'Rút Kiếm Trảm Ảo Ảnh: "Dám mượn hình bóng người thân mê hoặc ta, nếm thử nhất kiếm này!"',
        description: 'Chiến đấu trực tiếp với bản sao Tâm Ma bằng kiếm khí để rèn giũa đạo tâm.',
        outcomeType: 'combat',
        karmaChange: 5,
        demonHpMultiplier: 1.0,
        bonusSuccessRate: 0.1,
        loreOutcome: 'Kiếm ý tung hoành xé rách sương mù ảo cảnh, đối mặt với bản ngã tâm ma trong trận quyết đấu sinh tử!',
      },
      {
        id: 'choice_use_talisman',
        text: 'Kích Hoạt Thanh Tâm Phù / Dùng Đạo Lực Bình Tâm: Ôm trọn ký ức nhưng không để bị lung lạc.',
        description: 'Hóa giải oán niệm một cách tường hòa, đạt được ngộ tính thâm sâu.',
        outcomeType: 'sacrifice',
        karmaChange: 10,
        demonHpMultiplier: 0.6,
        bonusSuccessRate: 0.2,
        loreOutcome: 'Ngươi nhắm mắt tịnh tâm, để ký ức thanh khê thôn hòa vào luồng sinh cơ đan điền, đúc thành nền móng đạo cơ vững chãi!',
      },
      {
        id: 'choice_doubt_temptation',
        text: 'Do Dự Đạo Ý: Dao động trước viễn cảnh phàm trần bình yên, sinh ra sơ hở.',
        description: 'Bị tâm ma phản phệ, tăng sức mạnh của ảo ảnh.',
        outcomeType: 'temptation',
        karmaChange: -10,
        demonHpMultiplier: 1.35,
        bonusSuccessRate: -0.1,
        loreOutcome: 'Tâm ma nhân lúc ngươi sơ hở gầm thét xông tới, ma khí nhuộm đen đan điền!',
      },
    ],
    baseDemonHp: 1800,
    baseDemonAtk: 45,
    baseDemonDef: 25,
  },

  demon_dao_heart_doubt: {
    id: 'demon_dao_heart_doubt',
    title: 'Huyết Sát Vấn Tâm',
    subtitle: 'Nghi Hoặc Con Đường Nghịch Thiên',
    demonName: 'Huyết Ảnh Oán Ma (Nghiệp Chướng Bát Hoang)',
    loreIntro: 'Huyết sát ngút trời! Vô số yêu thú cùng tà tu từng ngã xuống dưới kiếm ngươi hiện lên từ vực thẳm máu. Chúng kêu gào đòi mạng: "Ngươi một đường chém giết đoạt cơ duyên, tự xưng tu sĩ chính đạo, có khác chi ma đầu chúng ta?!"',
    dialogueChoices: [
      {
        id: 'choice_firm_justice',
        text: 'Đạo Tâm Như Thiết: "Trảm yêu trừ ma, bảo vệ đạo thống, không thẹn với lòng!"',
        description: 'Vận chuyển lôi quang kim sắc quét sạch oán khí.',
        outcomeType: 'enlightenment',
        karmaChange: 20,
        demonHpMultiplier: 0.7,
        bonusSuccessRate: 0.2,
        loreOutcome: 'Đạo quang chói lòa làm tan chảy huyết ảnh, tăng mạnh ý chí chiến đấu!',
      },
      {
        id: 'choice_slay_all',
        text: 'Bá Đạo Nghịch Thiên: "Kẻ cản đường ta tu tiên trường sinh, thần ma đều trảm!"',
        description: 'Bộc phát sát ý ngút trời đè bẹp oán linh.',
        outcomeType: 'combat',
        karmaChange: -5,
        demonHpMultiplier: 0.9,
        bonusSuccessRate: 0.15,
        loreOutcome: 'Khí thế áp đảo nuốt chửng oán ma, kiếm ý trở nên sắc bén và lạnh lùng!',
      },
    ],
    baseDemonHp: 5500,
    baseDemonAtk: 120,
    baseDemonDef: 60,
  },

  demon_clone_power: {
    id: 'demon_clone_power',
    title: 'Bản Sao Cực Hạn Hắc Ám',
    subtitle: 'Chiến Thắng Chính Bản Thân Mình',
    demonName: 'Ma Hóa Bản Thể (Ám Ảnh Tu La)',
    loreIntro: 'Từ trong kiếp vân, một bóng người bước ra giống hệt ngươi về trang phục, vũ khí và công pháp, nhưng đôi mắt đỏ ngầu ma khí: "Ta chính là sức mạnh tối thượng mà ngươi kìm nén! Hãy giao thân xác này cho ta, ta sẽ đưa ngươi bước lên đỉnh phong Tiên Giới ngay tức khắc!"',
    dialogueChoices: [
      {
        id: 'choice_overcome_self',
        text: 'Vượt Qua Bản Thân: "Ngươi chỉ là tạp niệm dục vọng, ta mới là chân chủ của thân thể này!"',
        description: 'Lĩnh ngộ đại đạo chân ngã, giảm 30% sức mạnh bản sao.',
        outcomeType: 'enlightenment',
        karmaChange: 25,
        demonHpMultiplier: 0.7,
        bonusSuccessRate: 0.25,
        loreOutcome: 'Chân ngôn xuất khẩu, kim quang vạn trượng chấn áp ma khí bản thể!',
      },
      {
        id: 'choice_duel_clone',
        text: 'Quyết Chiến Định Càn Khôn: "Được lắm, xem thử bản sao ngươi mạnh đến mức nào!"',
        description: 'Đối đầu trực diện trong trận thư hùng kinh thiên động địa.',
        outcomeType: 'combat',
        karmaChange: 10,
        demonHpMultiplier: 1.0,
        bonusSuccessRate: 0.15,
        loreOutcome: 'Hai luồng linh lực va chạm long trời lở đất xé toạc kiếp vân!',
      },
    ],
    baseDemonHp: 12000,
    baseDemonAtk: 240,
    baseDemonDef: 120,
  },
};

export function getTribulationConfig(realm: RealmInfo): TribulationConfig {
  const isTrucCo = realm.id === 'luyen_khi_13';
  const isKimDan = realm.id === 'truc_co_vien_man';
  const isNguyenAnh = realm.id === 'kim_dan_vien_man';

  if (isTrucCo) {
    return {
      realmId: realm.id,
      name: 'Tam Trọng Thiên Kiếp · Khởi Đầu Đạo Cơ',
      cloudsColor: 'rgba(30, 27, 75, 0.9)',
      lightningColor: '#60a5fa',
      totalWaves: 3,
      waves: [
        {
          waveIndex: 1,
          totalStrikes: 5,
          strikeDelayMs: 1400,
          damagePerStrike: Math.round((realm.tribulationDamage || 450) * 0.22),
          areaRadius: 55,
          warningDurationMs: 1200,
          description: 'Đợt 1: Sơ Lôi Quét Kinh Mạch (5 đòn sét lẻ tẻ)',
        },
        {
          waveIndex: 2,
          totalStrikes: 7,
          strikeDelayMs: 1100,
          damagePerStrike: Math.round((realm.tribulationDamage || 450) * 0.28),
          areaRadius: 65,
          warningDurationMs: 1000,
          description: 'Đợt 2: Tử Tiêu Lôi Võng liên hoàn (7 lôi cầu rải rác)',
        },
        {
          waveIndex: 3,
          totalStrikes: 8,
          strikeDelayMs: 900,
          damagePerStrike: Math.round((realm.tribulationDamage || 450) * 0.35),
          areaRadius: 75,
          warningDurationMs: 850,
          description: 'Đợt 3: Đỉnh Phong Tiên Thiên Lôi Đình cuộn trào',
        },
      ],
      innerDemon: INNER_DEMONS.demon_thanh_khe_memory,
    };
  }

  if (isKimDan) {
    return {
      realmId: realm.id,
      name: 'Lục Trọng Tử Tiêu Lôi Kiếp · Kim Đan Đại Đạo',
      cloudsColor: 'rgba(49, 10, 80, 0.95)',
      lightningColor: '#c084fc',
      totalWaves: 4,
      waves: [
        {
          waveIndex: 1,
          totalStrikes: 6,
          strikeDelayMs: 1200,
          damagePerStrike: Math.round((realm.tribulationDamage || 1600) * 0.18),
          areaRadius: 70,
          warningDurationMs: 1100,
          description: 'Đợt 1: Tử Tiêu Khai Mạch',
        },
        {
          waveIndex: 2,
          totalStrikes: 8,
          strikeDelayMs: 1000,
          damagePerStrike: Math.round((realm.tribulationDamage || 1600) * 0.24),
          areaRadius: 80,
          warningDurationMs: 950,
          description: 'Đợt 2: Ngũ Lôi Hóa Huyết',
        },
        {
          waveIndex: 3,
          totalStrikes: 10,
          strikeDelayMs: 850,
          damagePerStrike: Math.round((realm.tribulationDamage || 1600) * 0.28),
          areaRadius: 85,
          warningDurationMs: 800,
          description: 'Đợt 3: Huyền Lôi Phong Ma',
        },
        {
          waveIndex: 4,
          totalStrikes: 12,
          strikeDelayMs: 700,
          damagePerStrike: Math.round((realm.tribulationDamage || 1600) * 0.32),
          areaRadius: 95,
          warningDurationMs: 750,
          description: 'Đợt 4: Cực Hạn Đan Hỏa Lôi Đình',
        },
      ],
      innerDemon: INNER_DEMONS.demon_dao_heart_doubt,
    };
  }

  // Default / Higher realms: Cửu Cửu Thiên Kiếp
  return {
    realmId: realm.id,
    name: 'Cửu Trọng Hỗn Độn Kiếp · Phá Cảnh Khảo Nghiệm',
    cloudsColor: 'rgba(67, 10, 10, 0.95)',
    lightningColor: '#f87171',
    totalWaves: 4,
    waves: [
      {
        waveIndex: 1,
        totalStrikes: 8,
        strikeDelayMs: 1000,
        damagePerStrike: Math.round((realm.tribulationDamage || 6500) * 0.18),
        areaRadius: 80,
        warningDurationMs: 1000,
        description: 'Đợt 1: Xích Tiêu Phá Hồn',
      },
      {
        waveIndex: 2,
        totalStrikes: 10,
        strikeDelayMs: 850,
        damagePerStrike: Math.round((realm.tribulationDamage || 6500) * 0.22),
        areaRadius: 90,
        warningDurationMs: 850,
        description: 'Đợt 2: Cửu Thiên Diệt Tuyệt',
      },
      {
        waveIndex: 3,
        totalStrikes: 12,
        strikeDelayMs: 750,
        damagePerStrike: Math.round((realm.tribulationDamage || 6500) * 0.28),
        areaRadius: 100,
        warningDurationMs: 750,
        description: 'Đợt 3: Hỗn Độn Lôi Ngục',
      },
      {
        waveIndex: 4,
        totalStrikes: 14,
        strikeDelayMs: 650,
        damagePerStrike: Math.round((realm.tribulationDamage || 6500) * 0.32),
        areaRadius: 110,
        warningDurationMs: 700,
        description: 'Đợt 4: Hủy Thiên Diệt Địa Lôi Kiếp',
      },
    ],
    innerDemon: INNER_DEMONS.demon_clone_power,
  };
}
