# BÁO CÁO NGHIỆM THU PHASE 2.1 – NORMAL MONSTER SYSTEM
# DỰ ÁN: PHÀM TRẦN TIÊN LỘ (凡尘仙路)

**Repository**: `trungnig3/tutiengame`  
**Nhánh**: `audit/android-performance`  
**Phạm vi**: Phase 2.1 – Tích hợp đồ họa Premium HD Pixel Art cho 3 quái vật thường (**Dã Lang**, **Dã Trư**, **Ma Đồ**)  
**Trạng thái**: **HOÀN TẤT PHASE 2.1 (CHƯA CHUYỂN PHASE 2.2)**

---

## 1. TỔNG QUAN THIẾT KẾ 3 QUÁI VẬT THƯỜNG

| Quái Vật | Tên Hán Tự | `shape` Mapping | Phong Cách & Tạo Hình | Đặc Điểm Đòn Đánh |
|---|---|---|---|---|
| **Dã Lang** | 野狼 | `wolf` (`!isBoss`) | Sói hoang lông xám đen / nâu xám tự nhiên (loại bỏ hoàn toàn neon cyan cũ), mắt hổ phách–đỏ thẫm, 4 chân rõ khớp, mõm dài, tai nhọn, đuôi rậm | Thu thân rình mồi -> lao vồ cắn xé kèm vệt trảm cam-đỏ tại `hitFrame: 3` |
| **Dã Trư** | 野猪 | `boar` (`!isBoss`) | Lợn rừng thân thấp cơ bắp, lông nâu sẫm, giáp sắt thiên nhiên trên vai/sống lưng/mũi, cặp ngà cong sắc nhọn | Cào móng tung bụi -> **Lao húc (Charge)** bằng cặp ngà kèm sóng chấn động & vệt tốc độ tại `hitFrame: 3` |
| **Ma Đồ** | 魔徒 | `cultist` (`!isBoss`) | Tu sĩ ma đạo cấp thấp tỷ lệ người chuẩn (không chibi/anime hiện đại), đạo bào rách đen–xám–tím trầm viền đỏ thẫm, mặt nạ quỷ dị, cầm bùa chú / đoản đao | Tụ cầu ma khí tím-đỏ -> phóng ma phù / trảm kích ma khí tại `hitFrame: 3` |

---

## 2. DANH SÁCH 15 FILE PNG SPRITE SHEET & THÔNG SỐ KỸ THUẬT

Tất cả 15 tệp sprite sheet chính, 3 tệp `metadata.json` và 3 ảnh `preview.png` đều tồn tại vật lý tại `public/assets/pixel-art/monsters/`:

### A. Dã Lang (`public/assets/pixel-art/monsters/da_lang/`)
| Tệp | Kích Thước Ảnh | Frame W×H | Cột × Hàng | Số Frame / Hướng | FPS | Loop / End State | Dung Lượng Đĩa |
|---|---|---|---|---|---|---|---|
| `idle.png` | `256×256` | `64×64` | `4 × 4` | 4 | 6 | `loop: true` | 11,523 B |
| `walk.png` | `384×256` | `64×64` | `6 × 4` | 6 | 10 | `loop: true` | 12,401 B |
| `attack.png` | `384×256` | `64×64` | `6 × 4` | 6 | 12 | `loop: false`, `hitFrame: 3` | 14,576 B |
| `hit.png` | `192×256` | `64×64` | `3 × 4` | 3 | 10 | `loop: false` | 29,237 B |
| `death.png` | `384×256` | `64×64` | `6 × 4` | 6 | 10 | `loop: false`, `holdLastFrame: true` | 35,178 B |
| `preview.png` | `840×860` | Contact sheet 5 animations × 4 hướng | — | — | — | Preview | ~91 KB |
| `metadata.json` | JSON chuẩn hóa | — | — | — | — | Metadata | 3.1 KB |

