# Kế Hoạch & Tiến Độ Triển Khai Nâng Cấp Gameplay Cốt Lõi — Phàm Trần Tiên Lộ: Con Đường Nghịch Mệnh

## 1. GIAI ĐOẠN 1 — CẢM GIÁC CHIẾN ĐẤU (HOÀN THÀNH)
- [x] **Chuỗi Combo Đánh Thường 3 Nhịp Phân Biệt:**
  - **Đòn 1 (Hoành Tảo):** Tốc độ nhanh (0.22s), góc quét 130°, tầm đánh 70px, sát thương 1.0x, đẩy lùi 18px.
  - **Đòn 2 (Nghịch Phong):** Trảm ngược hướng (0.24s), góc quét 148°, tầm đánh 80px, sát thương 1.35x, đẩy lùi 28px.
  - **Đòn 3 (Phách Không):** Đại trảm dũng mãnh (0.36s), góc quét 171°, tầm đánh 95px, sát thương 1.95x, đẩy lùi 45px, lướt nhẹ 16px về phía trước (có kiểm tra chướng ngại vật), rung màn hình 6.0, hit-stop 0.065s.
- [x] **Input Buffering & Cửa Sổ Combo:**
  - Cửa sổ nối đòn 0.75s sau đòn 1 và 2.
  - Bộ đệm `queuedAttackRef` cho phép nhận lệnh chuột trái ngay trong giai đoạn thu chiêu (progress >= 0.45), tự kích hoạt combo tiếp theo không bị nuốt phím.
- [x] **Né Tránh & Né Hoàn Hảo (Tiên Phong Huyễn Ảnh):**
  - Né thường: Lướt 110px, 4 tàn ảnh xanh lam, thời gian hồi 1.2s.
  - Né hoàn hảo: Kích hoạt khi né trong lúc quái đang gồng đòn (windup <= 0.26s trong 170px) hoặc đạn đạo cách dưới 130px. Tạo 6 tàn ảnh hoàng kim lấp lánh, hồi ngay 15 MP, giảm hồi chiêu Dash về 0.6s, mở rộng thời gian bất tử (0.65s) và kích hoạt hiệu ứng âm thanh/chữ bay Tiên Phong Huyễn Ảnh.
- [x] **Hệ Thống Choáng & Kháng Khống Chế Boss (Diminishing Returns):**
  - Quái thường bị choáng 0.5s - 0.75s khi trúng đòn thứ 3.
  - Boss có cơ chế `bossImmuneTimer`: Khống chế lần đầu kéo dài 0.45s, sau đó kích hoạt 3.5s miễn nhiễm choáng với hiệu ứng vòng kim quang và chữ `🛡️ KHÁNG CHOÁNG!`.

## 2. GIAI ĐOẠN 2 — LINH CĂN & CÔNG PHÁP TƯƠNG HỢP (HOÀN THÀNH)
- [x] Bảng dữ liệu Ngũ Hành (Kim, Mộc, Thủy, Hỏa, Thổ) và Biến Dị (Lôi, Phong, Băng) với tỉ lệ xuất hiện ngẫu nhiên có trọng số khi tạo nhân vật mới.
- [x] Lưu trữ vĩnh viễn và khôi phục nguyên vẹn thuộc tính linh căn (`type`, `purity`, `elements`) khi tải game.
- [x] Ràng buộc học công pháp nghiêm ngặt trong Hành Trang (`InventoryModal`):
  - Kiểm tra tương thích thuộc tính với linh căn thông qua `checkArtCompatibility`.
  - Nếu tương khắc, cấm học, hiển thị thông báo lỗi trực quan và phát âm thanh phản phệ kinh mạch.
  - Hiển thị huy hiệu trực quan (`✅ Tương Dung` hoặc `❌ Tương Khắc`) ngay trên thẻ chi tiết bí tịch trong túi đồ.

