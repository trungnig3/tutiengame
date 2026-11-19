# ASSET INVENTORY – KIỂM KÊ & PHÂN LOẠI TÀI NGUYÊN ĐỒ HỌA
# DỰ ÁN: PHÀM TRẦN TIÊN LỘ (PHÁM NHÂN TU TIÊN ARPG)

---

## 1. TỔNG QUAN KIỂM TOÁN TÀI NGUYÊN

Cuộc kiểm toán này rà soát toàn diện:
- Thư mục tài nguyên tĩnh: `public/assets/` và `public/`.
- Thư mục đồng bộ ứng dụng di động: `android/app/src/main/assets/public/`.
- Các mô-đun vẽ đồ họa thủ công bằng mã lập trình hiện hữu trong `src/engine/proceduralRenderer.ts` và `src/engine/pixelArtEngine.ts`.

> **Nguyên tắc thực thi**: Không xóa bất kỳ file nào trong hệ thống; không can thiệp vào gameplay hay mã nguồn runtime ở giai đoạn này.

---

## 2. BẢNG KIỂM KÊ CHI TIẾT TÀI NGUYÊN TĨNH HIỆN CÓ TRONG REPOSITORY

### 2.1 Nhóm 25 tệp hình ảnh tại `public/assets/aistudio/`
Tất cả 25 tệp PNG này là ảnh chụp màn hình lịch sử phát triển (lỗi PowerShell, trang quản trị Vercel, tài liệu Capacitor, tạo PWA manifest, và ảnh chụp màn hình game giai đoạn prototype):

| Tên Tệp (Filename) | Kích thước Pixel | Dung lượng | Nội dung thực tế | Phân loại |
|---|---|---|---|---|
| `image_102a7aeb.png` | $880 \times 800$ | 95.7 KB | Ảnh chụp hộp thoại tạo PWA Web Manifest | **Unused Assets** |
| `image_26e1a7d5.png` | $1912 \times 1076$ | 120.0 KB | Ảnh chụp màn hình trình duyệt Vercel New Project | **Unused Assets** |
| `image_2f98b764.png` | $1917 \times 1078$ | 174.8 KB | Ảnh chụp giao diện trình duyệt thiết lập hosting | **Unused Assets** |
| `image_49969c5e.png` | $1080 \times 2400$ | 412.3 KB | Ảnh chụp màn hình Android dọc hiển thị trang web | **Unused Assets** |
| `image_4a935f94.png` | $1917 \times 1077$ | 158.5 KB | Ảnh chụp màn hình tài liệu hướng dẫn kỹ thuật | **Unused Assets** |
| `image_67b0a0e5.png` | $1917 \times 1078$ | 506.6 KB | Ảnh chụp màn hình trang chủ Capacitor by Ionic | **Unused Assets** |
| `image_690ba7ff.png` | $1080 \times 2400$ | 286.1 KB | Ảnh chụp màn hình điện thoại kiểm tra PWA | **Unused Assets** |
| `image_76bd8a48.png` | $1606 \times 357$ | 26.5 KB | Ảnh chụp banner cảnh báo PWA Service Worker | **Unused Assets** |
| `image_8cbdeaae.png` | $1911 \times 1078$ | 157.5 KB | Ảnh chụp màn hình hướng dẫn cấu hình Android | **Unused Assets** |
| `image_93ce45b5.png` | $1917 \times 1078$ | 300.3 KB | Ảnh chụp màn hình bảng điều khiển xây dựng | **Unused Assets** |
| `image_985cc44b.png` | $1915 \times 1078$ | 187.8 KB | Ảnh chụp màn hình giao diện hệ thống | **Unused Assets** |
| `image_a34d228c.png` | $1917 \times 1078$ | 245.3 KB | Ảnh chụp màn hình trình duyệt Vercel build log | **Unused Assets** |
| `image_a9578895.png` | $1907 \times 1078$ | 174.8 KB | Ảnh chụp màn hình cấu hình dự án Git | **Unused Assets** |
| `image_ad9af3d2.png` | $1502 \times 777$ | 59.8 KB | Ảnh chụp lỗi Windows PowerShell `'vite' is not recognized` | **Unused Assets** |
| `image_b7e38c73.png` | $1917 \times 1078$ | 105.5 KB | Ảnh chụp màn hình hướng dẫn cài đặt môi trường | **Unused Assets** |
| `image_c6532469.png` | $1917 \times 1078$ | 187.9 KB | Ảnh chụp màn hình kiểm tra giao diện | **Unused Assets** |
| `image_d654a78a.png` | $1901 \times 1078$ | 297.7 KB | Ảnh chụp màn hình giao diện web app | **Unused Assets** |
| `image_df159bed.png` | $1917 \times 1078$ | 631.0 KB | Ảnh chụp màn hình hướng dẫn Capacitor CLI | **Unused Assets** |
| `image_e6111ae2.png` | $1916 \times 1078$ | 115.4 KB | Ảnh chụp màn hình bảng thông số kỹ thuật | **Unused Assets** |
| `image_e82002be.png` | $1080 \times 2400$ | 149.7 KB | Ảnh chụp màn hình điện thoại chạy ứng dụng | **Unused Assets** |
| `image_e8c60a25.png` | $1917 \times 1078$ | 191.7 KB | Ảnh chụp màn hình quy trình triển khai | **Unused Assets** |
| `image_eeb1180a.png` | $1917 \times 1078$ | 114.4 KB | Ảnh chụp màn hình thiết lập cổng mạng | **Unused Assets** |
| `image_f0d29b5d.png` | $1890 \times 1075$ | 194.5 KB | Ảnh chụp màn hình bảng cấu hình Vercel domain | **Unused Assets** |
| `image_f8585a69.png` | $397 \times 782$ | 337.6 KB | Ảnh chụp màn hình gameplay mobile (chứng minh nhân vật & nhà là khối hình procedural) | **Unused Assets / Audit Evidence** |
| `image_fbba049c.png` | $1917 \times 1078$ | 175.0 KB | Ảnh chụp màn hình bảng thông tin dự án | **Unused Assets** |

