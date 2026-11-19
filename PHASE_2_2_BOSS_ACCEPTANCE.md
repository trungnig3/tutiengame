# BÁO CÁO NGHIỆM THU PHASE 2.2 – BOSS BẠCH MAO VIÊN HẦU (白毛猿猴)
# DỰ ÁN: PHÀM TRẦN TIÊN LỘ (凡尘仙路)

**Repository**: `trungnig3/tutiengame`  
**Nhánh**: `audit/android-performance`  
**Phạm vi**: Phase 2.2 – Thiết kế đồ họa Premium HD Pixel Art, VFX chuyên biệt, `BossSpriteRenderer`, và tích hợp cơ chế chiến đấu hoàn chỉnh cho **Boss Bạch Mao Viên Hầu**  
**Trạng thái**: **HOÀN TẤT PHASE 2.2 (CHƯA CHUYỂN PHASE 2.3)**

---

## 1. TỔNG QUAN THIẾT KẾ & BỐI CẢNH TIÊN HIỆP

- **Tên Boss**: **Bạch Mao Viên Hầu (白毛猿猴)** – Danh xưng: *Linh Vụ Yêu Tôn (Lĩnh Chủ)* (`boss_bach_mao_vien_hau`, `shape: 'ape_boss'`, `isBoss: true`).
- **Tạo hình độc bản**: Yêu thú vượn khổng lồ phủ lông trắng xám ánh sương lạnh, đầu đội bộ lông bờm xù uy nghi, cặp mắt đỏ hổ phách cuồng bạo, cơ bắp vạm vỡ lộ vết sẹo chiến đấu và cánh tay dài lực lưỡng — **không** phóng to sprite quái thường Phase 2.1.
- **Vị trí & Chỉ số trong `map_linh_vu` (*Linh Vụ Sơn Cốc*)**:
  - Tọa độ spawn: `{ x: 1330, y: 165, width: 35, height: 35 }` tại bãi đất trống Đông Bắc, tách biệt an toàn `~283 px` với NPC *Tố Vấn Tiên Cô* (`(1080, 280)`).
  - Cảnh giới: `Luyện Khí Tầng 5 (Lĩnh Chủ)` (`realmIndex: 0`, `realmLayer: 4`).
  - Chỉ số: `maxHp: 2400`, `atk: 88`, `def: 46`, `speed: 122`, `attackRange: 85`, `aggroRange: 270`, `leashRange: 500`, hitbox `{ width: 84, height: 92, radius: 38 }`.
- **Thư mục bộ sưu tập (`src/data/collection.ts`)**: Bổ sung mục `boss_bach_mao_vien_hau` trong `BOSS_COLLECTION`.

---

## 2. DANH SÁCH 9 SPRITE SHEET BOSS & 6 VFX SHEET CHUYÊN BIỆT

Toàn bộ tài nguyên vật lý lưu tại `public/assets/pixel-art/bosses/bach_mao_vien_hau/` và `public/assets/pixel-art/vfx/bach_mao_vien_hau/`:

### A. 9 Sprite Sheet Boss (`128 × 128 px/frame`, 4 hàng hướng)
| Tệp | Kích Thước PNG | Frame W×H | Cột × Hàng | Số Frame / Hướng | Tổng Frame | FPS | Cơ Chế Phát | Dung Lượng Đĩa |
|---|---|---|---|---|---|---|---|---|
| `idle.png` | `768×512` | `128×128` | `6 × 4` | 6 | 24 | 6 | `loop: true` | 92,605 B |
| `walk.png` | `1024×512` | `128×128` | `8 × 4` | 8 | 32 | 8 | `loop: true` | 82,257 B |
| `run.png` | `1024×512` | `128×128` | `8 × 4` | 8 | 32 | 12 | `loop: true` | 88,151 B |
| `attack_1.png` | `896×512` | `128×128` | `7 × 4` | 7 | 28 | 12 | `loop: false`, `hitFrame: 4` (*Thiết Chưởng*) | 207,322 B |
| `attack_2.png` | `1024×512` | `128×128` | `8 × 4` | 8 | 32 | 14 | `loop: false`, `hitFrame: 3`, `secondaryHitFrame: 6` (*Cuồng Nộ Liên Kích*) | 266,054 B |
| `attack_3.png` | `1024×512` | `128×128` | `8 × 4` | 8 | 32 | 14 | `loop: false`, `hitFrame: 4` (*Cuồng Bạo Xung Kích*) | 154,408 B |
| `skill.png` | `1280×512` | `128×128` | `10 × 4` | 10 | 40 | 10 | `loop: false`, `hitFrame: 6` (*Bạch Viên Chấn Địa*) | 219,048 B |
| `hit.png` | `512×512` | `128×128` | `4 × 4` | 4 | 16 | 10 | `loop: false` | 172,828 B |
| `death.png` | `1280×512` | `128×128` | `10 × 4` | 10 | 40 | 8 | `loop: false`, `holdLastFrame: true` | 396,964 B |
| `preview.png` | Contact sheet | — | — | — | — | — | Xem trước 9 anim × 4 hướng | 515,732 B |
| `metadata.json` | JSON chuẩn hóa | — | — | — | — | — | Đặc tả thông số kỹ thuật | 8,625 B |

### B. 6 VFX Sheet Độc Quyền (`public/assets/pixel-art/vfx/bach_mao_vien_hau/`)
| Tệp VFX | Kích Thước PNG | Frame W×H | Số Frame | FPS | Loop | Vai Trò Chiến Đấu | Dung Lượng Đĩa |
|---|---|---|---|---|---|---|---|
| `vfx_chuong_kich.png` | `768×128` | `128×128` | 6 | 16 | `false` | Sóng chưởng lực cự trảo khi tung `attack_1` / `attack_2` | 9,964 B |
| `vfx_dia_chan.png` | `960×160` | `160×160` | 6 | 14 | `false` | Sóng địa chấn lan tỏa khi chuyển **Phase 2 Cuồng Nộ** | 14,379 B |
| `vfx_yeu_khi_tu_luc.png` | `768×128` | `128×128` | 6 | 12 | `false` | Tụ linh áp đỏ–bạc báo hiệu trong giai đoạn windup đòn nặng | 7,143 B |
| `vfx_bach_vien_chan_dia.png` | `1280×160` | `160×160` | 8 | 14 | `false` | Tuyệt kỹ nện đất nứt địa mạch tại `hitFrame: 6` của `skill` | 25,832 B |
| `vfx_cuong_no.png` | `768×128` | `128×128` | 6 | 10 | `true` | Hào quang yêu khí đỏ sẫm bao quanh Boss suốt Phase 2 (`HP ≤ 50%`) | 6,807 B |
| `vfx_boss_death.png` | `1024×128` | `128×128` | 8 | 10 | `false` | Tan rã yêu đan & linh khí khi Bạch Mao Viên Hầu ngã xuống | 2,781 B |

---

## 3. CHUẨN HÓA KỸ THUẬT, PIVOT & LÀM SẠCH ALPHA

- **Thứ tự hàng 4 hướng chuẩn**: `0: down` (Nam), `1: left` (Tây), `2: right` (Đông), `3: up` (Bắc).
- **Feet Pivot đồng bộ**: `{ x: 0.5, y: 0.90 }` $\rightarrow$ pixel `(64, 115)` trên khung `128×128`, khớp bóng đổ mặt đất và Y-sorting theo chân nhân vật trong `GameCanvas.tsx`.
- **Xử lý nền & khử lỗ trắng nội tại**: `scripts/generate_boss_bach_mao_pack.cjs` chạy flood-fill viền ngoài kết hợp bộ lọc vùng liên thông trắng trung tính kín (`comp.length >= 120 && avgLum >= 246 && avgChroma <= 8`) nhằm loại bỏ sạch hai mảng nền trắng bị kẹt dưới nách khi Boss giơ tay gầm thét mà vẫn giữ nguyên bộ lông trắng ánh lam-xám tự nhiên.
- **Chống tràn khung**: 0 pixel tràn ra ngoài vùng an toàn `[1..126, 1..126]` ở mọi cell trên toàn bộ 9 sheet Boss.
- **Tối ưu pixel sắc nét**: `ctx.imageSmoothingEnabled = false` (Nearest-Neighbor).

