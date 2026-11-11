# KẾ HOẠCH XÂY DỰNG PHÂN CẢNH THỬ NGHIỆM THỊ GIÁC (PIXEL_ART_TEST_PLAN.md)
# DỰ ÁN: PHÀM TRẦN TIÊN LỘ

---

## 1. MỤC TIÊU CỐT LÕI CỦA PHÂN CẢNH THỬ NGHIỆM (PIXEL ART SANDBOX SCENE)

Trước khi tiến hành thay thế hàng loạt tài nguyên trên toàn bộ 6 bản đồ lớn của trò chơi, cần xây dựng một **Phân Cảnh Thử Nghiệm Cô Lập (Visual Test Scene / Sandbox Scene)** nhằm:
1. **Kiểm tra tính đồng nhất thị giác (Art Consistency)**: Đảm bảo toàn bộ nhân vật, quái vật, công trình, cây cối, địa hình và hiệu ứng chiến đấu đều tuân thủ chính xác cùng một tỉ lệ pixel, mật độ hạt sắc tố, bảng màu Xianxia Master Palette và phong cách viền nét.
2. **Kiểm chứng hệ thống phân lớp độ sâu (Depth Sorting / Y-Sorting Verification)**: Xác minh nhân vật có thể đi ra trước, đi ra sau công trình/thân cây/cầu mà không bị đè sai lớp hay xuất hiện răng cưa nham nhở.
3. **Đánh giá hiệu năng thực tế trên Android (Performance Baseline)**: Đo đạc tốc độ khung hình (60 FPS), thời gian vẽ mỗi frame ($\le 16.6\text{ms}$), mức chiếm dụng bộ nhớ Texture Atlas ($\le 2048 \times 2048$) trên trình duyệt di động và WebView Capacitor.
4. **Không làm ảnh hưởng đến tiến trình chơi thật**: Sandbox Scene hoạt động độc lập, không ghi đè dữ liệu lưu game (`localStorage / saveManager`), cho phép bật/tắt linh hoạt để phục vụ nghiệm thu.

---

## 2. BỐ CỤC KHÔNG GIAN PHÂN CẢNH THỬ NGHIỆM (SANDBOX MAP LAYOUT)

- **Kích thước bản đồ thử nghiệm**: $25 \times 20$ ô lưới gạch ($800 \times 640\text{px}$ logic).
- **Phân chia khu vực trong Scene**:

```
+-----------------------------------------------------------------------------------+
| [VÙNG 1: KIẾN TRÚC & TIÊN GIA]        | [VÙNG 2: THỰC VẬT & RỪNG TRÚC LINH MỘC]   |
| - 1 Ngôi nhà cổ: Thanh Khê Đình       | - 1 Cây cổ thụ lớn: Cổ Tùng Thụ           |
| - Lồng đèn đỏ treo hiên đong đưa      | - 1 Cụm trúc nhỏ: Trúc Linh Mộc           |
| - Bậc thềm đá tam cấp                 | - Tảng đá chiseled rock gắn linh thạch    |
| - NPC: Lý Đức (Trưởng Thôn) đứng đàm đạo                                          |
+-----------------------------------------------------------------------------------+
| [VÙNG 3: DÒNG SUỐI & CẦU GỖ]                                                      |
| - Nền nước trong vắt (Water Tiles) hoạt ảnh sóng nước cuộn nhẹ 4 frames           |
| - Bèo hoa súng trôi dạt nhẹ nhàng                                                 |
| - 1 Cây cầu gỗ cổ (Rustic Wood Bridge) bắt ngang hai bờ suối                      |
| - Nhân vật có thể đi bộ qua cầu mà chân không bị chìm xuống nước                  |
+-----------------------------------------------------------------------------------+
| [VÙNG 4: KHU VỰC THỬ NGHIỆM CHIẾN ĐẤU & CHIÊU THỨC]                              |
| - 1 Người chơi: Kiếm Tu Lâm Mặc (thử nghiệm Idle, Walk, Run, 3x Attack, Dash)     |
| - 3 Quái vật thông thường:                                                        |
|   + 1 Thanh Khê Dã Lang (Sói rừng 48x48)                                          |
|   + 1 Thiết Bì Dã Trư (Heo rừng 64x48)                                            |
|   + 1 Hắc Sát Ma Đồ (Tà tu ma giáo 48x64)                                         |
| - 1 Boss Yêu Thú:                                                                 |
|   + Bạch Mao Viên Hầu (Cự vượn 128x128) thử nghiệm Húc (Charge) va vào đá         |
| - Hiệu ứng kỹ năng thi triển:                                                     |
|   + Vệt kiếm khí gió (Wind Sword Slash)                                           |
|   + Vết chém lửa rực cháy (Fire Arc Slash)                                        |
|   + Tia sét giáng xuống (Lightning Strike)                                        |
|   + Điểm tóe lửa va chạm (Impact Sparks)                                          |
+-----------------------------------------------------------------------------------+
```

