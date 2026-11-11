# BÁO CÁO KHOẢNG CÁCH TÀI NGUYÊN ĐỒ HỌA (ASSET_GAP_REPORT.md)
# DỰ ÁN: PHÀM TRẦN TIÊN LỘ (PREMIUM PIXEL ART ROADMAP)

---

## 1. TỔNG QUAN HIỆN TRẠNG & KHOẢNG CÁCH NGHỆ THUẬT (ARTISTIC GAP ANALYSIS)

### 1.1 Hiện trạng của dự án (Current State)
- Trò chơi đang vận hành một hệ thống gameplay ARPG tiên hiệp có chiều sâu cốt truyện và cơ chế chiến đấu phong phú (hệ thống tu vi, đột phá cảnh giới, linh căn, lướt né, combo kiếm chiêu, chiến trường tông môn).
- **Tuy nhiên, toàn bộ đồ họa trong game hiện tại đang dựa trên mã lệnh vẽ hình học Canvas 2D (Procedural Primitives)**:
  - Nhân vật chính (Lâm Mặc) và NPCs được ghép bằng các khối elip, hình chữ nhật và đường cong vector trong `src/engine/proceduralRenderer.ts` và `src/engine/pixelArtEngine.ts`.
  - Quái vật và Boss được vẽ bằng các mảng màu tô đơn sơ.
  - Công trình nhà cửa, cây cối, địa hình bản đồ được sinh ngẫu nhiên từ thuật toán toán học.
  - 25 tệp hình ảnh PNG hiện lưu trong `public/assets/aistudio/` thực chất là các ảnh chụp màn hình lịch sử phát triển (lỗi lệnh PowerShell, tài liệu Capacitor, giao diện hosting Vercel) chứ không phải tài nguyên đồ họa của trò chơi.
  - Dự án **HOÀN TOÀN CHƯA CÓ BẤT KỲ FILE ẢNH SPRITE SHEET HOẶC TILESET PIXEL ART THẬT NÀO** trong thư mục mã nguồn.

### 1.2 Khoảng cách so với Mục tiêu Thương mại (Target Gap)
- **Mục tiêu**: Nâng tầm sản phẩm thành một tựa game thương mại hoàn chỉnh với định hướng **Premium HD Pixel Art – Chinese Xianxia Action RPG**, tương đương với các tuyệt tác nghệ thuật pixel indie hàng đầu thế giới (như *Chained Echoes*, *Children of Morta*, *Moonlighter*).
- **Khoảng cách cần vượt qua**:
  1. Thay thế $100\%$ các lệnh vẽ procedural tạm thời bằng các Sprite Sheets PNG sắc nét chuẩn Nearest Neighbor.
  2. Xây dựng bộ hoạt ảnh hoàn chỉnh cho nhân vật chính (10 animations), yêu thú thường (5 animations/loài), và Boss (7 animations).
  3. Xây dựng bộ Tileset mặt đất, bờ suối, vách đá $32 \times 32\text{px}$ có chiều sâu và khả năng ghép ô tự nhiên (Autotiling).
  4. Nâng cấp hệ thống hiệu ứng kiếm khí ngũ hành và vòng ma pháp trận từ các nét vẽ vòng tròn thành các sprite VFX đầy uy lực.
  5. Thiết lập hệ thống nạp và vẽ Sprite Sheet mượt mà trên Canvas 2D mà không làm thay đổi hay phá vỡ gameplay, logic va chạm, damage balance hay hệ thống lưu trữ hiện hữu.

---

## 2. BẢNG TỔNG KẾT SỐ LIỆU TÀI NGUYÊN (ASSET METRICS SUMMARY)