---

## 4. KIẾN TRÚC `BossSpriteRenderer` & CƠ CHẾ CHIẾN ĐẤU TRONG `GameCanvas.tsx`

- **File renderer**: `src/engine/pixelArt/BossSpriteRenderer.ts`
  - Tiền tải một lần (`preloadAll()`) nạp toàn bộ 9 sheet Boss + 6 VFX sheet qua `PixelAssetLoader` với cơ chế promise cache dùng chung.
  - Quản lý trạng thái theo `enemy.id` (`Map<string, BossInstanceState>`) không gây rác bộ nhớ GC mỗi frame.
  - Bảng ưu tiên khóa animation chuẩn xác: `Death (6) > Hit/Stun (5) > Skill (4) > Attack (3) > Run (2) > Walk (1) > Idle (0)`.
  - Duy trì `shouldRenderDead(enemy)` trong cửa sổ `1.65s` để phát trọn 10 frame `death` kèm `vfx_boss_death` trước khi biến mất.
- **4 Chiêu thức chiến đấu & Phase 2 Cuồng Nộ (`src/components/GameCanvas.tsx`)**:
  1. **Thiết Chưởng (`attack_1` / pattern `melee`)**: Đập chưởng cận chiến cự ly gần kèm `vfx_chuong_kich`.
  2. **Cuồng Nộ Liên Kích (`attack_2` / pattern `combo`)**: Đánh 2 nhịp liên hoàn sử dụng `bossComboFollowup` (`hitFrame: 3` và `secondaryHitFrame: 6`).
  3. **Cuồng Bạo Xung Kích (`attack_3` / pattern `charge`)**: Tụ lực gầm thét (`vfx_yeu_khi_tu_luc`) rồi lao húc tốc độ cao; va chạm vật cản hoặc trượt mở **cửa sổ sơ hở (`+35%` sát thương)**.
  4. **Bạch Viên Chấn Địa (`skill` / pattern `slam`)**: Tụ linh lực đỏ–bạc nhảy nện rung chấn toàn vùng AoE (`vfx_bach_vien_chan_dia`), để lộ trạng thái `stunned` cho người chơi phản công.
  5. **Phase 2 Cuồng Nộ (`HP ≤ 50%`)**: Kích hoạt đồng bộ ở cả `applyDamageToEnemy` lẫn vòng lặp AI, thông báo `'BẠCH MAO VIÊN HẦU CUỒNG NỘ (PHASE 2)!'`, tung sóng `vfx_dia_chan` và bật hào quang `vfx_cuong_no` vĩnh viễn cho tới khi gục ngã.
- **Thanh máu Boss HUD**: `renderBossHealthBar` hỗ trợ đầy đủ cả trạng thái `e.state === 'attacking'` để tránh nhấp nháy thanh máu trong lúc tung liên kích.

---

## 5. BẢO TOÀN TUYỆT ĐỐI PHASE 2.0, PHASE 2.1 & BOSS CŨ

- **Phase 2.0 (Lâm Mặc)**: Giữ nguyên hoàn toàn `LamMacSpriteRenderer.ts`, 10 sprite sheet và 5 VFX của nhân vật chính.
- **Phase 2.1 (3 quái vật thường)**: Giữ nguyên hoàn toàn `MonsterSpriteRenderer.ts` và 15 sprite sheet của *Dã Lang*, *Dã Trư*, *Ma Đồ*.
- **5 Boss cũ**: `bossSpriteRenderer.supportsEnemy(enemy)` chỉ trả về `true` cho `shape === 'ape_boss'` hoặc tên chứa `'bạch mao viên hầu'`; các Boss cũ (*Thiết Bì Trư Vương*, *Thanh Phong Cự Mãng*, *Ma Linh Hạt Vương*, *Cổ Thi Ma Tôn*, *Hắc Huyết Viên Vương*) vẫn đi qua `renderXianxiaEnemy` như cũ.
- **Phạm vi**: Không chỉnh sửa tileset môi trường (Phase 2.3) hay giao diện UI Pixel Art (Phase 2.4).

