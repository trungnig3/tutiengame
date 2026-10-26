export interface BossLoreEntry {
  id: string;
  name: string;
  title: string;
  realmName: string;
  location: string;
  mapId: string;
  avatarIcon: string;
  description: string;
  signatureDrops: string[];
}

export interface ClueLoreEntry {
  id: string;
  name: string;
  chapter: number;
  location: string;
  discoveredItemOrStele: string;
  textSnippet: string;
  significance: string;
}

export interface EndingLoreEntry {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  moralChoice: string;
  icon: string;
}

export const BOSS_COLLECTION: BossLoreEntry[] = [
  {
    id: 'boss_heo_rung',
    name: 'Sơn Trư Hung Hãn (Tinh Anh)',
    title: 'Hắc Sơn Hung Trư',
    realmName: 'Luyện Khí Tầng 4',
    location: 'Rừng Linh Vụ',
    mapId: 'map_linh_vu',
    avatarIcon: '🐗',
    description: 'Loài dã thú hấp thụ linh khí mỏng manh ở bìa rừng hóa thành yêu, da dày như sắt đá, ủi đổ cây cổ thụ.',
    signatureDrops: ['yeu_dan_tinh_anh', 'thiet_khoang', 'kim_sang_dan'],
  },
  {
    id: 'boss_thanh_phong_cu_mang',
    name: 'Thanh Phong Cự Mãng',
    title: 'Thanh Phong Độc Xà Vương (Lĩnh Chủ)',
    realmName: 'Luyện Khí Tầng 7 (Lĩnh Chủ)',
    location: 'Thanh Phong Sơn & Cổ Thạch Động',
    mapId: 'map_thanh_phong_son',
    avatarIcon: '🐍',
    description: 'Xà vương nghìn năm tu luyện dưới động đá vôi, nọc độc xanh thẫm có thể làm tan chảy huyền thiết.',
    signatureDrops: ['thanh_moc_xa_dam', 'yeu_dan_tinh_anh', 'thanh_phong_thao'],
  },
  {
    id: 'boss_hac_huyet_vien_vuong',
    name: 'Hắc Huyết Viên Vương',
    title: 'Động Phủ Thủ Hộ Ma Thú (Lĩnh Chủ)',
    realmName: 'Trúc Cơ Sơ Kỳ (Lĩnh Chủ)',
    location: 'Hắc Phong Động Phủ Bí Cảnh',
    mapId: 'map_hac_phong_bi_canh',
    avatarIcon: '🦍',
    description: 'Lĩnh chủ thượng cổ vượn ma có huyết mạch viễn cổ cuồng bạo, mỗi bước chân làm rung chuyển cả sơn động.',
    signatureDrops: ['hac_huyet_vien_vuong_dan', 'truc_co_dan', 'huyet_tinh_chi', 'bi_tich_hac_phong_kiem'],
  },
  {
    id: 'boss_ma_linh_hat_vuong',
    name: 'Ma Linh Hạt Vương',
    title: 'Thượng Cổ Độc Vương (Lĩnh Chủ)',
    realmName: 'Trúc Cơ Hậu Kỳ (Lĩnh Chủ)',
    location: 'Cổ Di Tích Bí Cảnh',
    mapId: 'map_ancient_ruins',
    avatarIcon: '🦂',
    description: 'Bò cạp khổng lồ ẩn nấp dưới cát lún phong ấn thượng cổ, chiếc đuôi độc chọc thủng mọi kim chung hộ thể.',
    signatureDrops: ['chu_qua', 'yeu_dan_linh_chu', 'thien_linh_thao', 'truc_co_dan'],
  },
  {
    id: 'boss_co_thi_ma_ton',
    name: 'Cổ Thi Ma Tôn (Thượng Cổ)',
    title: 'Vạn Cổ Đạo Ma Hoàng (Tối Cao)',
    realmName: 'Kim Đan Sơ Kỳ (Tối Cao)',
    location: 'Đại Trận Tâm Điểm Cổ Di Tích',
    mapId: 'map_ancient_ruins',
    avatarIcon: '☠️',
    description: 'Xác ướp của ma hoàng từ trận chiến viễn cổ bị linh mạch dị biến đánh thức, mang trong mình sức mạnh ngũ hành hủy diệt.',
    signatureDrops: ['co_khuyet_kiem', 'bi_tich_co_ngu_hanh', 'pha_canh_dan', 'cuu_u_minh_thiet'],
  },
];

