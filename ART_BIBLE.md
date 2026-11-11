# ART BIBLE – TIÊU CHUẨN NGHỆ THUẬT PIXEL ART ĐẲNG CẤP CAO
# DỰ ÁN: PHÀM TRẦN TIÊN LỘ (MORTAL CULTIVATION ROAD)

---

## 1. TỔNG QUAN ĐỊNH HƯỚNG NGHỆ THUẬT (OVERALL ART DIRECTION)

### 1.1 Tôn chỉ cốt lõi: Premium HD Pixel Art – Chinese Xianxia Action RPG
- **Thể loại**: 2D Top-Down Action Role-Playing Game (ARPG) đề tài Tiên Hiệp Tu Chân cổ điển.
- **Tư tưởng thẩm mỹ**: Bám sát tinh thần nguyên tác *"Phàm Nhân Tu Tiên"* của Vong Ngữ – một thế giới tu tiên lãnh khốc, chân thực, trầm mặc nhưng hàm chứa linh khí kỳ ảo.
- **Phong cách thị giác (Visual Style)**: **Premium HD Pixel Art**. 
  - Kết hợp độ chi tiết cao của nghệ thuật Pixel Art thời kỳ hoàng kim với nét thủy mặc cổ phong Trung Hoa (Chinese Ink-Wash meets High-Detail Pixel Art).
  - Màu sắc có chiều sâu, tương phản tinh tế, bề mặt vật liệu tự nhiên (đá hoa cương cổ, ngói lưu ly, gỗ trầm hương, tơ lụa thô mộc, linh ngọc phát quang).
- **Quy tắc bất di dịch (Anti-Patterns)**:
  - ❌ **Tuyệt đối KHÔNG sử dụng Chibi Anime dễ thương phong cách Nhật Bản** (đầu to mình nhỏ 2 đầu, mắt to long lanh, biểu cảm biến hình).
  - ❌ **Tuyệt đối KHÔNG pha trộn Vector Art / Flash Art phẳng** vào môi trường Pixel Art.
  - ❌ **Tuyệt đối KHÔNG lạm dụng hiệu ứng Neon / Cyberpunk phát sáng gắt** (glow bão hòa xanh/tím rẻ tiền).
  - ❌ **Tuyệt đối KHÔNG tiếp tục sử dụng các hình khối vẽ mã code Canvas (procedural primitives: arc, rect, bezier đơn giản) làm đồ họa chính thức của sản phẩm thương mại.**
  - ❌ **Không sao chép nguyên mẫu hay thiết kế tổng thể của bất kỳ tựa game thương mại nào trên thị trường.**

---

## 2. GÓC NHÌN & CAMERA (CAMERA AND PERSPECTIVE)

### 2.1 Góc nhìn 3/4 Top-Down Oblique (Dimetric / Xianxia 2.5D Perspective)
- **Góc nghiêng Camera**: Cố định ở góc **$60^\circ - 65^\circ$** so với mặt đất nằm ngang.
- **Tỉ lệ nén trục dọc (Y-Axis Depth Compression)**: 
  - Hệ số nén: **$0.75 - 0.8$** trên mặt phẳng chiếu ngang.
  - Một bước di chuyển thẳng đứng $1.0\text{m}$ sẽ chiếm khoảng cách hiển thị bằng $75\% - 80\%$ so với bước di chuyển ngang trục X.
  - Giữ cảm giác chiều sâu 2.5D: Mặt đất thoải dần về phía chân trời, vách tường và thân cây đứng thẳng đứng ($90^\circ$ vuông góc với phương ngang màn hình).
- **Hành vi Camera**:
  - Camera bám theo nhân vật chính (Smooth Follow với Exponential Smoothing đã tinh chỉnh độc lập FPS).
  - Giữ nguyên camera top-down 3/4 hiện tại của trò chơi, **tuyệt đối KHÔNG chuyển đổi sang màn hình ngang (side-scrolling)**.
  - Camera Deadzone: Vùng trung tâm $48 \times 32\text{px}$ cho phép nhân vật quay người và dịch chuyển nhẹ mà không gây rung màn hình.

---

## 3. TỈ LỆ THẾ GIỚI (WORLD SCALE)

### 3.1 Hệ quy chiếu không gian
- **1 Đơn vị Ô Lưới Cơ Sở (Base Tile Unit)** = **$32 \times 32\text{px}$**.
- **1 Mét Logic In-Game ($\approx 1\text{m}$)** $\approx$ **$32\text{px}$**.
- **Bán kính Hitbox người chơi (Collision Radius)**: $14\text{px} - 16\text{px}$ (vừa vặn lọt qua lối đi 1 ô gạch $32\text{px}$ khi đi thẳng, lối đi $48\text{px}-64\text{px}$ cho góc cua).