---

## 6. BẰNG CHỨNG VIDEO WEBM & TIMELINE TRỰC QUAN

Tất cả tệp tồn tại thực tế (>0 byte) và truy cập được tại `http://localhost:3000/evidence/index.html`:

- **12 Video WebM (`public/evidence/videos/boss_bach_mao/`)**:
  - `bach_mao_idle.webm` (56,210 B)
  - `bach_mao_walk.webm` (66,660 B)
  - `bach_mao_run.webm` (86,258 B)
  - `bach_mao_attack_1.webm` (168,245 B)
  - `bach_mao_attack_2.webm` (180,736 B)
  - `bach_mao_attack_3.webm` (128,253 B)
  - `bach_mao_skill.webm` (199,287 B)
  - `bach_mao_hit.webm` (80,374 B)
  - `bach_mao_death.webm` (145,008 B)
  - `bach_mao_4_directions.webm` (1,280,153 B)
  - `bach_mao_combat_vfx_showcase.webm` (535,805 B)
  - `gameplay_boss_live.webm` (956,258 B – ghi hình trực tiếp trận chiến Boss trên Headless Chromium)
- **9 Ảnh Timeline (`public/evidence/frames/boss_bach_mao/`)**:
  - `timeline_boss_idle.png` (40,803 B), `timeline_boss_walk.png` (41,548 B), `timeline_boss_run.png` (45,674 B)
  - `timeline_boss_attack_1.png` (78,821 B), `timeline_boss_attack_2.png` (98,184 B), `timeline_boss_attack_3.png` (57,873 B)
  - `timeline_boss_skill.png` (74,925 B), `timeline_boss_hit.png` (58,824 B), `timeline_boss_death.png` (123,520 B)

---

## 7. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG & BIÊN DỊCH

- **Bộ kiểm thử tự động (`npx --yes tsx --test`)**: **55 / 55 PASS (0 FAIL)**
  - `phase2_2_boss_integration.test.ts`: **8 / 8 PASS**
  - Các bộ hồi quy hiện có (`p0_regression.test.ts`, `lam_mac_sprite_validation.test.ts`, `phase2_1_monster_integration.test.ts`, `phase2_integration.test.ts`, `pixel_sandbox.test.ts`): **47 / 47 PASS**.
- **Typecheck (`npx tsc --noEmit`)**: **Exit code 0 (0 lỗi)**.
- **Production Build (`npm run build`)**: **Exit code 0 (`1731 modules`, built in `1.78s`, PWA precache `145 entries`)**.
- **Log nguyên bản**: `public/evidence/logs/phase_2_2_test_output.txt`, `public/evidence/logs/phase_2_2_build_check.txt`, `public/evidence/logs/phase_2_2_vram_breakdown.json`.

---

## 8. KIỂM ĐỊNH TRÌNH DUYỆT THỰC TẾ (HEADLESS CHROMIUM – 2 VÒNG)

- **Vòng 1**: Phát hiện Boss spawn `(1160, 185)` hơi gần NPC *Tố Vấn Tiên Cô* và còn 2 mảng nền trắng kẹt dưới vùng nách ở sprite gầm thét; đã khắc phục triệt để bằng cách dời spawn sang `(1330, 165)` và bổ sung bộ lọc vùng liên thông trắng nội tại trong `extractCleanSprite`.
- **Vòng 2 (Sau khi sửa lỗi & khởi động lại server)**:
  - **Gameplay `map_linh_vu`**: Xác nhận *Bạch Mao Viên Hầu* xuất hiện tại bãi đất trống Đông Bắc, tách biệt NPC, thanh máu Boss `👑 Bạch Mao Viên Hầu [Linh Vụ Yêu Tôn (Lĩnh Chủ)]`, vòng cảnh báo & hiệu ứng `Bạch Viên Chấn Địa`, tương tác kiếm khí Lâm Mặc và trạng thái `⚡ SƠ HỞ! (+35% SÁT THƯƠNG)` hoạt động mượt mà với **0 lỗi console**.
  - **Trang bằng chứng (`/evidence/index.html`)**: `15/15` hình ảnh nạp thành công (`brokenImgs: []`), `20` thẻ video, tải log Phase 2.2 đầy đủ, **0 lỗi console**.