### B. Dã Trư (`public/assets/pixel-art/monsters/da_tru/`)
| Tệp | Kích Thước Ảnh | Frame W×H | Cột × Hàng | Số Frame / Hướng | FPS | Loop / End State | Dung Lượng Đĩa |
|---|---|---|---|---|---|---|---|
| `idle.png` | `256×256` | `64×64` | `4 × 4` | 4 | 6 | `loop: true` | 15,383 B |
| `walk.png` | `384×256` | `64×64` | `6 × 4` | 6 | 10 | `loop: true` | 16,110 B |
| `attack.png` | `384×256` | `64×64` | `6 × 4` | 6 | 12 | `loop: false`, `hitFrame: 3` | 19,880 B |
| `hit.png` | `192×256` | `64×64` | `3 × 4` | 3 | 10 | `loop: false` | 38,330 B |
| `death.png` | `384×256` | `64×64` | `6 × 4` | 6 | 10 | `loop: false`, `holdLastFrame: true` | 46,475 B |
| `preview.png` | `840×860` | Contact sheet 5 animations × 4 hướng | — | — | — | Preview | ~118 KB |
| `metadata.json` | JSON chuẩn hóa | — | — | — | — | Metadata | 3.1 KB |

### C. Ma Đồ (`public/assets/pixel-art/monsters/ma_do/`)
| Tệp | Kích Thước Ảnh | Frame W×H | Cột × Hàng | Số Frame / Hướng | FPS | Loop / End State | Dung Lượng Đĩa |
|---|---|---|---|---|---|---|---|
| `idle.png` | `256×256` | `64×64` | `4 × 4` | 4 | 6 | `loop: true` | 11,401 B |
| `walk.png` | `384×256` | `64×64` | `6 × 4` | 6 | 10 | `loop: true` | 12,730 B |
| `attack.png` | `384×256` | `64×64` | `6 × 4` | 6 | 12 | `loop: false`, `hitFrame: 3` | 15,406 B |
| `hit.png` | `192×256` | `64×64` | `3 × 4` | 3 | 10 | `loop: false` | 28,988 B |
| `death.png` | `384×256` | `64×64` | `6 × 4` | 6 | 10 | `loop: false`, `holdLastFrame: true` | 42,316 B |
| `preview.png` | `840×860` | Contact sheet 5 animations × 4 hướng | — | — | — | Preview | ~100 KB |
| `metadata.json` | JSON chuẩn hóa | — | — | — | — | Metadata | 3.1 KB |

---

## 3. CHUẨN HÓA KỸ THUẬT & BỐ CỤC 4 HƯỚNG

- **Kích thước khung chuẩn**: `64 × 64 px` đồng nhất cho mọi animation của cả 3 quái vật.
- **Thứ tự hàng (Row Order Standard)**:
  - Hàng `0`: `down` (Nam)
  - Hàng `1`: `left` (Tây)
  - Hàng `2`: `right` (Đông)
  - Hàng `3`: `up` (Bắc)
- **Điểm neo chân (Feet Pivot)**: `{ x: 0.5, y: 0.875 }` $\rightarrow$ pixel `(32, 56)` khớp chính xác với chuẩn của Lâm Mặc Phase 2.0.
- **Nền trong suốt & Chống tràn khung**: Khử nền trắng kết hợp loại bỏ viền sáng anti-aliasing (zero white halo); toàn bộ pixel được cắt gọn nghiêm ngặt trong `[1..62, 1..62]` (0 pixel tràn viền ở mọi cell trong 15 sprite sheet).
- **Nearest-Neighbor**: Cưỡng bức `ctx.imageSmoothingEnabled = false` khi vẽ sprite lên Canvas gameplay.

---

## 4. TÍCH HỢP `MonsterSpriteRenderer` VÀO GAMEPLAY CHÍNH (`GameCanvas.tsx`)

- **Kiến trúc**: `src/engine/pixelArt/MonsterSpriteRenderer.ts` quản lý cache tiền tải (`preloadAll()` nạp 15 sheet một lần vào `PixelAssetLoader`) và bản đồ trạng thái tái sử dụng theo `enemy.id` (`Map<string, MonsterInstanceState>`), không cấp phát bộ nhớ heap trong vòng lặp `render()`.
- **Đồng bộ AI không xâm lấn**:
  - Suy luận hướng 4 chiều từ chuyển động `(dx, dy)` khi tuần tra/truy đuổi và hướng về người chơi `(playerX - enemy.x, playerY - enemy.y)` khi `detect`, `attack_windup`, `attacking`, `chase`.
  - Đồng bộ thứ bậc ưu tiên: `Death (5) > Hit (4) > Attack (2) > Walk / Idle (1)`.
  - Khi quái thường chết (`hp <= 0`), `shouldRenderDead(enemy)` giữ hiển thị trong cửa sổ `1.15s` để phát trọn vẹn 6 frame `death` rồi mờ dần và ẩn sạch sẽ, đồng thời không làm thay đổi logic AI, loot drop hay đếm kill quest.
  - Tự động dọn dẹp (`clearInstances()`, `pruneStaleInstances()`) khi chuyển map.

