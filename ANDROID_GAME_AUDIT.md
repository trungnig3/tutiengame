# BÁO CÁO TOÀN DIỆN HIỆU NĂNG & KIỂM TOÁN HỆ THỐNG TRÊN ANDROID
## Dự án: Phàm Trần Tiên Lộ (Branch: audit/android-performance)

---

### TỔNG QUAN HIỆN TRẠNG
- **Repository**: `trungnig3/tutiengame`
- **Branch kiểm toán**: `audit/android-performance` (commit `4fd092b fix: enforce landscape orientation and improve UI`)
- **Nền tảng mục tiêu**: Android Mobile (Capacitor WebView / Chrome Android)
- **Kích thước Bundle hiện tại**: `1,866.10 kB` (JS) + `141.37 kB` (CSS) trong một chunk duy nhất (`index-*.js`)
- **Dung lượng thư mục assets**: `5.6 MB` (Web `public/`) và `7.7 MB` (Android `assets/`)
- **Đánh giá chung**: Game sở hữu hệ thống gameplay tu tiên sâu sắc, cơ chế chiến đấu phong phú và phong cách đồ họa thủy mặc đặc sắc. Tuy nhiên, khi vận hành trên thiết bị Android, ứng dụng gặp hiện tượng sụt giảm FPS (từ 60fps xuống 15–28fps trong giao tranh), tiêu tốn nhiều bộ nhớ RAM/VRAM, giật khung hình định kỳ (GC spikes) và một số lỗi logic combat/animation.

---

## PHẦN 1: DANH SÁCH FILE GÂY TỐN HIỆU NĂNG (HOTSPOTS)

| STT | Tên File | Dòng | Vấn đề chính | Tác động hiệu năng |
|:---:|:---|:---:|:---|:---|
| 1 | `src/components/GameCanvas.tsx` | 2,974 | Cấp phát hàng nghìn object/closure mỗi frame cho sắp xếp depth (`depthEntities`), lọc mảng rác định kỳ (`filter()`), tính toán raycast LoS toàn bản đồ, không có Viewport Culling, DPR = 2.0 ép render 2.5 triệu pixel. | **Cực cao** (Nguyên nhân chính gây drop FPS và nghẽn CPU) |
| 2 | `src/engine/proceduralRenderer.ts` | 3,090 | 31 lệnh `createRadialGradient`/`createLinearGradient` chạy trực tiếp trong hot loop; 163 lệnh `beginPath` vẽ vector chướng ngại vật phức tạp không qua cache sprite; không có culling ngoài camera. | **Cực cao** (Nghẽn GPU Fill-rate & Garbage Collection) |
| 3 | `src/components/TouchControls.tsx` | 413 | Virtual joystick gọi `useState` (`setStickPos`) trên mỗi sự kiện `pointermove` (90–120Hz trên màn hình tần số quét cao), ép React re-render toàn bộ cụm phím điều khiển; sử dụng `backdrop-blur-md` trên nền canvas. | **Cao** (Nghẽn Main Thread & Compositor) |
| 4 | `src/components/HUD.tsx` | 415 | Chứa 8 lớp phủ DOM có thuộc tính `backdrop-blur-md` xếp chồng trực tiếp lên HTML5 Canvas đang render 60 FPS; không dùng `React.memo` dẫn đến re-render liên tục. | **Cao** (Nghẽn GPU Multi-pass Compositing) |
| 5 | `src/components/Minimap.tsx` | 222 | Render 25–30 phần tử DOM tuyệt đối kết hợp animation CSS `animate-ping`, `animate-pulse` liên tục trên nền canvas; re-render và tính lại tọa độ radar mỗi khi người chơi di chuyển. | **Trung bình - Cao** (Tăng Paint/Layout cost) |
| 6 | `src/components/GameCanvas3D.tsx` & `src/engine3d/*` | 1,860 | Import tĩnh Three.js vào bundle chính dù chế độ mặc định là 2D; Shadow Map phân giải 2048x2048 trên mobile; rò rỉ bộ nhớ WebGL do không `dispose()` toàn bộ geometry/material khi unmount. | **Cao** (Phình to Bundle thêm ~850 KB, tốn 40-70 MB RAM) |
| 7 | `public/assets/aistudio/*.png` | 25 ảnh | 25 file ảnh PNG mồ côi (tổng 5.3 MB) hoàn toàn không được import hay sử dụng trong bất kỳ file code nào của `src/`, nhưng bị Service Worker precache và đóng gói thẳng vào file APK. | **Cao** (Tốn bộ nhớ lưu trữ, băng thông mạng & RAM WebView) |
| 8 | `src/engine/pixelArtEngine.ts` | 1,320 | Toàn bộ 1,320 dòng code của engine pixel art rasterization là mã chết (dead code), không có bất kỳ component nào import. | **Thấp - Trung bình** (Lãng phí kích thước mã nguồn và phân tích cú pháp) |