### 2.2 Nhóm biểu tượng và đồ họa hệ thống tại `public/`
| Tên Tệp | Định dạng | Nội dung | Phân loại |
|---|---|---|---|
| `favicon.png` | PNG | Icon tab trình duyệt (chữ Tiên thư pháp) | **Existing Usable Assets** |
| `icon.svg` | SVG | Vector logo Phàm Trần Tiên Lộ | **Existing Usable Assets** |
| `pwa-192x192.png` | PNG ($192 \times 192$) | Icon ứng dụng Android kích thước nhỏ | **Existing Usable Assets (Cần update pixel art sau)** |
| `pwa-512x512.png` | PNG ($512 \times 512$) | Icon ứng dụng Android Splash/Store | **Existing Usable Assets (Cần update pixel art sau)** |
| `pwa-maskable-512x512.png`| PNG ($512 \times 512$) | Icon thích ứng khung tròn/vuông Android | **Existing Usable Assets** |
| `apple-touch-icon.png` | PNG ($180 \times 180$) | Icon lưu trang màn hình chính iOS | **Existing Usable Assets** |

---

## 3. PHÂN LOẠI TOÀN DIỆN (ASSET CLASSIFICATION MATRIX)

### 3.1 Existing Usable Assets (Tài nguyên hiện có có thể tái sử dụng ngay)
- `public/favicon.png`: Sử dụng làm favicon mặc định.
- `public/icon.svg`: Sử dụng làm huy hiệu vector nguồn.
- `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/pwa-maskable-512x512.png`, `public/apple-touch-icon.png`: Sử dụng cho cấu hình PWA và icon ứng dụng Capacitor native.