---

## 5. BẢO TOÀN TUYỆT ĐỐI HỆ THỐNG CŨ & PHASE 2.0

- **Phase 2.0 Lâm Mặc**: Không chỉnh sửa bất kỳ sprite sheet, VFX hay mã nguồn `LamMacSpriteRenderer.ts`.
- **Boss & Quái Khác**: `MonsterSpriteRenderer.supportsEnemy(enemy)` trả về `false` khi `enemy.isBoss === true` (như *Thiết Bì Trư Vương*) hoặc các `shape` khác (`scorpion_king`, `ape_boss`, `ghost_wolf`, ...), đảm bảo tiếp tục đi qua `renderXianxiaEnemy` như cũ.
- **Gameplay & Save/Load**: Không sửa sát thương, hitbox, cooldown, AI timer, hệ thống rơi đồ, HUD, bản đồ hay cấu trúc JSON lưu game. Không xóa `proceduralRenderer.ts` hay asset cũ trong `public/assets/pixel/enemies/`.

---

## 6. BẰNG CHỨNG VIDEO WEBM & TIMELINE TRỰC QUAN

Tất cả tệp đã kiểm tra tồn tại thực tế (>0 byte) và giải mã sạch bằng `ffmpeg -v error`:

- **Thư mục Video (`public/evidence/videos/monsters/`)**:
  - `da_lang_4_directions.webm` (255,806 B), `da_lang_idle.webm` (18,162 B), `da_lang_walk.webm` (20,763 B), `da_lang_attack.webm` (32,611 B), `da_lang_hit.webm` (32,873 B), `da_lang_death.webm` (34,708 B)
  - `da_tru_4_directions.webm` (325,344 B), `da_tru_idle.webm` (20,075 B), `da_tru_walk.webm` (24,451 B), `da_tru_attack.webm` (39,154 B), `da_tru_hit.webm` (38,607 B), `da_tru_death.webm` (41,063 B)
  - `ma_do_4_directions.webm` (260,969 B), `ma_do_idle.webm` (18,878 B), `ma_do_walk.webm` (21,848 B), `ma_do_attack.webm` (38,237 B), `ma_do_hit.webm` (34,878 B), `ma_do_death.webm` (40,166 B)
  - `gameplay_monsters_live.webm` (549 KB – quay trực tiếp gameplay trên Headless Chromium)
- **Thư mục Timeline (`public/evidence/frames/monsters/`)**: 15 ảnh timeline bóc tách từng frame index (`timeline_{da_lang,da_tru,ma_do}_{idle,walk,attack,hit,death}.png`).
- **Cổng xem & tải trực tiếp**: `http://localhost:3000/evidence/index.html` (`imgCount: 13`, `brokenImgs: []`, 0 lỗi console).

---

## 7. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG & BIÊN DỊCH

- **Bộ kiểm thử tự động (`npx --yes tsx --test`)**: **47 / 47 PASS (0 FAIL)**
  - `phase2_1_monster_integration.test.ts`: **8 / 8 PASS** (tồn tại 15 PNG, khớp kích thước `metadata.json`, alpha trong suốt, 0 pixel tràn viền, frame chuyển động khác biệt, 4 hướng, pivot `(32, 56)`, định tuyến normal monster vs Boss, đồng bộ AI 4 hướng, bất biến tọa độ/chỉ số, cache preload).
  - Các bộ hồi quy hiện có (`lam_mac_sprite_validation.test.ts`, `phase2_integration.test.ts`, `pixel_sandbox.test.ts`, `p0_regression.test.ts`): **39 / 39 PASS**.
- **Typecheck (`npx tsc --noEmit`)**: **Exit code 0 (0 lỗi)**.
- **Production Build (`npm run build`)**: **Exit code 0 (built in 1.41s, 1730 modules)**.
- **Log nguyên bản**: `public/evidence/logs/phase_2_1_test_output.log` (`.txt`) & `public/evidence/logs/phase_2_1_build_check.log` (`.txt`).