### 3.2 Tỉ lệ kích thước thực thể so với thế giới
| Thực thể / Đối tượng | Kích thước Logic (px) | Kích thước Chiều Cao Pixel | Tương đương trong thế giới |
|---|---|---|---|
| **Người chơi (Lâm Mặc)** | $32 \times 48\text{px}$ trong canvas $64 \times 64\text{px}$ | $\approx 46 - 48\text{px}$ (đến chỏm tóc) | $1.72\text{m} - 1.75\text{m}$ (Thanh niên tu sĩ) |
| **NPC Trưởng Thôn (Lý Đức)** | $32 \times 48\text{px}$ | $\approx 44\text{px}$ (hơi còng, gậy trúc $46\text{px}$) | $1.65\text{m}$ (Lão nhân phàm tục) |
| **NPC Mạc Lão (Đại năng)** | $32 \times 52\text{px}$ | $\approx 50\text{px}$ (dáng tiên phong đạo cốt) | $1.78\text{m}$ (Trường bào thụng) |
| **Dã Lang (Sói rừng)** | $48 \times 32\text{px}$ | $\approx 24 - 28\text{px}$ | $0.85\text{m}$ (Chiều cao vai thú 4 chân) |
| **Thiết Bì Dã Trư (Heo rừng)** | $48 \times 40\text{px}$ | $\approx 32 - 36\text{px}$ | $1.10\text{m}$ (Thân hình vạm vỡ, giáp đá gai) |
| **Hắc Sát Ma Đồ (Tà tu)** | $36 \times 50\text{px}$ | $\approx 48\text{px}$ | $1.75\text{m}$ (Áo choàng quạ đen) |
| **Boss Bạch Mao Viên Hầu** | $80 \times 96\text{px}$ trong canvas $128 \times 128\text{px}$ | $\approx 92 - 96\text{px}$ | $3.2\text{m} - 3.5\text{m}$ (Cự viên khổng lồ gấp đôi người) |
| **Cây Trúc Linh Mộc (Nhỏ)** | $32 \times 96\text{px}$ ($1 \times 3$ tiles) | $\approx 88 - 92\text{px}$ | $3.0\text{m}$ |
| **Cổ Tùng Thụ (Cây cổ thụ lớn)**| $128 \times 160\text{px}$ ($4 \times 5$ tiles) | $\approx 150 - 156\text{px}$ | $5.0\text{m} - 5.5\text{m}$ |
| **Thanh Khê Đình (Nhà thôn)** | $128 \times 128\text{px}$ ($4 \times 4$ tiles) | $\approx 120\text{px}$ | $4.0\text{m}$ |
| **Đại Điện Môn Phái (Tông môn)** | $256 \times 224\text{px}$ ($8 \times 7$ tiles) | $\approx 210\text{px}$ | $7.0\text{m}$ |

---

## 4. ĐỘ PHÂN GIẢI PIXEL & KHẢ NĂNG HIỂN THỊ (PIXEL RESOLUTION)

### 4.1 Độ phân giải hiển thị mục tiêu (Target Android Resolution)
- **Thiết bị mục tiêu**: Android tầm trung (Mid-range, RAM 6–8GB, GPU Adreno 610/618/619 hoặc Mali-G57/G68, tần số quét 60Hz/90Hz/120Hz).
- **Độ phân giải nội bộ Canvas ảo (Virtual Logical Viewport)**:
  - Tỉ lệ khung hình chuẩn: **16:9** (hoặc 19.5:9 / 20:9 trên điện thoại viền mỏng).
  - Độ phân giải gốc Canvas: **$640 \times 360\text{px}$** (hoặc $854 \times 480\text{px}$ cho màn hình HD rộng).
- **Hệ số phóng đại điểm ảnh (Pixel Scale Factor)**:
  - Trên màn hình $1920 \times 1080\text{px}$ (FHD): Scale nguyên tỉ lệ **$3\times$** ($640 \times 360 \times 3 = 1920 \times 1080$).
  - Trên màn hình $2400 \times 1080\text{px}$ (FHD+): Chiều dọc giữ nguyên scale $3\times$ ($360\text{px}$ render thành $1080\text{px}$), chiều ngang mở rộng trường nhìn camera thành $800\text{px}$ logic ($800 \times 3 = 2400\text{px}$).