### 3.2 Existing Assets Requiring Modification (Tài nguyên cần chỉnh sửa)
- Các hàm sinh pixel art theo thuật toán trong `src/engine/pixelArtEngine.ts`: Hiện tại mã nguồn này chứa định nghĩa vẽ pixel procedural bằng canvas commands (`rasterizeToPixelSprite`). Có thể tận dụng logic giải phẫu màu sắc và layout của nó để xuất bản thành các file ảnh PNG Sprite Sheet độc lập chất lượng cao.
- Bộ icon PWA hiện tại: Đang là đồ họa vector/chữ thư pháp vàng, cần được nâng cấp thành huy hiệu Pixel Art đồng bộ với nhận diện thương hiệu mới.

### 3.3 Missing Assets (Tài nguyên còn thiếu hoàn toàn trong trò chơi)
Hiện tại dự án **hoàn toàn chưa có các file ảnh PNG Sprite Sheet thương mại** cho các đối tượng gameplay sau:
1. **Sprite Sheet Nhân Vật Chính (Player Lâm Mặc)**:
   - Thiếu toàn bộ file ảnh PNG cho 10 trạng thái: Idle, Walk, Run, Attack 1, Attack 2, Attack 3, Dodge, Skill, Hit, Death theo 4 hướng.
2. **Sprite Sheet Yêu Thú & Ma Đồ (Regular Enemies)**:
   - Thiếu file ảnh PNG cho: Thanh Khê Dã Lang (Sói rừng), Thiết Bì Dã Trư (Heo rừng giáp đá), Hắc Sát Ma Đồ (Tà tu ma giáo).
3. **Sprite Sheet Boss (Bạch Mao Viên Hầu)**:
   - Thiếu file ảnh PNG kích thước lớn ($128 \times 128\text{px}$) gồm: Idle, Walk, Charge lướt sấm sét, Attack dập đất, Gầm thét cuồng bạo, Choáng, Bị tiêu diệt.
4. **Sprite Sheet Nhân Vật Phụ (NPCs)**:
   - Thiếu file ảnh PNG cho: Trưởng Thôn Lý Đức, Mạc Lão, Chưởng Môn, Đan Sư, Rèn Sư, Thương Nhân.
5. **Tileset Môi Trường (Environment Tilesets)**:
   - Thiếu bộ Tileset ô vuông $32 \times 32\text{px}$ chuẩn (Ground, Path, Grass, Cliff, Wall).
   - Thiếu bộ hoạt ảnh mặt nước suối trong có sóng gợn và bèo hoa súng ($32 \times 32\text{px}$ animated water).
6. **Công Trình & Cây Cối Tiên Hiệp (Environment Props)**:
   - Thiếu file ảnh PNG cho: Cổ Tùng Thụ (Cây lớn), Trúc Linh Mộc (Cây nhỏ), Thanh Khê Đình (Nhà thôn mái ngói cong), Cầu Gỗ (Bridge), Lồng Đèn Đỏ treo hiên (Lantern), Phiến Đá Tinh Thể (Chiseled Rock).
7. **Hiệu Ứng Chiến Đấu Pixel (Combat VFX)**:
   - Thiếu file ảnh PNG cho: Vệt kiếm khí chém (Sword Slash), Vết chém lửa (Fire Arc), Tia sét gãy góc (Lightning Bolt), Vòng tròn Bát Quái ma pháp trận (Eight Trigrams Magic Circle), Hào quang chân khí (Cultivator Aura), Tia tóe lửa va chạm (Impact Sparks).
8. **Bộ Giao Diện Pixel (Pixel Art UI Kit)**:
   - Thiếu bộ khung viền 9-slice vân mây cổ điển cho hộp thoại và hành trang.
   - Thiếu bộ icon vật phẩm Pixel Art $24 \times 24\text{px}$ và $32 \times 32\text{px}$ (Hồi Huyết Đan, Tụ Khí Đan, Huyền Thiết Kiếm, Ngưng Huyết Thảo, Linh Thạch).

### 3.4 Duplicate Assets (Tài nguyên trùng lặp)
- Toàn bộ 25 file trong thư mục `public/assets/aistudio/` được sao chép nguyên trạng sang `android/app/src/main/assets/public/assets/aistudio/` thông qua lệnh đồng bộ của Capacitor (`npx cap copy android`). Sự trùng lặp này làm dung lượng file APK phình to thêm $\approx 5.4\text{MB}$ không cần thiết.