---

## 9. HẠCH TOÁN DUNG LƯỢNG ĐĨA & VRAM (PHASE 2.2)

Công thức chuẩn: `Width × Height × 4 bytes` (RGBA 32-bit giải mã không nén trên GPU/Canvas):

| Nhóm Tài Nguyên | Số Tệp PNG | Tổng Frame | Tổng Pixel | Dung Lượng Đĩa Nén | Bộ Nhớ Giải Mã / VRAM |
|---|---|---|---|---|---|
| **9 Sheet Boss (`128×128`)** | 9 PNG | 276 | 4,521,984 px | 1,640.27 KB (1,679,637 B) | **17.250 MB** (18,087,936 B) |
| **6 Sheet VFX Boss** | 6 PNG | 40 | 784,384 px | 65.34 KB (66,906 B) | **2.992 MB** (3,137,536 B) |
| **TỔNG PHASE 2.2** | **15 PNG** | **316** | **5,306,368 px** | **1,705.61 KB (1,746,543 B)** | **20.242 MB** (21,225,472 B) |

*(Tham chiếu từng tệp trong `public/evidence/logs/phase_2_2_vram_breakdown.json`.)*

---

## 10. ĐÁNH GIÁ TRUNG THỰC HIỆU NĂNG ANDROID

- **CHƯA ĐO TRÊN THIẾT BỊ ANDROID VẬT LÝ THỰC TẾ (NOT VERIFIED ON PHYSICAL HARDWARE)**.
- Môi trường kiểm thử trong container Linux dùng CPU SwiftShader raster, do đó không phản ánh thông số FPS hay nhiệt độ thực tế của GPU di động tầm trung. Không tuyên bố đạt 60 FPS Android khi chưa benchmark trên thiết bị thật.

---

## 11. CÁC ĐIỂM CÒN TỒN TẠI / GIỚI HẠN ĐÃ BIẾT

1. Chưa đo đạc FPS và mức tiêu thụ bộ nhớ trên thiết bị Android vật lý thực tế.
2. Các chuỗi chuyển động của *Bạch Mao Viên Hầu* được tổng hợp đồng bộ pixel-art từ bộ ảnh gốc nhiều góc nhìn (Front/Side/Back/Slam/Lunge) nhằm đảm bảo nhất quán hình khối, chưa có bản vẽ tay từng frame riêng lẻ từ họa sĩ pixel ngoài.
3. Phase 2.3 (nâng cấp Tileset môi trường) và Phase 2.4 (UI Pixel Art) nằm ngoài phạm vi và chưa triển khai.

---

## 12. XÁC NHẬN DỪNG ĐÚNG RANH GIỚI PHASE 2.2

- [x] Hoàn thiện **Boss Bạch Mao Viên Hầu**: 9 sprite sheet (`128×128`), 6 VFX sheet chuyên biệt, `BossSpriteRenderer`, AI 4 chiêu thức + Phase 2 Cuồng Nộ trong `map_linh_vu`, bộ sưu tập `BOSS_COLLECTION`.
- [x] Bảo toàn 100% Phase 2.0 (Lâm Mặc), Phase 2.1 (3 quái thường), 5 Boss cũ, Save/Load và combat engine gốc.
- [x] **KHÔNG** bước sang Phase 2.3 hay Phase 2.4. Sẵn sàng chờ Game Director nghiệm thu.