### 4.2 Kỹ thuật Render Nearest Neighbor
- Tất cả bối cảnh Canvas 2D phải thiết lập:
  ```typescript
  ctx.imageSmoothingEnabled = false;
  canvas.style.imageRendering = 'pixelated'; // Hoặc 'crisp-edges'
  ```
- **Không làm nhòe (No Blurring)**: Tuyệt đối không để xảy ra hiện tượng khử răng cưa mờ (linear interpolation / subpixel blur).
- **Pixel Perfection**: Không di chuyển thực thể theo tọa độ float vô tỉ gây méo điểm ảnh. Tọa độ render làm tròn tới số nguyên (`Math.round(x)`, `Math.round(y)`).

---

## 5. TỈ LỆ NHÂN VẬT (CHARACTER PROPORTIONS)

### 5.1 Tỉ lệ Đầu - Thân (3.8 – 4.2 Heads Tall)
Khác biệt hoàn toàn với pixel art Chibi 2 đầu phương Tây hoặc phong cách Chibi Anime, nhân vật tu tiên sử dụng tỉ lệ **Semi-Realistic Xianxia Stylized**:
- **Tổng chiều cao**: 46–48 pixel.
- **Tỉ lệ phân chia**:
  - **Đầu & Búi tóc**: 11 pixel ($23\%$).
  - **Cổ & Vai ngực**: 7 pixel ($15\%$).
  - **Thân áo & Đai lưng ngọc**: 12 pixel ($25\%$).
  - **Tà trường bào & Chân bước**: 16–18 pixel ($37\%$).
- **Đặc trưng nhận diện**:
  - Búi tóc cao cắm trâm ngọc (hoặc trâm gỗ dã thôn), lọn tóc huyền dài buông qua vai.
  - Tà trường bào thụng bay nhẹ theo nhịp bước đi.
  - Dải ngọc bội (Jade Pendant) buông rủ từ thắt lưng, chuyển động nhẹ nhàng khi dừng hoặc đi.
  - Sau lưng mang bao kiếm cổ bằng da hoặc linh kiếm phi hành.

---

## 6. QUY CHUẨN SPRITE (SPRITE STANDARDS)

### 6.1 Khung bao (Canvas Frame) & Kích thước cơ sở
- **Tile**: $32 \times 32\text{px}$ chính xác.
- **Player (Nhân vật chính)**: Frame kích thước **$64 \times 64\text{px}$**.
  - Phần thân chiếm vùng trung tâm $32 \times 48\text{px}$.
  - Khoảng đệm $16\text{px}$ xung quanh dành cho: vung kiếm chém, tà áo bay rộng, kiếm khí phát quang.
- **Quái vật thường (Regular Enemy)**: Frame **$48 \times 48\text{px}$** hoặc **$64 \times 64\text{px}$**.
- **Boss (Thủ lĩnh yêu thú)**: Frame **$96 \times 96\text{px}$** đến **$128 \times 128\text{px}$**.
- **Công trình (Buildings & Architecture)**: Kích thước đa bội của $32\text{px}$ ($96 \times 96$, $128 \times 128$, $160 \times 192$, $256 \times 224\text{px}$).

### 6.2 Quy chuẩn Kỹ thuật Asset
1. **Định dạng**: File `.png` 32-bit với kênh Alpha trong suốt hoàn toàn (Transparent PNG). Không dùng định dạng nén làm mất chất pixel như JPEG.
2. **Điểm tựa nhất quán (Consistent Pivot Point)**:
   - Tất cả sinh vật (Player, NPC, Quái, Boss) đều đặt Pivot tại **Điểm chạm đất giữa hai bàn chân (Feet Contact Point)**.
   - Vị trí chuẩn hóa (Normalized Pivot): `[X: 0.5, Y: 0.875]` trên khung $64 \times 64\text{px}$ (tương ứng tọa độ pixel `(32, 56)`).
   - Với chướng ngại vật (Cây, Đá, Nhà): Pivot tại đáy bóng đổ tiếp xúc mặt đất.
3. **Quy tắc viền nét (Outlining Rule)**:
   - Sử dụng **Dark Colored Outline** (viền tối màu có sắc thái, thay vì màu đen tuyền `#000000` gắt).
   - Màu viền chuẩn: Xanh mực đậm `#0b132b`, Nâu chàm `#1c120c`, hoặc Tím huyền ma đạo `#1a0c2e` dày đúng $1\text{px}$.
   - Tránh "Double Pixel" / "Jaggies" ở các đường cong: Mỗi góc đổi hướng chuyển pixel mượt mà theo tỉ lệ 1-1-2-3 pixel.