| Chỉ số Thống kê | Số lượng | Tỷ lệ % | Đánh giá |
|---|---|---|---|
| **Tổng số asset hình ảnh hiện có trong repo** | **31 tệp** | $100\%$ | Bao gồm 25 file screenshot lịch sử + 6 icon hệ thống/PWA |
| **Tổng số asset có thể tái sử dụng (Reusable)** | **6 tệp** | $19.4\%$ | Các file icon web, PWA manifest và logo nền tảng |
| **Tổng số asset không thể dùng trong game (Unused)** | **25 tệp** | $80.6\%$ | Toàn bộ ảnh chụp màn hình trong `public/assets/aistudio/` |
| **Tổng số asset CẦN TẠO MỚI (Assets to Produce)** | **58 nhóm tài nguyên** | $100\%$ | Toàn bộ Sprite Sheets, Tilesets, Props, VFX, UI Pixel Art |

---

## 3. PHÂN RÃ CHI TIẾT DANH MỤC CẦN SẢN XUẤT MỚI (NEW ASSET PRODUCTION BREAKDOWN)

### 3.1 Nhóm Nhân vật & Yêu Thú (Entity Sprite Sheets) - 10 Nhóm
1. **Lâm Mặc (Player)**: 1 Sprite Sheet lớn chứa 10 hoạt ảnh $\times$ 3 hướng (Down, Up, Side) $= 58$ frames hoạt ảnh $64 \times 64\text{px}$.
2. **Thanh Khê Dã Lang (Sói rừng)**: 1 Sprite Sheet gồm 5 hoạt ảnh $\times$ 2 hướng $= 24$ frames $48 \times 48\text{px}$.
3. **Thiết Bì Dã Trư (Heo rừng)**: 1 Sprite Sheet gồm 5 hoạt ảnh $\times$ 2 hướng $= 24$ frames $64 \times 48\text{px}$.
4. **Hắc Sát Ma Đồ (Tà tu)**: 1 Sprite Sheet gồm 5 hoạt ảnh $\times$ 2 hướng $= 24$ frames $48 \times 64\text{px}$.
5. **Bạch Mao Viên Hầu (Boss)**: 1 Sprite Sheet kích thước lớn gồm 7 hoạt ảnh $\times$ 2 hướng $= 54$ frames $128 \times 128\text{px}$.
6. **Lý Đức (Trưởng Thôn)**: 1 Sprite Sheet Idle & Nói chuyện $= 6$ frames $48 \times 64\text{px}$.
7. **Mạc Lão (Tán Tu Đại Năng)**: 1 Sprite Sheet Idle & Tụ khí $= 6$ frames $48 \times 64\text{px}$.
8. **Chưởng Môn Thanh Vân Tông**: 1 Sprite Sheet uy nghiêm $= 6$ frames $48 \times 64\text{px}$.
9. **Đan Sư & Rèn Sư**: 2 Sprite Sheets chuyên môn $= 12$ frames $48 \times 64\text{px}$.
10. **Thương Nhân Phường Thị**: 1 Sprite Sheet giao thương $= 6$ frames $48 \times 64\text{px}$.

### 3.2 Nhóm Địa hình & Môi trường (Tilesets & Environmental Props) - 16 Nhóm
1. **Nền Đất & Bờ Sỏi Thanh Khê**: Bộ Tileset $32 \times 32\text{px}$ gồm 16 tiles chuyển tiếp.
2. **Thảm Cỏ & Linh Thảo**: Bộ Tileset 8 biến thể khóm cỏ tự nhiên.
3. **Mặt Nước Suối Trong Suốt**: Bộ Tileset nước động 4 frames looping kèm gờ bờ suối.
4. **Đá Lát Quảng Trường Thanh Vân Tông**: Bộ Tileset đá hoa cương cổ $32 \times 32\text{px}$.
5. **Nham Thạch Núi Lửa Hắc Phong Sơn**: Bộ Tileset đá nứt nẻ có mạch dung nham.
6. **Thanh Khê Đình (Nhà Cổ Thôn Dã)**: 1 Sprite tổ hợp $128 \times 128\text{px}$ tách lớp mái ngói và thân tường.
7. **Đại Điện Môn Phái**: 1 Sprite kiến trúc đồ sộ $256 \times 224\text{px}$.
8. **Cổ Tùng Thụ (Cây Lớn)**: 1 Sprite cây cổ thụ $128 \times 160\text{px}$ tách lớp tán lá và gốc cây.
9. **Trúc Linh Mộc (Cây Nhỏ)**: 1 Sprite cụm trúc $32 \times 96\text{px}$.
10. **Cầu Gỗ Cổ**: 1 Sprite cầu ván gỗ $96 \times 64\text{px}$ có bóng đổ mặt nước.
11. **Tảng Đá Cắt Gọt (Chiseled Rock)**: 3 biến thể tảng đá đa giác có tinh thể phát quang.
12. **Lồng Đèn Đỏ Cổ Phong**: 1 Sprite lồng đèn động 4 frames kèm vòng tỏa sáng.
13. **Ngộ Đạo Cổ Bi (Bia Đá Cổ)**: 1 Sprite bia đá khắc văn tự phát quang màu lam.
14. **Bát Quái Trận Đài**: 1 Sprite trận đài đá hình bát giác $160 \times 160\text{px}$.
15. **Hồ Lô Linh Dược & Đan Đỉnh**: 2 Sprites đan đỉnh luyện dược và hồ lô.
16. **Bụi Cỏ Thu Hoạch (Ngưng Huyết Thảo, Địa Hoàng Tinh)**: 4 Sprites thảo dược nhấp nhô.