### 3.5 Unused Assets (Tài nguyên không được gameplay sử dụng)
- Toàn bộ 25 tệp hình ảnh tại `public/assets/aistudio/*.png`: Không có bất kỳ dòng lệnh nào trong `GameCanvas.tsx`, `proceduralRenderer.ts` hay các modals gọi đến các ảnh này. Chúng là tư liệu ảnh chụp màn hình từ các lượt tương tác trước.

### 3.6 Assets Requiring Replacement (Tài nguyên cần thay thế bắt buộc)
- **Toàn bộ hệ thống đồ họa Canvas Code hiện tại**:
  - Các hàm vẽ hình elip, hình chữ nhật và đường cong bezier trong `src/engine/proceduralRenderer.ts` và `src/components/GameCanvas.tsx` cần được thay thế triệt để bằng cơ chế nạp và hiển thị Sprite Sheets PNG chính thống theo đúng quy chuẩn Art Bible đã ban hành.

---

## 4. TỔNG KẾT BẢNG SỐ LIỆU

| Phân Loại | Số lượng Tệp / Mục | Đánh giá & Hướng xử lý |
|---|---|---|
| **Existing Usable Assets** | 6 tệp (Icons hệ thống/PWA) | Tiếp tục duy trì, cập nhật dần sang pixel art |
| **Existing Requiring Modification** | 2 mô-đun mã nguồn (`pixelArtEngine`, `proceduralRenderer`) | Trích xuất tư liệu thiết kế sang PNG Sprite Sheets |
| **Missing Assets (Cần tạo mới)** | 8 nhóm lớn ($\approx 52$ sprite sheets & tilesets) | **Ưu tiên số 1: Cần sản xuất theo chuẩn Art Bible** |
| **Duplicate Assets** | 25 tệp (trong thư mục android assets) | Giữ nguyên theo quy tắc an toàn, dọn dẹp sau khi release |
| **Unused Assets** | 25 tệp (ảnh chụp lịch sử) | Giữ nguyên theo yêu cầu không xóa tài nguyên |
| **Assets Requiring Replacement** | 100% hình ảnh gameplay hiện tại | Thay thế theo lộ trình được phê duyệt |

---

## 5. TÀI NGUYÊN ĐÃ HOÀN THÀNH THEO PHASE (PHASE 2.0 / 2.1 / 2.2 STATUS)

### 5.3 Phase 2.2 – Boss Bạch Mao Viên Hầu (白毛猿猴) (Completed)
- **Thư mục Boss Sprite Sheets**: `public/assets/pixel-art/bosses/bach_mao_vien_hau/`
  - `idle.png` ($768 \times 512$, 6 frames $\times$ 4 hướng, 6 FPS)
  - `walk.png` ($1024 \times 512$, 8 frames $\times$ 4 hướng, 8 FPS)
  - `run.png` ($1024 \times 512$, 8 frames $\times$ 4 hướng, 12 FPS)
  - `attack_1.png` ($896 \times 512$, 7 frames $\times$ 4 hướng, 12 FPS – Thiết Chưởng)
  - `attack_2.png` ($1024 \times 512$, 8 frames $\times$ 4 hướng, 14 FPS – Cuồng Nộ Liên Kích)
  - `attack_3.png` ($1024 \times 512$, 8 frames $\times$ 4 hướng, 14 FPS – Cuồng Bạo Xung Kích)
  - `skill.png` ($1280 \times 512$, 10 frames $\times$ 4 hướng, 10 FPS – Bạch Viên Chấn Địa)
  - `hit.png` ($512 \times 512$, 4 frames $\times$ 4 hướng, 10 FPS)
  - `death.png` ($1280 \times 512$, 10 frames $\times$ 4 hướng, 8 FPS, holdLastFrame)
  - `preview.png`, `metadata.json`