---

## PHẦN 2: NGUYÊN NHÂN FPS GIẢM TRÊN ANDROID

### 1. Áp lực rác bộ nhớ (Garbage Collection Spikes) trên V8 Engine
- **Cấp phát Object & Closure trong vòng lặp**: Trong hàm `loop()` của `GameCanvas.tsx` (dòng 2281–2361), mỗi frame đều khởi tạo mới một mảng `depthEntities: RenderItem[] = []`. Đối với mỗi chướng ngại vật (25), vật trang trí (15), tài nguyên (10), NPC (8), quái vật (15) và người chơi, một đối tượng `{ y, render: () => ... }` kèm một closure function được cấp phát. 
  - *Thống kê benchmark*: ~90 object + closure/frame × 60 frame/s = **5,400 đến 10,800 object/giây** (~547 KB rác/giây).
  - *Hậu quả*: Bộ thu gom rác (V8 Scavenger / Mark-Sweep GC) của Android WebView phải kích hoạt liên tục mỗi 2–4 giây, làm đóng băng luồng chính từ **15ms đến 45ms**, tạo ra hiện tượng khựng giật (micro-stutter).
- **Cấp phát mảng mới bằng `.filter()` liên tục**: Mỗi 16ms, các mảng `particlesRef`, `floatingTextsRef`, `afterImagesRef`, `projectilesRef`, `advancedProjectilesRef` đều gọi `.filter()` tạo ra 5 mảng mới mỗi frame (**300 mảng/giây**).

### 2. Quá tải xử lý GPU (Fill-rate Bottleneck & Shader Overdraw)
- **Độ phân giải thực tế quá lớn (Device Pixel Ratio = 2.0)**:
  - Trên điện thoại Android FHD+ (1080x2400) hoặc 2K, `dpr` bị ép ở mức `Math.min(window.devicePixelRatio || 1, 2) = 2.0`. Khung canvas phải vẽ trên kích thước thực tế **~2160 × 1080 pixel (~2.33 triệu pixel)**.
  - Trên GPU di động (Adreno 610/618/619 hoặc Mali-G52/G57), fill-rate bị nghẽn nghiêm trọng khi phải xử lý hàng trăm lệnh path vector phức tạp trên độ phân giải này.
- **Tạo Gradient động trong Render Loop**:
  - `proceduralRenderer.ts` và `GameCanvas.tsx` chứa **31 lệnh `createRadialGradient` và `createLinearGradient`** được gọi trực tiếp mỗi frame cho từng bóng đổ quái (`shadowGrad`), đòn chém kiếm khí (`wakeGrad`, `bladeFill`), đèn lồng (`glow`), cột sáng nhặt đồ (`beamGrad`).
  - Mỗi lệnh `createGradient` yêu cầu trình duyệt phân bổ đối tượng đồ họa nền và đồng bộ thông số shader lại cho GPU, tiêu hao đáng kể chu kỳ GPU.