---

## 7. BẢNG ĐẶC TẢ ANIMATION (ANIMATION SPECIFICATIONS)

Toàn bộ hoạt ảnh sử dụng 4 hướng: **Xuống (Down - Mặt trước)**, **Lên (Up - Lưng sau)**, **Phải (Side/Right)**. Hướng **Trái (Left)** được tạo tự động bằng phép lật ngang đối xứng (`flipX`) giúp tiết kiệm $25\%$ dung lượng bộ nhớ Texture Atlas trên thiết bị di động.

### 7.1 Nhân vật chính (Player - Kiếm Tu Lâm Mặc)
| Hoạt ảnh (State) | Frame Count | Tốc độ (FPS) | Looping | Hướng | Pivot | Ghi chú & Cảm giác chuyển động |
|---|---|---|---|---|---|---|
| **Idle** (Thở/Đứng thủ) | 6 frames | 6 FPS | Loop | Down / Up / Side | [0.5, 0.875] | Ngực nhấp nhô nhẹ 1px, tà áo bay êm ái, ánh mắt sắc sảo. |
| **Walk** (Đi bộ) | 8 frames | 10 FPS | Loop | Down / Up / Side | [0.5, 0.875] | Dáng bước thanh thoát, tà áo xẻ vung theo nhịp chân, ngọc bội đung đưa. |
| **Run** (Chạy nhanh) | 8 frames | 12 FPS | Loop | Down / Up / Side | [0.5, 0.875] | Người ngả trước $12^\circ$, trường bào bay phần phật, có vệt gió nhẹ ở chân. |
| **Attack 1** (Trảm kích) | 5 frames | 14 FPS | One-shot | Down / Up / Side | [0.5, 0.875] | Chém chéo từ vai xuống, xuất hiện kiếm khí lam quang hình bán nguyệt. |
| **Attack 2** (Thứ kiếm) | 5 frames | 14 FPS | One-shot | Down / Up / Side | [0.5, 0.875] | Đâm thẳng chớp nhoáng, thân kiếm kéo dài vệt sáng mũi tên xuyên thấu. |
| **Attack 3** (Hoành tảo) | 6 frames | 15 FPS | One-shot | Down / Up / Side | [0.5, 0.875] | Xoay người $360^\circ$ chém quét ngang, kiếm khí tỏa rộng toàn phần. |
| **Dodge / Dash** (Né) | 4 frames | 16 FPS | One-shot | Down / Up / Side | [0.5, 0.875] | Thân pháp lướt nhanh, để lại 2 tàn ảnh mờ (Afterimage ghosting). |
| **Skill** (Thi triển pháp thuật)| 8 frames | 12 FPS | One-shot | Down / Up / Side | [0.5, 0.875] | Kết ấn tay, bùa chú bay lượn quanh thân, phóng ra linh kiếm/lôi điện. |
| **Hit** (Bị trúng đòn) | 3 frames | 12 FPS | One-shot | Down / Up / Side | [0.5, 0.875] | Khựng người bật lùi 2px, lóe sáng trắng (White flash 1 frame), áo rách nhẹ. |
| **Death** (Tử vong / Trọng thương) | 8 frames | 8 FPS | Hold last | Down / Up / Side | [0.5, 0.875] | Khuỵu gối, chống kiếm xuống đất, tan biến thành đốm linh quang mờ ảo. |

### 7.2 Quái vật thông thường (Regular Enemies - Yêu Thú)
*(Ví dụ: Thanh Khê Dã Lang, Thiết Bì Dã Trư, Hắc Sát Ma Đồ)*
| Hoạt ảnh (State) | Frame Count | Tốc độ (FPS) | Looping | Hướng | Pivot | Ghi chú & Cảm giác chuyển động |
|---|---|---|---|---|---|---|
| **Idle** | 4 frames | 5 FPS | Loop | Down / Side | [0.5, 0.875] | Hơi thở gầm gừ, móng vuốt cào đất, mắt dã thú chớp đỏ. |
| **Walk / Chase** | 6 frames | 10 FPS | Loop | Down / Side | [0.5, 0.875] | Chân thú bước dồn dập hoặc tà tu bay lướt sát mặt đất. |
| **Attack** | 6 frames | 12 FPS | One-shot | Down / Side | [0.5, 0.875] | Thu mình lấy đà (Windup 2 frames) $\rightarrow$ Vồ cắn chém chớp nhoáng. |
| **Hit** | 2 frames | 10 FPS | One-shot | Down / Side | [0.5, 0.875] | Giật nảy lùi lại, lóe viền đỏ máu. |
| **Death** | 6 frames | 10 FPS | Hold last | Down / Side | [0.5, 0.875] | Ngã quỵ, máu đen/yêu khí bốc lên, tan biến để lại túi chiến lợi phẩm. |

