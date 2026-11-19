# BÁO CÁO KIỂM ĐỊNH THỊ GIÁC PHASE 2.2 – BOSS BẠCH MAO VIÊN HẦU
# DỰ ÁN: PHÀM TRẦN TIÊN LỘ (凡尘仙路)

**Repository**: `trungnig3/tutiengame`  
**Nhánh**: `audit/android-performance`  
**Đối tượng thẩm định**: 9 Sprite Sheet Boss (`128×128`), 6 VFX Sheet độc quyền, và hiển thị thực chiến trên màn chơi *Linh Vụ Sơn Cốc* (`map_linh_vu`)

---

## 1. ĐÁNH GIÁ CHẤT LƯỢNG MỸ THUẬT & TẠO HÌNH PIXEL ART

1. **Đúng tinh thần Yêu Thú Tiên Hiệp Trung Hoa**:
   - Hình thể vượn khổng lồ vai rộng, cơ bắp cuồn cuộn, bộ lông trắng bạc pha lam-xám tạo khối rõ nét với viền ngoài đậm sắc nét (`dark outline`), tách biệt hoàn toàn khỏi quái thường Phase 2.1 (`64×64`).
   - Có đủ 4 góc nhìn chuẩn hóa theo đúng thứ tự hàng: **Hàng 0 Nam (`down`)**, **Hàng 1 Tây (`left`)**, **Hàng 2 Đông (`right`)**, **Hàng 3 Bắc (`up`)**.
2. **Độ sắc nét & đồng bộ kích thước**:
   - Toàn bộ 9 sprite sheet đều sử dụng kích thước khung chuẩn `128 × 128 px`, hiển thị với `imageSmoothingEnabled = false` (Nearest-Neighbor) giúp giữ nguyên từng hạt pixel sắc sảo trên Canvas, không bị nhòe bilinear.
3. **Độ liền mạch chuyển động (Animation Continuity)**:
   - Không còn hiện tượng đường cắt gãy (slice seam) ở phần ngực và tay khi vung đòn như bản nháp ban đầu nhờ cơ chế biến hình liên tục trong `blitBoss`.
   - Kiểm tra trực tiếp trên 9 ảnh timeline (`public/evidence/frames/boss_bach_mao/timeline_boss_*.png`) cho thấy từng khung hình trong `idle`, `walk`, `run`, `attack_1..3`, `skill`, `hit`, `death` đều có biên độ chuyển động rõ ràng và mượt mà.

---

## 2. XỬ LÝ KHUYẾT TẬT THỊ GIÁC ĐÃ PHÁT HIỆN & KHẮC PHỤC

Trong quá trình kiểm định trực tiếp bằng mắt qua ảnh timeline và trình duyệt Headless Chromium:

| Vấn Đề Phát Hiện (Vòng 1) | Nguyên Nhân | Biện Pháp Khắc Phục | Xác Nhận Sau Sửa (Vòng 2) |
|---|---|---|---|
| **Hai đốm trắng kín dưới nách** ở tư thế giơ tay gầm thét (`idle`, `attack_1`, `skill`) | Thuật toán flood-fill từ rìa ngoài không xuyên vào vùng nền trắng bị hai cánh tay bao bọc kín | Bổ sung bước quét thành phần liên thông trắng trung tính nội tại (`comp.length >= 120 && avgLum >= 246 && avgChroma <= 8`) trong `extractCleanSprite` mà không ăn vào phần lông trắng ánh lam (`chroma > 8`) | Đã kiểm tra lại `timeline_boss_skill.png` và `timeline_boss_attack_1.png`: sạch hoàn toàn, biên lông sắc nét |
| **Vị trí Boss đứng gần NPC *Tố Vấn Tiên Cô*** (`1160, 185` vs `1080, 280`) | Khoảng cách spawn ban đầu chỉ ~124 px khiến phạm vi giao chiến dễ chồng hình với NPC | Chuyển điểm spawn của *Bạch Mao Viên Hầu* sang bãi trống Đông Bắc `{ x: 1330, y: 165 }` (`~283 px` cách NPC) | Đã chụp và quay lại `gameplay_boss_live.webm`: Boss đứng thoáng tại vùng đất riêng, không đè lên NPC |

---

## 3. ĐÁNH GIÁ KỸ THUẬT ALPHA, PIVOT & Y-SORTING

- **Kênh Alpha & Viền ảnh**: Kênh trong suốt sạch sẽ, không quầng trắng (zero white halo), **0 pixel tràn viền** trên tất cả 276 cell của 9 sprite sheet Boss.
- **Điểm neo chân (Feet Pivot)**: Chuẩn `{ x: 0.5, y: 0.90 }` $\rightarrow$ pixel `(64, 115)` khớp với tâm bóng đổ mặt đất. Khi *Lâm Mặc* (`64×64`, pivot `y = 56`) di chuyển phía trước hoặc phía sau *Bạch Mao Viên Hầu*, `PixelDepthSorter` sắp xếp thứ tự che khuất theo `feetY` tự nhiên, không bị nổi đè sai lớp.

---

## 4. ĐỒNG BỘ HIỆU ỨNG VFX & GAMEPLAY TRỰC TIẾP

Kiểm tra trực tiếp qua `bach_mao_combat_vfx_showcase.webm` và video gameplay thực chiến `gameplay_boss_live.webm`:

1. **`vfx_chuong_kich`**: Bùng nổ sóng chưởng tại vị trí mục tiêu khớp đúng `hitFrame: 4` (*Thiết Chưởng*) và `hitFrame: 3 / 6` (*Cuồng Nộ Liên Kích*).
2. **`vfx_yeu_khi_tu_luc`**: Tụ luồng khí đỏ–bạc xoay quanh Boss trong giai đoạn gồng đòn báo hiệu (*Charge* & *Chấn Địa*).
3. **`vfx_bach_vien_chan_dia`**: Sóng nứt đất lan rộng `160×160` bùng phát khớp khung hình nện đất (`hitFrame: 6`) của `skill.png`.
4. **`vfx_dia_chan` & `vfx_cuong_no`**: Khi Boss tụt xuống dưới `50% HP`, hiệu ứng sóng chấn động nổ ra 1 lần kèm vòng hào quang yêu khí `vfx_cuong_no` bám theo chân Boss liên tục trong Phase 2.
5. **`vfx_boss_death`**: Phát đồng bộ trong cửa sổ `1.65s` khi Boss ngã xuống ở frame cuối cùng của `death.png`.

---

## 5. KẾT LUẬN KIỂM ĐỊNH THỊ GIÁC

- **Đạt chuẩn thẩm định Phase 2.2** trên cả kiểm tra từng frame tĩnh (9 timeline PNG), video tổng hợp (11 WebM) và gameplay thực chiến trên trình duyệt Chromium (1 WebM thực tế, 0 console errors).
- **Bảo toàn 100%** chất lượng hiển thị của *Lâm Mặc* (Phase 2.0), 3 quái thường (Phase 2.1) và 5 Boss cũ.
