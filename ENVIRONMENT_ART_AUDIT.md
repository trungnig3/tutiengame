# ENVIRONMENT ART AUDIT – PHASE 2.3
**Dự án:** Phàm Trần Tiên Lộ (凡尘仙路)  
**Repository:** `trungnig3/tutiengame` | **Branch:** `audit/android-performance`  
**Chuẩn đồ họa:** Premium HD Pixel Art – Chinese Xianxia Action RPG (Top-Down 3/4 Oblique, Nearest-Neighbor `imageSmoothingEnabled = false`)  

---

## 1. Kiểm Toán Hiện Trạng Trước Nâng Cấp (Pre-Phase 2.3 Baseline)

1. **`GameCanvas.tsx` & `proceduralRenderer.ts`**:
   - Toàn bộ 8 bản đồ gameplay chính (`map_thanh_khe`, `map_thanh_phong_son`, `map_linh_vu`, `map_phuong_thi`, `map_hac_phong_son`, `map_ancient_ruins`, `map_thanh_van_tong`, `map_hac_phong_bi_canh`) sử dụng hình vẽ procedural bằng gradient/rect/ellipse của Canvas API, chưa dùng bộ tileset và prop sprite sheet thống nhất.
2. **Thư mục cũ `public/assets/pixel/environment/` (8 tệp)**:
   - `ground_tileset.png` ($256 \times 128$): chỉ mới điền một phần hàng đầu, lộ ranh giới ô tile khi ghép.
   - `animated_water_stream.png` ($128 \times 64$): độ tương phản cyan quá gắt, lộ đường nối khung hình.
   - `building_thanh_khe_dinh.png` ($128 \times 128$): dựng góc nhìn isometric kim cương lệch trục so với góc nhìn top-down 3/4 trực giao (oblique) của gameplay chính.
   - `tree_ancient_pine.png` ($128 \times 160$): dáng bonsai trong chậu thay vì cổ thụ rừng núi tự nhiên.
   - `tree_bamboo.png` ($32 \times 96$): đường nét bị làm mờ anti-alias.
   - `prop_chiseled_rock.png` ($64 \times 48$), `bridge_rustic_wood.png`, `prop_hanging_lantern.png`: chỉ phục vụ `PixelArtSandbox.tsx`, không tích hợp vào `GameCanvas.tsx`.
   - **Phân loại & bảo toàn**: Theo nguyên tắc không xóa asset cũ, toàn bộ 8 tệp trong `public/assets/pixel/environment/` **được giữ nguyên vẹn 100% trên ổ đĩa** và phân loại là `Legacy / Sandbox-Only` trong `ASSET_INVENTORY.md`.

---

## 2. Danh Mục Tài Nguyên Môi Trường Mới (Phase 2.3 Production Pack)

Thư mục đích: `public/assets/pixel-art/environment/`

| Tệp Asset | Kích thước (px) | Dung lượng đĩa | Bộ nhớ giải mã RGBA8888 | Tỉ lệ nền Alpha = 0 | Trạng thái QC |
|---|---:|---:|---:|---:|---|
| `tilesets/ground_tiles.png` | $256 \times 256$ | 15,771 B (15.4 KB) | 0.250 MB | 0.0% (opaque 8×8 grid) | PASS |
| `tilesets/transition_tiles.png` | $512 \times 192$ | 12,429 B (12.1 KB) | 0.375 MB | 81.64% | PASS |
| `tilesets/animated_water_tiles.png` | $256 \times 128$ | 3,719 B (3.6 KB) | 0.125 MB | 0.0% (opaque 4-frame) | PASS |
| `objects/flora_sheet.png` | $512 \times 320$ | 10,812 B (10.6 KB) | 0.625 MB | 82.09% | PASS |
| `objects/rocks_nature_sheet.png` | $384 \times 192$ | 3,788 B (3.7 KB) | 0.281 MB | 77.00% | PASS |
| `objects/architecture_props.png` | $640 \times 352$ | 7,161 B (7.0 KB) | 0.859 MB | 59.42% | PASS |
| `objects/resources_sheet.png` | $192 \times 64$ | 892 B (0.9 KB) | 0.047 MB | 78.17% | PASS |
| `preview_showcase.png` | $1080 \times 660$ | 48,033 B (46.9 KB) | — (không nạp runtime) | — | PASS |

- **Tổng 7 runtime PNG sheets**: **54,572 bytes (53.29 KB)** trên đĩa.
- **Tổng bộ nhớ pixel giải mã (7 sprite sheets RGBA8888)**: **2,686,976 bytes (~2.563 MB)**.
- **Offscreen Static Terrain Cache tối đa cho 1 bản đồ active** ($1800 \times 1200$ px $\times 4$ bytes): **8,640,000 bytes (~8.240 MB)**.
- **Tổng ngân sách bộ nhớ Môi trường (Decoded Sheets + Active Map Offscreen Cache)**: **~10.802 MB** — hoàn toàn phù hợp ngưỡng thiết bị Android tầm trung 6–8 GB RAM.

---

## 3. Các Lỗi Hình Ảnh Đã Phát Hiện & Tự Khắc Phục Trong Quá Trình Kiểm Định

1. **Khối vuông đất xen kẽ thô (`c >> 1, r >> 1` hash)**: Khắc phục bằng thuật toán **2D Smooth Value Noise** đa tần (`smoothNoise2D`) kết hợp dither chuyển tiếp mềm trong `EnvironmentRenderer.ts`.
2. **Sóng chữ V trắng gắt lặp theo chiều dọc dòng suối**: Thiết kế lại `animated_water_tiles.png` bằng `periodicNoise` liền mạch $32 \times 32$ và ánh nước ngọc bích tự nhiên.
3. **Bụi hoa súng chỉ xuất hiện ở frame 0 của `WATER_LOTUS`**: Sửa tọa độ `ox + 16, oy + 17 + bob` trong `scripts/generate_environment_pack.cjs` để cả 4 frame đều hiển thị bèo hoa súng dập dềnh.
4. **Rìa cỏ xanh lấn sang nền đất khô ở Hắc Phong Sơn**: Tách `isGreenGrassTile` (chỉ áp dụng cho `GRASS` / `DARK_GRASS`, loại trừ `DRY_GRASS`) và dùng viền đá tối (`row 5`) cho hồ nước Hắc Phong Sơn, giúp giữ trọn không khí u ám của Hắc Phong Sơn.
5. **Vẽ trùng hộp nước tĩnh trên Layer 2 đối với `obs.type === 'water'`**: Gộp toàn bộ mặt nước chướng ngại vật vào Pass A + Pass B autotile của `renderGroundViewport` để có bờ cát bo tròn 4-bit thay vì khối chữ nhật đè lên.