### 7.3 Boss (Bạch Mao Viên Hầu / Yêu Vương)
| Hoạt ảnh (State) | Frame Count | Tốc độ (FPS) | Looping | Hướng | Pivot | Ghi chú & Cảm giác chuyển động |
|---|---|---|---|---|---|---|
| **Idle** | 6 frames | 6 FPS | Loop | Down / Side | [0.5, 0.90] | Lồng ngực cự viên phập phồng uy dũng, lông trắng dựng đứng theo gió. |
| **Walk** | 8 frames | 8 FPS | Loop | Down / Side | [0.5, 0.90] | Bước đi bằng 2 chân và 2 tay vượn khổng lồ, mỗi bước rung mặt đất. |
| **Charge** (Húc sấm sét) | 6 frames | 14 FPS | Loop | Down / Side | [0.5, 0.90] | Cúi rạp người lao vun vút như đạn đại bác, đất đá cày tung hai bên sườn. |
| **Attack (Đấm đè/Vung tát)**| 8 frames | 12 FPS | One-shot | Down / Side | [0.5, 0.90] | Vung cẳng tay lông lá tát quét ngang diện rộng hoặc đấm dập đất. |
| **Special Skill (Gầm Cuồng Bạo)**| 10 frames | 10 FPS | One-shot | Down / Side | [0.5, 0.90] | Hai tay đấm ngực u uỳnh, ngửa mặt thét gầm, sóng xung kích tỏa vòng tròn. |
| **Hit / Stun (Choáng váng)** | 4 frames | 8 FPS | Loop | Down / Side | [0.5, 0.90] | Ôm đầu lảo đảo, sao vàng hoặc tia sét nhỏ quay quanh đỉnh đầu. |
| **Death** | 12 frames | 8 FPS | Hold last | Down / Side | [0.5, 0.90] | Gầm thét tuyệt vọng, thân xác khổng lồ ầm ầm đổ sập, linh quang vỡ tung. |

---

## 8. QUY CHUẨN MÔI TRƯỜNG & TILESET (ENVIRONMENT & TILESET STANDARDS)

### 8.1 Hệ thống Nhóm Tài nguyên Môi trường
- **Ground Tiles (Nền đất)**: 
  - Nền đất sương mù Thanh Khê `#4f6b64`, đất mùn ẩm ướt `#5c4d3c`, phiến đá hoa cương quảng trường tông môn `#334155`.
  - Không có hoa văn lặp thô kệch; bề mặt có hạt sắc tố tự nhiên ngẫu nhiên.
- **Grass (Thảm cỏ linh thảo)**:
  - Cỏ tự nhiên dạng khóm lá nhọn viền tối mọc theo cụm hữu cơ 3–5 lá, điểm xuyết đốm linh khí ngọc bích.
- **Water (Mặt nước)**:
  - Nước suối trong vắt lộ sỏi dưới đáy, gờ bờ nước có bọt sóng trắng viền pixel.
  - Hoạt ảnh sóng nước cuộn nhẹ 4 frames looping.
- **Forest & Flora (Cây cối & Thảm thực vật)**:
  - Cổ tùng linh thụ (Pine): Tán lá kim xếp tầng như mây xanh thẫm, thân gỗ nâu trầm có vết nứt vỏ thời gian.
  - Trúc lâm (Bamboo): Thân xanh ngọc mảnh khảnh có đốt rõ nét, ngọn trúc hơi cong đong đưa theo gió.
- **Rocks (Đá & Khoáng thạch)**:
  - Đá bazan cắt gọt đa giác sắc cạnh, có mặt sáng - tối rõ ràng (Chiseled Rock).
  - Vỉa quặng Huyền Thiết, Xích Đồng mọc các tinh thể linh thạch góc cạnh phát quang dịu.
- **Buildings & Temples (Kiến trúc Tiên Cổ)**:
  - Mái ngói cong vút kiểu âm dương (Curved Eaves), rui mè gỗ lim đỏ son, móng bệ đá 3 bậc tam cấp.
  - Lồng đèn đỏ (Red Lanterns) treo dưới mái hiên đu đưa nhẹ 1–2px theo chu kỳ con lắc.