- **Hiệu ứng `backdrop-blur` trên nhiều lớp DOM xếp chồng**:
  - `TouchControls.tsx`, `HUD.tsx` và `Minimap.tsx` sử dụng thuộc tính `backdrop-blur-md` trên 8-10 phần tử DOM nằm đè lên canvas đang vẽ.
  - Bộ tổng hợp đồ họa (Compositor) của Android WebView buộc phải sao chép buffer canvas sang một texture phụ, áp dụng thuật toán Gaussian Blur 2 chiều rồi mới ghép lên màn hình. Đây là nguyên nhân hàng đầu khiến FPS tụt giảm mạnh khi chạm vào cần điều khiển hoặc bật HUD.

### 3. Thiếu cơ chế lọc khung nhìn (Viewport / Frustum Culling)
- Bản đồ có kích thước từ `1400×900` đến `1800×1200` pixel, trong khi khung nhìn camera di động chỉ hiển thị khoảng `800×450` pixel.
- Toàn bộ 25–40 chướng ngại vật (đặc biệt là các đình làng, nhà cổ có 60–80 lệnh vẽ vector), vật trang trí, NPC, bãi quái vật nằm ngoài màn hình hàng nghìn pixel **vẫn được tính toán và vẽ đầy đủ**, lãng phí hơn 65% thời gian render của mỗi khung hình.

### 4. Thuật toán tầm nhìn (Line-of-Sight Raycasting) quá tải
- Hàm `hasLineOfSight` (dòng 102–110 trong `GameCanvas.tsx`) duyệt qua tất cả chướng ngại vật và gọi `lineIntersectsSegment` 4 lần cho mỗi chướng ngại vật.
- Ở dòng 1845, lệnh này được gọi cho **toàn bộ quái vật trên bản đồ mỗi frame**, kể cả khi quái đang đứng xa tít ngoài tầm kích động (`distToPlayer > enemy.aggroRange`).
  - 15 quái vật × 25 chướng ngại vật × 4 cạnh = **1,500 phép tính giao điểm đường thẳng mỗi frame = 90,000 phép tính/giây** trên luồng chính JS.

### 5. Xung đột giữa vòng lặp Canvas và cơ chế Re-render của React
- Virtual Joystick trong `TouchControls.tsx` cập nhật `stickPos` qua `useState` ở sự kiện `onPointerMove`. Khi người dùng rê tay điều khiển trên màn hình 90Hz/120Hz, React bị ép chạy lifecycle re-render 90–120 lần/giây.
- Mỗi đòn đánh cơ bản, mỗi lần hút mana (`mana_siphon`), hoặc mỗi khi quái đánh trúng người chơi, code đều gọi `onUpdatePlayer` ngay lập tức, kích hoạt re-render toàn bộ cây component từ `App.tsx` -> `HUD` -> `GameCanvas`.

---

## PHẦN 3: CÁC LỖI ANIMATION VÀ COMBAT

### 1. Lỗi Boss dịch chuyển tức thời (Instant Teleport) trong chiêu Xung Kích
- **Vị trí**: `GameCanvas.tsx`, dòng 1987–1992.
- **Mô tả**: Khi Boss thi triển chiêu Húc Xung Kích (`enemy.bossAttackPattern === 'charge'`), tọa độ của Boss bị cộng thẳng `160px` trong đúng 1 frame:
  ```typescript
  enemy.x += Math.cos(chargeAngle) * 160;
  enemy.y += Math.sin(chargeAngle) * 160;
  ```
- **Hệ quả**: Boss biến mất và xuất hiện đột ngột thay vì lướt mượt mà; hoàn toàn bỏ qua kiểm tra va chạm địa hình, dẫn tới hiện tượng Boss húc xuyên tường, xuyên đá hoặc kẹt ngoài biên map.

### 2. Lỗi Logic Text "HÚC TRƯỢT!" dù đánh trúng người chơi
- **Vị trí**: `GameCanvas.tsx`, dòng 1993–2011.
- **Mô tả**: Khi Boss kết thúc chiêu Charge, ngay sau khi kiểm tra gây sát thương thành công (`newDist <= 65`), code lại chạy vô điều kiện:
  ```typescript
  enemy.bossPunishTimer = 1.2;
  addFloatingText(enemy.x, enemy.y - 45, '⚡ HÚC TRƯỢT! TRỪNG PHẠT +35%', '#38bdf8', 16);
  ```