## 3. GIAI ĐOẠN 3 — BOSS AI, TELEGRAPH & CỬA SỔ TRỪNG PHẠT (HOÀN THÀNH)
- [x] **Đa dạng hóa hành vi Boss (Multi-pattern Attacks):**
  - `slam`: Địa Chấn Quyền (AoE 140px, gồng 0.85s, dập đất gây sát thương diện rộng).
  - `charge`: Cuồng Bạo Xung Kích (Lướt 160px tới mục tiêu sau 0.75s gồng đòn).
  - `roar`: Cuồng Hống Ma Khí (Bắn 3 luồng đạn ma khí sau 0.65s gồng đòn).
  - `melee`: Đòn cào cận chiến nhanh.
- [x] **Vùng cảnh báo trực quan (Telegraphs):**
  - Vẽ vòng tròn cảnh báo đỏ, mũi tên chỉ hướng xung kích và văn tự cảnh báo tương ứng trên Canvas 2D (`proceduralRenderer.ts`).
- [x] **Cửa Sổ Trừng Phạt (Punish Window):**
  - Sau đòn nặng (`slam`, `charge`), Boss bị kiệt sức trong 1.2s - 1.4s, xuất hiện sao vàng quay quanh đầu và hiệu ứng khói kiệt lực.
  - Trong thời gian này, Boss nhận thêm **+35% sát thương** kèm chữ hiệu ứng `⚔️ TRỪNG PHẠT! (+35%)`.
- [x] **Boss Enrage (Cuồng Nộ Pha 2):** Khi HP < 50%, Boss tăng 25% tốc độ đánh và giảm thời gian gồng chiêu.
- [x] **Bảo Vệ Đơn Nhận Thưởng (Anti-Duplicate Loot Guard):** `hasGivenRewards` ngăn chặn hoàn toàn việc nhận thưởng trùng lặp khi Boss tử trận.
- [x] **Phần Thưởng First-Kill:** Hạ gục Boss lần đầu nhận thêm 50% Linh Thạch, 50% Tu Vi và Đan Dược Đột Phá thưởng kèm.

## 4. GIAI ĐOẠN 4 — TIẾN TRÌNH CỐT TRUYỆN & THƯỞNG VƯỢT CHƯƠNG (HOÀN THÀNH)
- [x] Chuỗi nhiệm vụ Chương 1 kết nối mượt mà từ Hái Thuốc -> Cổ Ngọc Đồng -> Cứu Mạc Lão -> Luyện Khí Tầng 1 và trảm sát Thiết Bì Trư Vương.
- [x] Đánh bại Boss Chương 1 kích hoạt Modal Thưởng Vượt Chương (`ChapterRewardModal`).
- [x] Cho phép người chơi tự chọn giữa 3 phần thưởng giá trị:
  - **Bí Điển Công Pháp:** Tự động điều chỉnh theo đúng hệ linh căn của người chơi (Hỏa -> Thuần Dương Chân Hỏa Quyết, Thủy -> Huyền Băng Linh Thủy Quyết, v.v.), đảm bảo luôn tương thích 100%.
  - **Bảo Khí Thượng Phẩm:** Huyền Thiết Trảm Ma Kiếm hoặc vũ khí Huyền Phẩm.
  - **Túi Đan Dược Đột Phá:** Trúc Cơ Đan / Bồi Nguyên Đan cao cấp.
- [x] Cờ cốt truyện `chapter_1_completed` được ghi nhận vĩnh viễn vào `player.storyFlags` và tự động lưu game, đảm bảo chỉ nhận thưởng duy nhất 1 lần.

## 5. GIAI ĐOẠN 5 — KIỂM THỬ & TÍNH TOÀN VẸN CỦA DỮ LIỆU LƯU (HOÀN THÀNH)
- [x] `tsc --noEmit` & `compile_applet`: 0 lỗi, build production thành công.
- [x] Dev server chạy ổn định trên cổng 3000.
- [x] Tính đối xứng của Canvas 2D: Toàn bộ ngăn xếp `ctx.save()` / `ctx.restore()` được kiểm tra và cân bằng tuyệt đối (balance = 0).
- [x] Tương thích ngược của `SaveManager`: Cung cấp fallback đầy đủ cho các bản lưu cũ thiếu `storyFlags`, `learnedArtIds`, `elements`.