- **Bridges (Cầu qua suối)**:
  - Cầu ván gỗ mộc đan dây thừng hoặc cầu vòm đá rêu phong bắc qua khe suối.

### 8.2 Quy tắc Phân lớp & Depth Sorting (Y-Sorting Architecture)
Để triệt tiêu hoàn toàn hiện tượng nhân vật đi xuyên qua cây hoặc bị mái nhà đè sai vị trí:
```
+-------------------------------------------------------------+
| Layer 6: UI & HUD Canvas (Health, Skills, Minimap, Dialogues)|
+-------------------------------------------------------------+
| Layer 5: Screen Tone & Weather (Fog, Rain, Lighting Multiply)|
+-------------------------------------------------------------+
| Layer 4: Spell & Particle VFX (Sword beams, Magic circles)  |
+-------------------------------------------------------------+
| Layer 3: Overhead Eaves & Tree Canopies (Y > entity head)   |  <- Che khuất khi nhân vật đi ra sau
+-------------------------------------------------------------+
| Layer 2: Y-Sorted Entities (Player, Enemies, NPCs, Trunks)   |  <- Sắp xếp theo Feet Y (Z-Index tự động)
+-------------------------------------------------------------+
| Layer 1: Ground Decals & Paths (Footprints, Cobblestone)     |
+-------------------------------------------------------------+
| Layer 0: Ground Base Tiles & Water Bodies                   |
+-------------------------------------------------------------+
```
- **Nguyên tắc Y-Sorting**: 
  Mỗi thực thể trên Layer 2 được vẽ theo thứ tự tăng dần của tọa độ chân tiếp đất:
  $$\text{RenderOrder} = \text{Entity.Y} + \text{PivotOffsetY}$$
  Thực thể nào ở phía dưới màn hình hơn sẽ tự động vẽ đè lên thực thể ở phía trên.

---

## 9. QUY CHUẨN HIỆU ỨNG CHIẾN ĐẤU & LINH CĂN (VFX STANDARDS)

Mỗi hệ ngũ hành và kiếm chiêu đều tuân thủ bảng màu riêng biệt và phong cách tạo hình chuyển động mạnh mẽ (Impactful Keyframing):

### 9.1 Bảng màu ngũ hành linh căn
| Linh Căn / Nguyên Tố | Bảng màu chính (Palette Hex) | Hình dáng kiếm khí & Hiệu ứng |
|---|---|---|
| **Kiếm Khí Cơ Bản (Phong)** | Trắng mây `#f8fafc`, Thanh lam `#38bdf8`, Xanh biển `#0284c7` | Vệt trăng khuyết sắc như dao cạo, tàn ảnh gió lốc xoáy nhẹ. |
| **Hỏa Hệ (Lửa)** | Đỏ chu sa `#dc2626`, Cam lửa `#ea580c`, Vàng chói `#fde047` | Ngọn lửa cuộn trào có đốm than hoa bốc lên trời, vệt kiếm rực cháy. |
| **Lôi Hệ (Sấm Sét)** | Tím lôi điện `#a855f7`, Xanh tím `#6366f1`, Trắng chớp `#ffffff` | Tia sét zigzag sắc nhọn gãy góc 1px, nổ đốm hồ quang điện khi chạm bia. |
| **Băng Hệ (Băng Tuyết)** | Trắng băng `#f0fdf4`, Lam ngọc băng `#06b6d4`, Xanh băng tuyết `#bae6fd`| Tinh thể băng lục giác vỡ vụn, vệt sương giá đóng băng mặt đất. |
| **Mộc Hệ (Thảo Mộc)** | Xanh lục ngọc `#059669`, Lục tươi `#10b981`, Xanh non `#6ee7b7` | Dây leo linh mộc quấn quanh, cánh hoa đào bay lượn hộ thể. |
| **Thổ Hệ (Đất Đá)** | Nâu đất `#78350f`, Vàng cát `#d97706`, Xám nham thạch `#475569` | Khiên chắn đá bay xung quanh, gai nhọn đá nhô lên từ lòng đất. |
| **Ma Đạo (Hắc Ám)** | Đen mực `#090d16`, Đỏ huyết ngọc `#881337`, Tím sẫm `#3b0764` | Hắc khí cuồn cuộn dạng ma trảo (móng vuốt quỷ), mắt đỏ lóe sáng. |