---

## 3. DANH SÁCH THỰC THỂ & TÀI NGUYÊN KIỂM THỬ (TEST ENTITY ROSTER)

| Nhóm Thực thể | Tên Tài nguyên | Kích thước Frame (px) | Mục tiêu kiểm chứng chất lượng |
|---|---|---|---|
| **Player** | Lâm Mặc (Kiếm Tu) | $64 \times 64$ | Thử nghiệm 10 animations, kiếm sau lưng, vạt áo bay, lướt né không vỡ pixel. |
| **NPC** | Lý Đức (Trưởng Thôn) | $48 \times 64$ | Kiểm tra tỷ lệ so với nhân vật chính ($1.65\text{m}$ vs $1.75\text{m}$), râu tóc, gậy trúc. |
| **Quái thường 1** | Thanh Khê Dã Lang | $48 \times 48$ | Chuyển động 4 chân của thú săn mồi, vệt mắt lam quang. |
| **Quái thường 2** | Thiết Bì Dã Trư | $64 \times 48$ | Cảm giác nặng nề, cơ bắp cuồn cuộn, nanh nhọn cong vút. |
| **Quái thường 3** | Hắc Sát Ma Đồ | $48 \times 64$ | Tà khí cuồn cuộn, trượng đầu lâu, đối lập với nét thanh nhã của Lâm Mặc. |
| **Boss** | Bạch Mao Viên Hầu | $128 \times 128$ | Tỉ lệ khổng lồ ($3.5\text{m}$), chuyển động gầm thét, lướt húc cày mặt đất. |
| **Kiến trúc** | Thanh Khê Đình | $128 \times 128$ | Mái ngói cong âm dương, cột gỗ sơn then, nhân vật đi trước và sau nhà. |
| **Cây lớn** | Cổ Tùng Thụ | $128 \times 160$ | Tán lá kim xếp tầng che bóng mát, tán cây che đầu nhân vật khi đi phía sau. |
| **Cây nhỏ** | Trúc Linh Mộc | $32 \times 96$ | Độ thanh mảnh, thân trúc có đốt, cành lá đong đưa. |
| **Công trình** | Cầu Gỗ Mộc Cổ | $96 \times 64$ | Độ cao mặt cầu, bóng đổ xuống dòng nước, lối đi traversable an toàn. |
| **Địa hình** | Ground & Grass Tiles | $32 \times 32$ | Sự liền mạch không lộ vết ghép ô, đốm linh thảo viền tối hữu cơ. |
| **Mặt nước** | Water & Lotus Pad | $32 \times 32$ | Hoạt ảnh 4 frame sóng nước nhấp nhô, gờ bờ suối sỏi đá. |
| **VFX Kiếm** | Thanh Phong Kiếm Khí | $64 \times 64$ | Vệt trăng khuyết sắc nhọn, tan biến trong 4 frames không nhòe. |
| **VFX Lửa** | Hỏa Diễm Kiếm Trảm | $64 \times 64$ | Cảm giác bùng cháy rực rỡ, tàn than bay lên trời. |
| **VFX Sét** | Lôi Đình Nhất Kích | $48 \times 96$ | Tia chớp zigzag giáng thẳng đứng từ trên trời xuống điểm va chạm. |

---

## 4. BẢNG TIÊU CHÍ KIỂM TRA CHẤT LƯỢNG THỊ GIÁC (VISUAL AUDIT CHECKLIST)

Mỗi tài nguyên đưa vào Sandbox Scene phải vượt qua $100\%$ các tiêu chí kiểm tra sau:

- [ ] **1. Đồng nhất tỉ lệ Pixel (Pixel Ratio Uniformity)**:
  - Tất cả pixel trên màn hình đều có kích thước thực tế đúng bằng bội số nguyên ($3\times$ trên màn hình 1080p).
  - Không có tình trạng pixel "mẹ" to, pixel "con" nhỏ trên cùng một khung hình.
- [ ] **2. Khử mờ tuyệt đối (Zero Blurring / Crisp Outlines)**:
  - Bật phóng to $400\%$: Mọi đường viền đều sắc cạnh, chuyển bậc theo tỉ lệ 1-1-2 pixel mượt mà, không có hiệu ứng antialiasing làm mờ mép ngoài.
- [ ] **3. Bảng màu thuần khiết (Palette Coherence)**:
  - Mọi pixel đều nằm trong danh mục màu của Xianxia Master Color Palette.
  - Không có các dải màu chuyển sắc gradient tự động (no smooth procedural gradients).
- [ ] **4. Điểm tựa (Pivot Consistency)**:
  - Khi nhân vật xoay 4 hướng hoặc chuyển đổi giữa Idle $\rightarrow$ Walk $\rightarrow$ Attack, bàn chân không bị trượt hoặc giật lệch vị trí gốc.