---

## 8. KIỂM ĐỊNH TRÌNH DUYỆT THỰC TẾ (HEADLESS CHROMIUM)

- **Cổng bằng chứng (`/evidence/index.html`)**: Tải đủ 13/13 hình ảnh, 15 phần tử video, log 47/47 PASS, 0 console errors.
- **Màn chơi chính (`Thanh Khê Thôn`)**: Hiển thị đồng thời **Thanh Khê Dã Lang** (`da_lang`) và **Thiết Bì Dã Trư** (`da_tru`) bằng HD Pixel Art bên cạnh Lâm Mặc, có bóng đổ và thanh máu chuẩn xác.
- **Màn chơi thực chiến (`Hắc Phong Sơn`)**: Hiển thị **Hắc Sát Ma Đồ** (`ma_do`) tung chiêu `⚡ TỤ MA KHÍ!` + đạn ma khí, **Huyền Lôi Sơn Thao** (`boar` tinh anh) và Y-sorting che khuất tự nhiên sau khối đá, **0 console errors / 0 warnings**.

---

## 9. HẠCH TOÁN DUNG LƯỢNG ĐĨA & VRAM (PHASE 2.1)

Công thức chuẩn: `Width × Height × 4 bytes` (RGBA 32-bit không nén khi nạp làm Texture trên GPU/Canvas):

| Quái Vật | Số Tệp PNG | Tổng Frame | Tổng Pixel | Dung Lượng Đĩa Nén | Bộ Nhớ Giải Mã / VRAM |
|---|---|---|---|---|---|
| **Dã Lang (`da_lang`)** | 5 PNG | 100 | 409,600 px | 100.50 KB | **1.563 MB** (1,638,400 B) |
| **Dã Trư (`da_tru`)** | 5 PNG | 100 | 409,600 px | 132.99 KB | **1.563 MB** (1,638,400 B) |
| **Ma Đồ (`ma_do`)** | 5 PNG | 100 | 409,600 px | 108.24 KB | **1.563 MB** (1,638,400 B) |
| **TỔNG PHASE 2.1** | **15 PNG** | **300** | **1,228,800 px** | **341.73 KB** | **4.688 MB** (4,915,200 B) |

*(Tham chiếu chi tiết: `public/evidence/logs/phase_2_1_vram_breakdown.json`.)*

---

## 10. ĐÁNH GIÁ TRUNG THỰC HIỆU NĂNG ANDROID

- **CHƯA ĐO TRÊN THIẾT BỊ ANDROID VẬT LÝ THỰC TẾ (NOT VERIFIED ON PHYSICAL HARDWARE)**.
- Trong container Linux ảo hóa, Headless Chromium dùng CPU SwiftShader raster nên không đại diện cho GPU di động thật. Không tuyên bố hay xác nhận 60 FPS trên Android khi chưa đo thực tế trên máy thật.

---

## 11. CÁC ĐIỂM CÒN TỒN TẠI / GIỚI HẠN ĐÃ BIẾT

1. Chưa đo hiệu năng FPS/nhiệt độ trên thiết bị Android vật lý thực tế.
2. Quái vật thường sử dụng cơ chế rút sprite frame đồng bộ từ 3 góc nhìn chuẩn (Front/Side/Back) kết hợp biến đổi khớp chi pixel-art (giống pipeline Phase 2.0 của Lâm Mặc), chưa vẽ tay từng frame hoàn toàn độc lập ở studio ngoài.
3. Phase 2.2 (Boss *Bạch Mao Viên Hầu* và nâng cấp toàn bộ tileset môi trường) chưa được triển khai trong phạm vi Phase 2.1 này.

---

## 12. XÁC NHẬN DỪNG ĐÚNG RANH GIỚI PHASE 2.1

- [x] Đã hoàn thành đủ 3 quái vật thường: **Dã Lang**, **Dã Trư**, **Ma Đồ**.
- [x] **KHÔNG** triển khai Boss Bạch Mao Viên Hầu hay các phase sau (Phase 2.2+).
- [x] Sẵn sàng chờ Game Director nghiệm thu và phê duyệt bước tiếp theo.