### 9.2 Quy chuẩn Hoạt ảnh Hiệu ứng
- **Kiếm Khí (Slash Arcs)**: Độ dài 3–4 frames. Frame 1: Vung kiếm tích năng lượng (Anticipation) $\rightarrow$ Frame 2: Vệt chém cực đại che góc $120^\circ$ $\rightarrow$ Frame 3–4: Tan biến thành tia linh khí nhỏ.
- **Va Chạm Đòn Đánh (Impact Sparks)**: Đốm sáng 4 cánh sao nhọn nở ra trong 3 frames khi trúng mục tiêu, kèm hiệu ứng khựng hình (Hit-stop $0.05\text{s}$ trên mục tiêu).
- **Pháp Trận (Magic Circles)**: Hoa văn Bát Quái trận (Âm Dương Ngư, Càn Khảm Cấn Chấn) vẽ dạng pixel tròn đồng tâm sắc nét, tự xoay nhẹ $1^\circ$ mỗi frame.

---

## 10. HỆ THỐNG ÁNH SÁNG & ĐỔ BÓNG (LIGHTING AND SHADING)

### 10.1 Góc chiếu sáng nhất quán (Global Light Vector)
- **Nguồn sáng mặt trời/mặt trăng**: Cố định từ hướng **Tây Bắc (Top-Left)** chếch xuống **Đông Nam (Bottom-Right)** ở góc **$135^\circ$**.
- Mọi công trình, thân cây, phiến đá đều có cạnh trên-trái sáng nhất (Highlight) và cạnh dưới-phải đổ bóng tối (Shadow).
- **Bóng đổ tiếp đất (Contact Shadow)**:
  - Mọi thực thể sống đều có một bóng đổ hình elip mờ nằm phẳng trên mặt đất ngay dưới chân:
    ```typescript
    ctx.fillStyle = 'rgba(10, 15, 29, 0.42)'; // Mực lam tối trong suốt
    ctx.beginPath();
    ctx.ellipse(cx, cy, width * 0.4, height * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ```

### 10.2 Ánh sáng cục bộ (Point Lights & Day/Night Cycle)
- Lồng đèn đỏ, đan đỉnh luyện dược, bệ thờ phát sáng: Áp dụng hòa trộn `ctx.globalCompositeOperation = 'lighter'` hoặc tạo gradient tròn từ tâm phát sáng mờ.
- Chu kỳ ngày đêm: Ban đêm phủ lớp màu mực lam tím (`#0f172a` với độ trong suốt $0.45$), đèn lồng và kiếm khí phát sáng nổi bật trên nền đêm huyền bí.

---

## 11. BẢNG MÀU CHUẨN XIANXIA (XIANXIA MASTER COLOR PALETTE)

Để đảm bảo tất cả các họa sĩ và lập trình viên luôn tạo ra asset đồng điệu về sắc độ, quy định bảng màu Master Palette gồm 32 sắc thái đại diện:

```
[INK & SHADOWS - ĐEN MỰC & BÓNG TỐI]
#090d16 (Hắc Mực Tối Cùng)  #111827 (Mực Lam Đậm)      #1f2937 (Bóng Thẫm)        #374151 (Xám Tro Lạnh)

[JADE & MIST - NGỌC BÍCH & SƯƠNG LINH]
#064e3b (Lục Thâm Cổ Tùng)  #059669 (Bích Ngọc)         #10b981 (Linh Thảo Tươi)    #6ee7b7 (Linh Khí Phát Quang)

[CELESTIAL BLUES - THANH LAM TIÊN CẢNH]
#0c4a6e (Hải Uyên)          #0284c7 (Thanh Lam Kiếm Khí) #38bdf8 (Băng Linh Quang)   #e0f2fe (Bạch Sương)

[SPIRIT GOLD & AMBER - HOÀNG KIM & PHÙ CHÚ]
#78350f (Gỗ Lim Trầm)       #d97706 (Hoàng Kim Phù Lục) #f59e0b (Linh Thạch Vàng)   #fde047 (Kim Sắc Cực Điểm)

[VERMILION & BLOOD - XÍCH CHU & YÊU THIẾT]
#450a0a (Huyết Khí Đậm)     #991b1b (Sơn Mài Đỏ Cổ)     #dc2626 (Hỏa Diễm / Chu Sa) #f87171 (Hồng Quang)

[ANCIENT STONE & ROOF - NGÓI CỔ & ĐÁ NÚI]
#1e293b (Đá Hoa Cương)      #475569 (Vách Đá Xám)       #94a3b8 (Phiến Đá Sáng)     #f8fafc (Bạch Vân / Bạch Bào)

[SKIN & SILK - DA TU SĨ & VẢI LỤA]
#7c2d12 (Bóng Da Ấm)        #f59e0b (Sắc Da Sáng)       #fed7aa (Bạch Ngọc Cơ Phù)  #ffffff (Điểm Nhấn Tinh Quang)
```