- [ ] **5. Bóng đổ tiếp đất (Contact Shadow Standard)**:
  - Mọi sinh vật và vật cản đều có bóng đổ elip mờ nằm phẳng trên mặt đất, hướng chếch về góc dưới phải ($135^\circ$).
- [ ] **6. Phân lớp Y-Sorting (Depth Sorting Integrity)**:
  - Nhân vật đứng trước thân cây: Thân cây nằm sau lưng nhân vật.
  - Nhân vật bước lên phía trên gốc cây: Tán cây che khuất phần đầu/vai nhân vật một cách tự nhiên.
  - Nhân vật đi qua cửa nhà Thanh Khê Đình: Mái ngói che khuất phía trên đỉnh đầu, nền bệ đá nâng bàn chân lên đúng cao độ.

---

## 5. KỊCH BẢN THỬ NGHIỆM TƯƠNG TÁC (INTERACTIVE TEST SCENARIOS)

1. **Kịch bản 1: Thử nghiệm Chuyển Động & Thân Pháp (Locomotion Test)**:
   - Điều khiển Lâm Mặc đi bộ và chạy nhanh quanh cụm cây Cổ Tùng Thụ và nhà Thanh Khê Đình.
   - Quan sát tà trường bào bay, kiểm tra bóng đổ và sự mượt mà của chân bước ở tần số quét màn hình 60Hz và 120Hz.
2. **Kịch bản 2: Thử nghiệm Lướt Né Sát Vật Cản (Dash & Obstacle Test)**:
   - Hướng mặt vào vách tường nhà hoặc tảng đá ở khoảng cách 5px, bấm nút Né (Dash).
   - Kiểm tra nhân vật dừng an toàn ngay trước vật cản theo thuật toán Swept Collision P0 đã cài đặt, không bị kẹt hay xuyên vào trong nhà.
3. **Kịch bản 3: Thử nghiệm Băng Qua Cầu (Bridge Traversal Test)**:
   - Đi từ bờ đất phía Bắc qua cầu gỗ sang bờ đất phía Nam.
   - Kiểm tra nhân vật hiển thị nổi trên mặt ván cầu và trên dòng nước suối, không bị rơi xuống nước hoặc bị nước suối đè lên người.
4. **Kịch bản 4: Thử nghiệm Combo Đòn Đánh & Hiệu Ứng Kiếm Khí (Combat VFX Test)**:
   - Đứng trước quái Dã Lang, bấm chuỗi 3 đòn đánh: Trảm $\rightarrow$ Thứ $\rightarrow$ Hoành tảo.
   - Kiểm tra vệt kiếm khí xuất hiện đúng tọa độ lưỡi kiếm, hiệu ứng tóe lửa (impact sparks) lóe sáng chính xác tại điểm tiếp xúc trên thân quái vật.
5. **Kịch bản 5: Thử nghiệm Boss Charge & Va Chạm Địa Hình (Boss Impact Test)**:
   - Kích hoạt trạng thái Húc (Charge) của Boss Bạch Mao Viên Hầu hướng về phía tảng đá lớn.
   - Boss lướt mượt qua nhiều frame, va chạm vào đá dừng lại an toàn, màn hình rung lên và hiển thị thông báo trừng phạt chính xác.

---

## 6. TIÊU CHUẨN ĐO LƯỜNG HIỆU NĂNG TRÊN ANDROID (PERFORMANCE BENCHMARK)

- **Tốc độ khung hình (Frame Rate)**: Ổn định $\ge 58 - 60\text{ FPS}$ liên tục trong suốt 5 phút kiểm thử tương tác.
- **Thời gian xử lý vòng lặp Render (Frame Budget)**: $\le 8.5\text{ms} / 16.6\text{ms}$ (dư dả $50\%$ công suất CPU/GPU cho logic game và hệ điều hành).
- **Bộ nhớ Texture Atlas (VRAM Consumption)**: $\le 16\text{MB}$ cho toàn bộ các spritesheets của Test Scene.
- **Số lệnh vẽ Canvas (Draw Calls Budget)**: $\le 80$ lệnh `drawImage` mỗi frame (nhờ áp dụng Offscreen Canvas đệm cho nền đất tĩnh).

---

## 7. QUY TRÌNH NGHIỆM THU & BÀN GIAO (ACCEPTANCE PROTOCOL)

Phân cảnh thử nghiệm này được coi là **ĐẠT CHUẨN (PASSED)** khi và chỉ khi:
1. Đạt được sự nhất trí tuyệt đối về thẩm mỹ Tiên Hiệp cổ phong giữa Game Director và Art Lead.
2. Không còn bất kỳ hình khối procedural vector nào xuất hiện trên màn hình thử nghiệm.
3. Không phát sinh bất kỳ lỗi console, rách hình hoặc tụt khung hình trên thiết bị Android mục tiêu.