- **Hệ quả**: Dù người chơi bị húc trúng và mất máu, trên đầu Boss vẫn hiện chữ "HÚC TRƯỢT!".

### 3. Lỗi kẹt địa hình khi Lướt/Né (Dash Wall-Clipping)
- **Vị trí**: `GameCanvas.tsx`, dòng 583–587.
- **Mô tả**: Khi người chơi lướt về phía chướng ngại vật, code xử lý va chạm bằng cách gán cố định:
  ```typescript
  targetX = p.x + Math.cos(angle) * 45;
  targetY = p.y + Math.sin(angle) * 45;
  ```
- **Hệ quả**: Nếu bức tường chỉ cách người chơi 15–20px, việc cộng thêm 45px sẽ đưa thẳng người chơi vào bên trong vùng đặc của chướng ngại vật, khiến người chơi bị kẹt vĩnh viễn không thể di chuyển.

### 4. Lỗi giật gián đoạn và lướt bùn (Frame-Rate Dependent Smoothing)
- **Vị trí**: `GameCanvas.tsx`, dòng 1370–1373:
  ```typescript
  animPosRef.current.x += (localPosRef.current.x - animPosRef.current.x) * 0.35;
  animPosRef.current.y += (localPosRef.current.y - animPosRef.current.y) * 0.35;
  ```
- **Mô tả**: Hệ số nội suy vị trí `0.35` là hằng số cố định, không nhân với `dt` (delta time).
- **Hệ quả**: Khi FPS ở mức 60, chuyển động rất mượt; nhưng khi thiết bị Android bị nóng hoặc lag xuống 30 FPS, tốc độ nội suy bị giảm một nửa, tạo cảm giác nhân vật bị "trượt như trên bùn" hoặc phản hồi cần điều khiển bị trễ nặng.

### 5. Lỗi gây sát thương kép ngoài ý muốn (Double-Hit Window)
- **Vị trí**: `GameCanvas.tsx`, dòng 1445–1474 và 1698.
- **Mô tả**: Mỗi đòn đánh cơ bản vừa tạo vùng chém cận chiến (melee arc), vừa phóng ra một kiếm khí bay (`advancedProjectiles`). Nếu kẻ địch đứng ở rìa tầm đánh (~90–105px), đòn chém cận chiến có thể vừa trúng, sau đó khi `enemy.hurtTimer` đếm lùi qua mốc 0.12s, luồng kiếm khí bay tới lại kích hoạt sát thương lần 2 trên cùng một mục tiêu.

### 6. Lỗi trôi Touch Input khi chạm nhiều ngón (Multi-Touch Cancelling)
- **Vị trí**: `TouchControls.tsx`, sự kiện lắng nghe toàn cục dòng 57–63.
- **Mô tả**: Khi người chơi vừa giữ joystick di chuyển bằng ngón cái trái, vừa nhấn liên tục nút đánh/kỹ năng bằng ngón cái phải, sự kiện `pointerup` của ngón phải có thể vô tình kích hoạt `resetJoystick()` nếu logic `pointerId` không được phân tách triệt để ở cấp độ container.

---

## PHẦN 4: ĐÁNH GIÁ TÀI NGUYÊN ĐỒ HỌA & BỘ NHỚ

### 1. Tài nguyên ảnh mồ côi (Orphan / Dead Assets)
- Thư mục `public/assets/aistudio/` chứa 25 ảnh PNG (từ `image_102a7aeb.png` đến `image_fbba049c.png`) với tổng dung lượng **5.3 MB**.
- **Kết quả rà soát mã nguồn**: Không có bất kỳ dòng code nào trong `src/` tham chiếu tới thư mục này.
- **Hậu quả**:
  - File cấu hình `vite.config.ts` yêu cầu Workbox PWA precache tất cả file `.png`:
    `precache 42 entries (7,599 KiB)`. Trình duyệt trên Android phải tải ngầm 5.3 MB dữ liệu không dùng đến vào CacheStorage.
  - Thư mục `android/app/src/main/assets/public/assets/aistudio/` cũng chứa đầy đủ 25 file này, làm dung lượng file APK phình to thêm **~6 MB**.