export const CLUES_COLLECTION: ClueLoreEntry[] = [
  {
    id: 'clue_thanh_khe_stream',
    name: 'Mảnh Cổ Ngũ Hành Ngọc Đồng',
    chapter: 1,
    location: 'Đáy Suối Thanh Khê',
    discoveredItemOrStele: 'co_ngoc_dong',
    textSnippet: 'Mảnh ngọc đồng cổ xưa tỏa ra ánh sáng ngũ sắc dịu nhẹ, phát ra tần số cộng hưởng với linh căn ngũ hành trong cơ thể...',
    significance: 'Vật báu khởi đầu giúp Lâm Mặc cảm ứng linh khí tàn tích và các bí cảnh bị lãng quên.',
  },
  {
    id: 'clue_hac_phong_stele',
    name: 'Kiếm Ngân Bia Đá Vạn Cổ',
    chapter: 2,
    location: 'Hắc Phong Sơn Cổ Đạo',
    discoveredItemOrStele: 'res_bp_stele_1',
    textSnippet: 'Vết chém sắc lẹm trên thạch bi hé lộ: Thượng nhân Hắc Phong từng phong ấn một cổ trận ma đạo nhằm ngăn chặn linh mạch sụp đổ...',
    significance: 'Gợi mở nguyên do Hắc Phong Môn và các thế lực tranh đoạt tàn tích không hẳn chỉ vì lòng tham.',
  },
  {
    id: 'clue_mat_tang_hap',
    name: 'Cổ Ngọc Dị Thư',
    chapter: 3,
    location: 'Mật Tàng Hạp Động Phủ',
    discoveredItemOrStele: 'co_ngoc_di_thu',
    textSnippet: 'Từng có một thời đại linh khí dồi dào, các tiên nhân đã dùng Ngũ Hành Trấn Thế Đỉnh để neo giữ linh mạch địa cầu...',
    significance: 'Linh mạch thế giới hiện tại đang suy kiệt nghiêm trọng, nếu không khôi phục cổ trận thì toàn giới sẽ trở thành phàm địa.',
  },
  {
    id: 'clue_huyet_te_cam_che',
    name: 'Cấm Chế Huyết Tế Trận',
    chapter: 4,
    location: 'Huyết Trì Bí Cảnh',
    discoveredItemOrStele: 'res_bp_altar_1',
    textSnippet: 'Cấm chế ma đạo dùng huyết khí yêu thú để vá lại vết nứt cấm địa, nhưng phương pháp tàn độc này lại sinh ra tâm ma...',
    significance: 'Lựa chọn dùng chính đạo thuần hậu hay ma đạo tốc thành để giải quyết thảm họa thiên địa.',
  },
  {
    id: 'clue_co_khuyet_di_trach',
    name: 'Ký Ức Thượng Cổ Ngũ Hành Quyết',
    chapter: 5,
    location: 'Thượng Cổ Tiên Phủ',
    discoveredItemOrStele: 'co_khuyet_kiem',
    textSnippet: 'Thanh kiếm tàn khuyết hòa cùng linh lực cổ ngọc truyền vào tâm trí: Đạo trời bất nhân, phàm nhân nghịch mệnh mới là chân đạo!',
    significance: 'Mở ra chìa khóa tối cao đạt tới đại viên mãn và quyết định số phận giới tu tiên.',
  },
];

export const ENDINGS_COLLECTION: EndingLoreEntry[] = [
  {
    id: 'ending_nghich_menh',
    title: 'KẾT THÚC: NGHỊCH MỆNH PHÁ THIÊN',
    subtitle: 'Tự Lập Đạo Thống – Bất Tuân Thiên Quy',
    description: 'Lâm Mặc không trao lại cổ ngọc cho tông môn, cũng không hiến tế theo ma đạo. Chàng dùng ngũ hành hỗn độn phá vỡ gông cùm đại trận, giải phóng linh khí tự do cho toàn thể chúng sinh và dấn thân vào con đường độc bộ nghìn thu.',
    moralChoice: 'Dũng cảm phá vỡ trật tự mục nát, mở ra kỷ nguyên mới.',
    icon: '⚡',
  },
  {
    id: 'ending_thu_ho',
    title: 'KẾT THÚC: THỦ HỘ CHÚNG SINH',
    subtitle: 'Trọng An Bách Tính – Giữ Trọn Sơ Tâm',
    description: 'Lâm Mặc hợp lực cùng Thanh Vân Tiên Tông kích hoạt đại trận phong ấn ma khí, gia cố linh mạch bảo vệ Thanh Khê Thôn và giới phàm nhân bình yên qua cơn đại kiếp. Chàng trở thành vị trưởng lão hộ quốc được muôn người kính ngưỡng.',
    moralChoice: 'Hy sinh tham vọng cá nhân vì sự bình an của đại chúng.',
    icon: '🛡️',
  },
  {
    id: 'ending_truy_cau',
    title: 'KẾT THÚC: CHÂN LÝ CHI ĐẠO',
    subtitle: 'Phi Thăng Thượng Giới – Tầm Đạo Vô Cương',
    description: 'Thấu hiểu bí ẩn vạn vật, Lâm Mặc ngộ ra giới này chỉ là một hạt cát giữa hư không vũ trụ. Chàng dẫn động cửu thiên lôi kiếp, phá toái hư không phi thăng thượng giới để tìm kiếm cội nguồn tối sơ của Tiên đạo.',
    moralChoice: 'Truy cầu cảnh giới tối cao vượt khỏi hồng trần thế tục.',
    icon: '🌌',
  },
];