- **Thư mục Boss VFX Sprite Sheets**: `public/assets/pixel-art/vfx/bach_mao_vien_hau/`
  - `vfx_chuong_kich.png` ($768 \times 128$, 6f @ $128 \times 128$, 16 FPS)
  - `vfx_dia_chan.png` ($960 \times 160$, 6f @ $160 \times 160$, 14 FPS)
  - `vfx_yeu_khi_tu_luc.png` ($768 \times 128$, 6f @ $128 \times 128$, 12 FPS)
  - `vfx_bach_vien_chan_dia.png` ($1280 \times 160$, 8f @ $160 \times 160$, 14 FPS)
  - `vfx_cuong_no.png` ($768 \times 128$, 6f @ $128 \times 128$, 10 FPS, loop Phase 2 Enrage)
  - `vfx_boss_death.png` ($1024 \times 128$, 8f @ $128 \times 128$, 10 FPS)

### 5.4 Phase 2.3 – Environment Pixel Art (Completed)
- **Thư mục Tileset**: `public/assets/pixel-art/environment/tilesets/`
  - `ground_tiles.png` ($256 \times 256$, lưới $8 \times 8$ ô $32 \times 32\text{px}$: cỏ Thanh Khê, cỏ rừng Linh Vụ, cỏ khô Hắc Phong, đất, lối mòn, đá lát, đá rêu, cát, đá huyền vũ, di tích cổ, quảng trường Bích Ngọc, cầu gỗ, bậc đá, vách núi)
  - `transition_tiles.png` ($512 \times 192$, lưới $16 \times 6$ ô $32 \times 32\text{px}$, 4-bit autotile mask `N=1, E=2, S=4, W=8` cho 6 lớp chuyển tiếp `grass_dirt`, `grass_stone`, `dirt_stone`, `grass_water`, `water_rock`, `ground_cliff`)
  - `animated_water_tiles.png` ($256 \times 128$, 4 frame/hàng @ 6 FPS: suối trong, nước nông, nước sâu, đầm Hắc Sơn, thác đổ, bọt tung, lá sen nở, huyết đàm)
- **Thư mục Vật thể Môi trường**: `public/assets/pixel-art/environment/objects/`
  - `flora_sheet.png` ($512 \times 320$): Cổ Tùng Thụ (`ancient_tree`), Thông Xanh (`pine_tree`), Linh Thụ (`spirit_tree`), Khóm Trúc (`bamboo_cluster`), Cổ Mộc Khô (`dark_dead_tree`), 3 bụi cây, 4 khóm cỏ, 4 hoa dại, 3 nấm linh chi, rễ cây
  - `rocks_nature_sheet.png` ($384 \times 192$): đá nhỏ, tảng đá, đá rêu, đá tinh thể lam, xương yêu thú (`beast_bones`), mỏm đá lớn/tối, cột đá, cột đổ nát
  - `architecture_props.png` ($640 \times 352$): Nhà Thôn (`village_house`), Đình Các (`pavilion_hall`), Đại Điện Tông Môn (`sect_grand_hall`), Miếu Nhỏ (`small_shrine`), Tường Di Tích/Tông Môn, Cổng Gỗ, Cầu Gỗ (`wooden_bridge`), Bia Đá Cổ, Tượng Thạch Thú, Cờ Tông Môn, Đèn Đá & Lồng Đèn Đỏ (4-frame animated), Hàng rào, Bàn đá, Cột gỗ, Bậc thềm đá
  - `resources_sheet.png` ($192 \times 64$): Linh Thảo, Quặng Huyền Thiết, Bảo Rương, Bia Đá Đạo Vận, Tế Đàn Cổ
- **Metadata & Showcase**: `public/assets/pixel-art/environment/metadata.json`, `preview_showcase.png` ($1080 \times 660$)
- **Tài nguyên cũ giữ nguyên không xóa (`Unused / Sandbox Only`)**: 8 tệp trong `public/assets/pixel/environment/` giữ nguyên vẹn cho `PixelArtSandbox.tsx`, không đưa vào gameplay chính của Phase 2.3.