### 3.3 Nhóm Hiệu Ứng Kỹ Năng & Chiến Đấu (Combat VFX) - 12 Nhóm
1. **Thanh Phong Kiếm Khí Trảm**: Vệt kiếm hình trăng khuyết gió 4 frames.
2. **Hỏa Diễm Kiếm Trảm**: Vệt chém bùng lửa rực rỡ 5 frames.
3. **Lôi Đình Nhất Kích**: Tia sét zigzag đánh từ trên xuống 4 frames.
4. **Băng Phách Kiếm Khí**: Vệt kiếm sương băng kèm vụn tinh thể 4 frames.
5. **Điểm Va Chạm Kim Khí (Impact Sparks)**: Đốm sáng lóe 3 frames khi đánh trúng mục tiêu.
6. **Đốm Bạo Kích (Critical Hit Stars)**: Ngôi sao hoàng kim 4 cánh lóe sáng cực đại.
7. **Tàn Ảnh Lướt Né (Dash Ghosts)**: Vệt mờ linh hoạt của thân pháp.
8. **Bát Quái Trận Đồ (Magic Circle)**: Vòng trận bát quái xoay tròn 8 frames.
9. **Linh Khí Hộ Thể Hào Quang (Cultivator Aura)**: Hào quang dạng sóng cuộn 6 frames.
10. **Sóng Xung Kích Gầm Thét (Shockwave)**: Vòng tròn sóng chấn động khi Boss dập đất.
11. **Lốc Xoáy Phi Kiếm (Flying Sword Swarm)**: 4 thanh phi kiếm xoay quanh cơ thể.
12. **Yêu Khí Tử Vong**: Khói đen ma đạo bốc lên khi yêu thú tan biến.

### 3.4 Nhóm Giao Diện Pixel (Pixel Art UI Kit) - 20 Nhóm
1. **Khung Panel Giấy Da Cổ (9-Slice Parchment)**.
2. **Khung Panel Viền Ngọc Bích (9-Slice Jade Border)**.
3. **Khung Hộp Thoại NPC Vân Mây**.
4. **Khung Thanh Máu (HP Bar Frame) & Thanh Linh Lực (MP Bar Frame)**.
5. **Nút Bấm Cổ Phong (Button Normal / Hover / Pressed)**.
6. **Bộ 15 Icons Vật Phẩm & Bí Tịch ($32 \times 32\text{px}$)**: Linh thạch các cấp, Hồi huyết đan, Tụ khí đan, Trúc cơ đan, Phi kiếm, Phù lục, Bí kíp công pháp.

---

## 4. NHỮNG ASSET QUAN TRỌNG NHẤT CẦN ƯU TIÊN (CRITICAL PATH ASSETS)

Nhằm đảm bảo dự án tiến triển chắc chắn và có ngay phân cảnh nghiệm thu trực quan, nhóm tài nguyên sau đây được xếp vào diện **BẮT BUỘC ƯU TIÊN SỐ 1**:

1. **Gói Thử Nghiệm Sandbox (Phục vụ `PIXEL_ART_TEST_PLAN.md`)**:
   - `player_cultivator_lam_mac` (Nhân vật chính Lâm Mặc).
   - `enemy_spirit_wolf`, `enemy_iron_boar`, `enemy_dark_cultist` (3 quái vật đại diện).
   - `boss_white_ape` (Boss Bạch Mao Viên Hầu).
   - `npc_elder_ly_duc` (Trưởng Thôn Lý Đức).
   - `building_thanh_khe_dinh` & `bridge_rustic_wood` (Nhà thôn và cầu gỗ).
   - `tree_ancient_pine` & `tree_bamboo_stalk` (Cây lớn và cây nhỏ).
   - `tileset_thanh_khe_ground` & `animated_water_stream` (Nền đất và mặt nước).
   - `vfx_sword_slash_wind`, `vfx_fire_arc`, `vfx_lightning_strike` (3 hiệu ứng chiến đấu cơ bản).

---

## 5. ĐỀ XUẤT THỨ TỰ TÍCH HỢP VÀO GAME (STAGED INTEGRATION ROADMAP)

```
[GIAI ĐOẠN 1: PIXEL ART SANDBOX SCENE]
  │  - Nạp ASSET_MANIFEST.json vào Canvas 2D engine.
  │  - Tạo bản đồ thử nghiệm cô lập (Test Scene) chứa đầy đủ 14 thực thể nòng cốt.
  │  - Kiểm chứng 100% tiêu chí thị giác, Depth Sorting và đo 60 FPS trên Android.
  │  - Trình duyệt và nghiệm thu trực tiếp cùng Game Director.
  ▼
[GIAI ĐOẠN 2: CHUYỂN ĐỔI COMBAT & NHÂN VẬT CHÍNH (PLAYER & ENEMIES)]
  │  - Tích hợp Sprite Sheet của Lâm Mặc vào màn chơi thật (GameCanvas.tsx).
  │  - Thay thế hitbox vẽ vector của 3 loài quái vật và Boss bằng Sprite Sheet PNG.
  │  - Kích hoạt toàn bộ VFX kiếm khí, lửa, sét và hiệu ứng va chạm chính thức.
  ▼
[GIAI ĐOẠN 3: TILESET HÓA TOÀN BỘ BẢN ĐỒ THANH KHÊ THÔN & RỪNG TRÚC]
  │  - Thay thế nền vẽ bằng mã bezier cũ bằng bộ Tileset đất, suối nước, cầu gỗ.
  │  - Đặt công trình Thanh Khê Đình và các cây Cổ Tùng Thụ thật vào bản đồ thế giới.
  ▼
[GIAI ĐOẠN 4: MỞ RỘNG CÁC VÙNG ĐẤT CÒN LẠI (SECT, VOLCANO, RUINS)]
  │  - Sản xuất và tích hợp Tileset cho: Thanh Vân Tông, Hắc Phong Sơn, Cổ Di Tích.
  │  - Bổ sung toàn bộ các NPCs còn lại (Mạc Lão, Chưởng Môn, Đan Sư...).
  ▼
[GIAI ĐOẠN 5: TỔNG THỂ GIAO DIỆN PIXEL ART (FULL PIXEL UI OVERHAUL)]
     - Thay thế toàn bộ khung modal, thanh máu, nút bấm và icons vật phẩm sang chuẩn 9-slice Pixel Art.
```

---

## 6. LỜI KẾT & CAM KẾT KỸ THUẬT

- Bản báo cáo này xác lập lộ trình rõ ràng, minh bạch và an toàn $100\%$ cho cấu trúc kỹ thuật của trò chơi.
- Chúng tôi tuân thủ nghiêm ngặt nguyên tắc: **Không bắt đầu thay thế đồ họa trong trò chơi cho đến khi bộ tiêu chuẩn và kế hoạch này được Người Dùng phê duyệt chính thức.**