---

## 12. QUY CHUẨN UI PIXEL ART (UI PIXEL ART STANDARDS)

### 12.1 Khung viền 9-Slice & Hộp thoại Cổ Phong
- Khung hộp thoại (Dialogue Frame) và cửa sổ Modal tuân theo cơ chế **9-Slice Scaling**:
  - 4 góc trang trí hoa văn vân mây cổ điển ($8 \times 8\text{px}$ hoặc $16 \times 16\text{px}$).
  - Cạnh 4 bên lặp lại đường viền chỉ vàng hoặc nẹp đồng chạm khắc.
  - Vùng nền trung tâm: Họa tiết giấy da cổ (Parchment Texture `#1c1917` hoặc ngọc đen `#0f172a` phủ mờ).

### 12.2 Icon Vật phẩm & Kỹ năng (Item & Skill Icons)
- Kích thước chuẩn: **$24 \times 24\text{px}$** (cho túi đồ mobile) hoặc **$32 \times 32\text{px}$** (cho chi tiết trang bị).
- Phân cấp phẩm cấp theo khung viền pixel:
  - **Phàm phẩm**: Khung viền xám tro `#64748b`.
  - **Linh phẩm**: Khung viền thanh lam `#0284c7`.
  - **Huyền phẩm**: Khung viền tím tử kim `#a855f7`.
  - **Địa phẩm**: Khung viền hoàng kim `#f59e0b`.
  - **Thiên phẩm**: Khung viền đỏ thần hỏa `#ef4444` kèm đốm linh quang lấp lánh ở góc.

---

## 13. TIÊU CHUẨN HIỆU NĂNG ANDROID (ANDROID RENDERING STANDARDS)

Nhằm đảm bảo trò chơi luôn đạt tốc độ ổn định **60 FPS** trên thiết bị Android RAM 6–8GB:

1. **Giới hạn kích thước Texture Atlas**:
   - Kích thước Atlas tối đa: **$2048 \times 2048\text{px}$** (đảm bảo tương thích $100\%$ bộ nhớ WebView và OpenGL ES 3.0 của GPU di động).
   - Tuyệt đối không nạp hàng trăm file PNG rời rạc gây tắc nghẽn bộ nhớ I/O. Tất cả sprite sheets phải được gom nhóm thành các Texture Atlases theo từng khu vực bản đồ.
2. **Kỹ thuật Cắt Giảm Vùng Vẽ (Frustum Culling)**:
   - Chỉ thực hiện lệnh `ctx.drawImage` đối với các tiles và thực thể nằm trong hoặc chạm vào khung nhìn Viewport của Camera cộng thêm khoảng đệm an toàn $64\text{px}$.
3. **Tiết kiệm Draw Call với Offscreen Tilemap Buffer**:
   - Toàn bộ lớp nền đất tĩnh (Ground Tiles) của một màn chơi được vẽ trước 1 lần duy nhất lên một **Offscreen Canvas**, sau đó game loop chỉ việc dán lại vùng nhìn thấy bằng 1 lệnh `drawImage` duy nhất thay vì lặp qua hàng nghìn ô gạch mỗi frame.
4. **Quản lý Garbage Collection (GC Pause)**:
   - Không khởi tạo đối tượng `new Image()` hay mảng tạm thời bên trong vòng lặp Render 60 FPS. Tái sử dụng vùng nhớ đệm (Object Pooling) cho hạt bụi, số sát thương nổi và vệt kiếm khí.

---

## 14. KẾT LUẬN & ĐIỀU KIỆN ÁP DỤNG

Bản Art Bible này là tiêu chuẩn kỹ thuật và nghệ thuật tối cao của dự án **Phàm Trần Tiên Lộ**. 
- Mọi asset mới được tạo ra phải đối chiếu với các thông số kích thước, bảng màu và tỉ lệ nêu trên.
- Nghiêm cấm thay đổi gameplay, mã nguồn va chạm hay sửa đổi đồ họa trong trò chơi cho đến khi kế hoạch và tài liệu được phê duyệt chính thức.
