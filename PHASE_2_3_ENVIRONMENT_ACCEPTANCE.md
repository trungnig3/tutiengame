# PHASE 2.3 – ENVIRONMENT PIXEL ART ACCEPTANCE REPORT
**Dự án:** Phàm Trần Tiên Lộ (凡尘仙路)  
**Repository:** `trungnig3/tutiengame` | **Branch:** `audit/android-performance`  
**Trạng thái:** **ĐẠT NGHIỆM THU KỸ THUẬT & THỊ GIÁC TRÊN CHROMIUM (CHƯA ĐO PHẦN CỨNG ANDROID VẬT LÝ)**

---

## 1. Bảng Kiểm Tra Đạt Chuẩn Hạng Mục Phase 2.3

| Hạng mục kiểm định | Yêu cầu | Trạng thái | Ghi chú kiểm chứng |
|---|---|---|---|
| **Tileset địa hình $32 \times 32$** | Cỏ xanh, cỏ rừng, cỏ khô, đất, lối mòn, đá lát, đá rêu, huyền vũ, di tích, quảng trường tông môn, vách đá | **PASS** | `ground_tiles.png` ($256 \times 256$, 64 biến thể tile liền mạch) |
| **Autotile chuyển tiếp 4-bit** | Đường biên tự nhiên không lộ đường cắt vuông giữa cỏ-đất, cỏ-đá, đất-đá, bờ suối | **PASS** | `transition_tiles.png` ($512 \times 192$, 16 bitmask $\times$ 6 loại chuyển tiếp) |
| **Nước động 4-frame** | Suối Thanh Khê, thác Linh Vụ, hoa súng, đầm Hắc Sơn, huyết đàm Bí Cảnh ở 6 FPS | **PASS** | `animated_water_tiles.png` ($256 \times 128$), chỉ render ô nằm trong viewport frustum |
| **Thảm thực vật & đá núi** | Cổ Tùng, Thông, Linh Thụ, Trúc, Cổ Mộc Khô, bụi cây, cỏ dại, hoa, nấm, tảng đá, tinh thể, xương thú, cột đá | **PASS** | `flora_sheet.png` ($512 \times 320$) & `rocks_nature_sheet.png` ($384 \times 192$), alpha nền = 0 |
| **Kiến trúc Tiên hiệp 3/4 Oblique** | Nhà thôn, Đình các, Đại điện Thanh Vân Tông, miếu, tường thành, cầu gỗ, bia đá, tượng thú, cờ, đèn đá/lồng đèn động | **PASS** | `architecture_props.png` ($640 \times 352$), hướng nhìn trực giao đồng bộ 100% góc camera |
| **Tài nguyên thu thập** | Linh thảo, quặng, rương báu, bia đá, tế đàn | **PASS** | `resources_sheet.png` ($192 \times 64$) |
| **Phân tầng Y-Sorting 2-Pass (Layer 2 + Layer 3)** | Thân/tường/đá xếp Y-sort với Lâm Mặc, NPC, quái; tán cây & mái ngói vẽ ở Layer 3 và mờ còn `0.48` khi nhân vật đi phía sau | **PASS** | Xác minh qua unit test và di chuyển thực tế trong Headless Chromium |
| **8 Bản đồ Gameplay** | Thanh Khê Thôn, Thanh Phong Sơn, Rừng Linh Vụ, Phường Thị Thanh Hà, Hắc Phong Sơn, Cổ Di Tích, Thanh Vân Tông, Bí Cảnh Hắc Phong | **PASS** | Kiểm chứng cấu trúc 8/8 bản đồ + xác minh hình ảnh trực tiếp tại Thanh Khê, Linh Vụ, Hắc Phong Sơn |
| **Bảo toàn 100% Gameplay & Save/Load** | Giữ nguyên tọa độ vật lý, hitbox/AABB `obstacles`, NPC, Portal, Enemy Spawner, Resource, Phase 2.0/2.1/2.2 & `SaveManager` | **PASS** | Snapshot tọa độ 8 bản đồ trước/sau bất biến 100%; không đụng Phase 2.4 UI |
| **Tối ưu hiệu năng** | Offscreen Static Terrain Cache (`<= 2048×2048`, 1 blit/frame), Viewport Frustum Culling, Nearest-Neighbor `imageSmoothingEnabled = false` | **PASS** | Logic & render pipeline xác minh qua code audit + Chromium |

---

## 2. Xác Minh Trực Tiếp Trên 3 Quần Thể Bản Đồ Trọng Tâm

1. **Thanh Khê Thôn (`map_thanh_khe`)**:
   - Bằng chứng: `public/evidence/phase2_3/thanh_khe_village.png`, `public/evidence/phase2_3/thanh_khe_bridge.png`, `public/evidence/videos/environment/phase2_3_thanh_khe_gameplay.webm`.
   - Hiển thị đồng bộ nhà mái ngói cổ, quảng trường đá, đường mòn đất nện, dòng suối trong xanh có hoa súng trôi nhẹ, cầu gỗ bắc ngang, đèn đá phát sáng quanh Trưởng Thôn Lý Đức, Lâm Mặc (Phase 2.0) và Dã Lang / Dã Trư (Phase 2.1).
2. **Rừng Linh Vụ (`map_linh_vu`)**:
   - Bằng chứng: `public/evidence/phase2_3/linh_vu_forest_boss.png`, `public/evidence/videos/environment/phase2_3_biomes_walkthrough.webm`.
   - Nền cỏ rừng sẫm, thác nước & hồ suối phía bắc, nấm linh chi phát sáng, tán cây thông/trúc/cổ thụ Y-sorted và võ đài đá của Boss **Bạch Mao Viên Hầu** (Phase 2.2) ở góc đông bắc.
3. **Hắc Phong Sơn (`map_hac_phong_son`)**:
   - Bằng chứng: `public/evidence/phase2_3/hac_phong_son.png`, `public/evidence/videos/environment/phase2_3_biomes_walkthrough.webm`.
   - Nền đá huyền vũ tối, cỏ khô cháy vàng, khu di tích cổ tím sẫm, đầm nước ma khí, xương thú có sừng, đá tinh thể lam và cổ mộc khô.
4. **Màn hình Điện thoại (`844×390` Landscape)**:
   - Bằng chứng: `public/evidence/phase2_3/mobile_landscape_844x390.png`.
   - Hiển thị sắc nét chuẩn Nearest-Neighbor không nhòe pixel khi thu phóng responsive.

---

## 3. Tuyên Bố Minh Bạch Phần Cứng Android (Hardware Transparency Note)

- **NOT VERIFIED ON PHYSICAL HARDWARE**: Toàn bộ kiểm định chạy trực tiếp được thực hiện trên **Headless Chromium (Linux Container / CPU Software Rasterizer)**, chưa đo thực nghiệm FPS/nhiệt độ trên thiết bị Android vật lý thực tế.
- Tác vụ tối ưu hóa kiến trúc (1 offscreen terrain blit/frame, Viewport Frustum Culling, tổng bộ nhớ ảnh môi trường + cache ~10.80 MB) đã sẵn sàng cho giai đoạn đo profiling APK thực tế.