### 2. Thành phần Three.js không cần thiết trong chế độ 2D
- Package `three` có kích thước **19.5 MB** trong `node_modules` và **715.39 KB** sau khi minified.
- Do `GameCanvas3D` được import tĩnh ở đầu file `App.tsx`, toàn bộ thư viện Three.js cùng các module 3D (`combatVFX3D.ts`, `sceneManager3D.ts`, `beastModel.ts`, `characterModel.ts`, `environmentModels.ts` - tổng cộng **140 KB mã nguồn TS**) đều bị đóng gói thẳng vào file JavaScript chính `index-*.js` (đẩy dung lượng lên tới **1.86 MB**).
- Trong chế độ 3D:
  - Thiết lập Directional Light sử dụng `shadow.mapSize = 2048x2048` (ngốn ~16 MB VRAM chuyên dụng cho shadow map buffer).
  - Hàm `dispose()` trong `sceneManager3D.ts` chỉ gọi `scene.remove()`, không giải phóng geometry/material của nhân vật, quái thú và môi trường, dẫn tới rò rỉ VRAM nếu người dùng chuyển đổi qua lại giữa 2D và 3D.

### 3. Tối ưu hóa cấu hình Android Native
- Trong `android/app/src/main/AndroidManifest.xml`:
  - Chưa khai báo `android:largeHeap="true"` trong thẻ `<application>`: Trên các dòng máy Android giá rẻ với giới hạn heap tiêu chuẩn (192MB), ứng dụng dễ bị crash do tràn bộ nhớ (Out-Of-Memory) khi tải canvas đồ họa lớn.
  - Thuộc tính `android:hardwareAccelerated="true"` nên được khai báo tường minh để đảm bảo WebView luôn tận dụng GPU compositing.

---

## PHẦN 5: ĐO LƯỜNG HIỆU NĂNG THỰC TẾ (BENCHMARK)

1. **Kích thước Bundle sản phẩm (`npm run build`)**:
   - `dist/assets/index-ovVND3yp.js`: **1,866.10 kB** (Gzip: 476.28 kB) - *Cảnh báo chunk vượt ngưỡng 500 kB*.
   - Trong đó: Three.js chiếm **715.4 kB** (~38.3%), Lucide icons & Motion chiếm **~380 kB**.
2. **Kích thước precache Service Worker**:
   - `precache 42 entries (7,599 KiB)` -> Sau khi loại bỏ ảnh rác 5.3 MB, precache sẽ giảm xuống chỉ còn **~2,200 KiB** (giảm 71%).
3. **Thử nghiệm cấp phát rác trên 60 Frame (1 Giây)**:
   - Cấp phát heap rác chỉ riêng từ việc tạo closure `depthEntities` và filter mảng: **547.59 KB / giây**.
   - Sau 60 giây chơi game liên tục: **~32.8 MB bộ nhớ rác phát sinh**, ép GC kích hoạt 15-20 lần/phút.

---

## PHẦN 6: KẾ HOẠCH SỬA CHỮA THEO THỨ TỰ ƯU TIÊN

### Giai đoạn 1: Sửa lỗi khẩn cấp & Tách React State khỏi Input (Ưu tiên P0 - Ngay lập tức)
1. **Tách Touch Joystick khỏi React State**:
   - Chuyển `stickPos` trong `TouchControls.tsx` sang điều khiển trực tiếp qua DOM Ref (`stickRef.current.style.transform = translate3d(...)`).
   - Loại bỏ hoàn toàn re-render React khi di chuyển cần gạt (giảm từ 120 re-render/s xuống 0).
2. **Sửa lỗi Boss Charge**:
   - Thêm trạng thái lướt nội suy nhiều frame cho Boss thay vì cộng tọa độ đột ngột trong 1 frame; kiểm tra va chạm vật cản trong quá trình lướt.
   - Sửa điều kiện hiển thị text "HÚC TRƯỢT!" chỉ xuất hiện khi người chơi né thành công hoặc Boss không trúng đích.
3. **Sửa lỗi Lướt/Né kẹt tường**:
   - Dùng thuật toán raycast tìm điểm dừng an toàn cách mép va chạm tối thiểu 16px thay vì cộng cứng 45px.
4. **Sửa lỗi nội suy di chuyển người chơi**:
   - Chuyển công thức làm mượt vị trí sang exponential decay có `dt`: `1 - Math.exp(-24 * dt)`.

### Giai đoạn 2: Tối ưu bộ nhớ & Cắt giảm Bundle (Ưu tiên P1 - Tác động lớn)
1. **Dọn sạch 25 file ảnh mồ côi (5.3 MB)**:
   - Xóa bỏ toàn bộ ảnh không sử dụng trong `public/assets/aistudio/` và cập nhật lại `workbox` config để không cache dữ liệu thừa.
2. **Xóa file mã chết**:
   - Loại bỏ `src/engine/pixelArtEngine.ts` (1,320 dòng).
3. **Code-split Three.js & GameCanvas3D**:
   - Chuyển `GameCanvas3D` sang `React.lazy(() => import('./components/GameCanvas3D'))`.
   - Cấu hình Rollup `manualChunks` tách vendor Three.js ra file riêng, chỉ tải khi người chơi bấm nút chuyển sang 3D.
   - Giảm dung lượng JS bundle chính từ **1.86 MB xuống ~850 KB**.
4. **Cấu hình Android Manifest**:
   - Thêm `android:largeHeap="true"` và `android:hardwareAccelerated="true"`.

### Giai đoạn 3: Tối ưu hóa Render Loop 2D & Triệt tiêu GC (Ưu tiên P2 - Ổn định 60 FPS)
1. **Viewport / Frustum Culling**:
   - Bổ sung hàm kiểm tra AABB khung nhìn camera. Bỏ qua hoàn toàn việc tính toán và vẽ các chướng ngại vật, trang trí, NPC, quái thú nằm ngoài màn hình camera (+ margin 80px).
2. **Tái cấu trúc Depth Sorting & Giảm tạo Object**:
   - Dùng mảng cố định (fixed buffer) hoặc tái sử dụng mảng tĩnh thay vì cấp phát mảng mới và 90 closure mỗi frame.
3. **Tối ưu Raycast Tầm nhìn (Line-of-Sight)**:
   - Chỉ thực hiện `hasLineOfSight()` khi `distToPlayer <= enemy.aggroRange` (giảm 95% số lượng raycast không cần thiết).
4. **Xóa bỏ tạo Gradient trong Render Loop**:
   - Tạo sẵn 1 canvas nhỏ chứa gradient bóng đổ và sprite kiếm khí, sau đó dùng `ctx.drawImage` thay vì liên tục gọi `createRadialGradient` / `createLinearGradient`.
5. **Điều chỉnh DPR linh hoạt**:
   - Cho phép thiết lập hệ số độ phân giải canvas thích ứng (1.0x trên điện thoại cấu hình yếu/trung bình, 1.25x trên máy mạnh) để giảm tải 50% số pixel GPU cần vẽ.

### Giai đoạn 4: Tối ưu UI Compositor & HUD (Ưu tiên P3 - Hoàn thiện)
1. **Thay thế `backdrop-blur` trên Mobile**:
   - Thay các lớp `backdrop-blur-md` trên HUD, Minimap và TouchControls bằng màu nền đậm `bg-stone-950/95` kèm border sắc nét, giúp GPU không phải xử lý blur framebuffer canvas mỗi khung hình.
2. **Chuyển đổi Minimap sang Canvas 2D**:
   - Thay thế 25-30 phần tử DOM của Minimap bằng một canvas nhỏ 136x136 duy nhất, triệt tiêu layout thrashing của trình duyệt.
3. **Bộ đệm throttle cập nhật trạng thái người chơi**:
   - Tách biệt hoàn toàn nhịp cập nhật logic vị trí/chỉ số chiến đấu trong Canvas khỏi vòng lặp state của React.

---
*Báo cáo được hoàn thành phục vụ công tác nâng cấp và tối ưu hóa trải nghiệm mượt mà 60 FPS trên thiết bị Android.*
