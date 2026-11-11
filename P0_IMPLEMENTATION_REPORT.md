# BÁO CÁO TRIỂN KHAI GIAI ĐOẠN P0 (P0_IMPLEMENTATION_REPORT.md)
**Dự án**: Phàm Trần Tiên Lộ (2D Action RPG Tiên Hiệp)  
**Nhánh Git**: `audit/android-performance`  
**Mục tiêu**: Khắc phục triệt để các lỗi nghiêm trọng P0 về điều khiển di động (Mobile Input), va chạm lướt (Dash Collision), chuyển động mượt độc lập FPS (Motion Smoothing), và cơ chế húc của Boss (Boss Charge State Machine) mà không phá vỡ cân bằng gameplay, damage hay visual art style.

---

## 1. DANH SÁCH CÁC TÁC VỤ ĐÃ THỰC HIỆN

| Mã Task | Hạng mục | Trạng thái | Mức độ ưu tiên |
|---|---|---|---|
| **TASK 1** | Tối ưu Virtual Joystick: Loại bỏ React Re-render 90–120Hz, cách ly Multi-touch bằng `pointerId` | **HOÀN THÀNH** | P0 (Critical Input) |
| **TASK 2** | Sửa lỗi Boss Charge dịch chuyển tức thời 160px & sửa lỗi hiển thị "HÚC TRƯỢT!" sai | **HOÀN THÀNH** | P0 (Combat Bug) |
| **TASK 3** | Sửa lỗi Dash xuyên tường bằng Swept Collision & Raymarching với lề an toàn Hitbox | **HOÀN THÀNH** | P0 (Collision Bug) |
| **TASK 4** | Khử phụ thuộc FPS trong chuyển động nhân vật bằng Exponential Smoothing ($\alpha = 1 - e^{-24 \cdot dt}$) | **HOÀN THÀNH** | P0 (Physics Bug) |
| **TASK 5** | Bộ Unit Tests tự động kiểm thử hồi quy & Xác minh toàn diện (Build, Lint, Test) | **HOÀN THÀNH** | P0 (Quality Assurance) |

---

## 2. DANH SÁCH FILE ĐÃ THAY ĐỔI

1. **`src/components/TouchControls.tsx`**
   - Loại bỏ `stickPos` React state; thay bằng `stickNubRef = useRef<HTMLDivElement | null>(null)`.
   - Cập nhật tọa độ núm Joystick trực tiếp qua CSS `transform: translate3d(...)` trên DOM Ref.
   - Tách biệt `joystickPointerId` và `attackPointerId`, độc lập hoàn toàn giữa ngón cái trái (di chuyển) và ngón cái phải (tấn công/dash).
   - Thêm xử lý `pointercancel`, `blur`, `visibilitychange` để không bị kẹt phím khi app mất tiêu điểm hoặc chuyển background.

2. **`src/types/game.ts`**
   - Thêm cấu trúc dữ liệu `chargeState` trong interface `Enemy`:
     ```typescript
     chargeState?: {
       startX: number;
       startY: number;
       targetX: number;
       targetY: number;
       duration: number; // thời gian lướt tính bằng giây (0.35s)
       elapsed: number;
       speed: number;    // ~460 px/s
       hasHitPlayer: boolean;
     };
     ```

3. **`src/components/GameCanvas.tsx`**
   - **Sửa Dash (Task 3)**: Triển khai thuật toán Swept Collision Raymarching (bước nhảy 3px + 4 vòng Binary Search tinh chỉnh) kiểm tra toàn bộ chặng đường lướt 150px. Đồng bộ ngay lập tức `animPosRef` để triệt tiêu bóng ma trễ frame.
   - **Sửa Exponential Smoothing (Task 4)**: Kẹp `dt` an toàn trong khoảng `[0.001, 0.05]`. Thay thế hệ số cố định `0.35` bằng công thức giải tích chuẩn:
     $$\alpha = 1 - \exp(-24 \cdot dt)$$
   - **Sửa Boss Charge (Task 2)**: Xóa bỏ phép gán tức thời `enemy.x += cos * 160`. Thiết lập trạng thái `enemy.state = 'attacking'` cùng tiến trình lướt `chargeState`. Kiểm tra va chạm vật cản từng frame: nếu đụng tường lập tức dừng lại an toàn trước tường, kích hoạt rung màn hình và hiệu ứng va đập.
   - **Sửa Bug Text Boss (Task 2)**: Sửa logic thông báo khi kết thúc charge: nếu `chargeState.hasHitPlayer === true`, hiển thị thông báo trừng phạt chính xác `"⚡ SƠ HỞ! TRỪNG PHẠT +35%"`. Tuyệt đối không hiển thị `"⚡ HÚC TRƯỢT!"` khi đòn đánh đã trúng người chơi.

4. **`src/engine/p0_regression.test.ts`** *(File mới)*
   - 8 test case tự động bao phủ toàn bộ các kịch bản kiểm thử va chạm góc, va chạm sát tường 2px, tính đồng nhất của exponential smoothing ở các mức FPS (60 FPS vs 30 FPS), và cờ trạng thái va chạm của Boss Charge.

5. **`ANDROID_GAME_AUDIT.md`**
   - Báo cáo kiểm toán hiệu năng tổng thể đã hoàn thành ở bước trước.

6. **`/.gitignore`**
   - Thêm `dev-dist/` vào quy tắc bỏ qua mã nguồn tạm thời.

---

## 3. NGUYÊN NHÂN VÀ CÁCH KHẮC PHỤC CHI TIẾT

### Task 1: Tối ưu Virtual Joystick & Multi-touch Isolation
- **Nguyên nhân**:
  - `TouchControls` trước đây sử dụng `const [stickPos, setStickPos] = useState({ x: 0, y: 0 })`.
  - Trên màn hình Android 90Hz–120Hz, sự kiện `pointermove` phát ra liên tục tới 120 lần mỗi giây, kích hoạt 120 lần React reconciliation cho toàn bộ cụm nút bấm, joystick và overlay UI, gây nghẽn CPU main thread và micro-stuttering.
  - Ngoài ra, sự kiện `pointerup` toàn cục trước đây không kiểm tra `pointerId`, dẫn đến việc thả ngón tay tấn công bên phải có thể xóa luôn trạng thái di chuyển của ngón tay bên trái.
- **Cách khắc phục**:
  - Xóa bỏ hoàn toàn `stickPos` khỏi React state.
  - Sử dụng `stickNubRef` để can thiệp trực tiếp vào DOM:
    ```typescript
    if (stickNubRef.current) {
      stickNubRef.current.style.transform = `translate3d(${stickX}px, ${stickY}px, 0)`;
    }
    ```
  - Quản lý `joystickPointerId.current` và `attackPointerId.current` riêng rẽ. Chỉ reset joystick khi `e.pointerId === joystickPointerId.current`.
  - Bổ sung `setPointerCapture` và bắt các sự kiện `pointercancel`, `window.blur`, `document.visibilitychange` để đảm bảo khi người chơi kéo ngón tay ra ngoài mép màn hình hoặc có thông báo hệ thống, nhân vật không bị trôi/kẹt di chuyển.

### Task 2: Khắc phục Boss Charge & Sửa Text "HÚC TRƯỢT"
- **Nguyên nhân**:
  - Boss sau khi tích chiêu (windup) thực hiện phép gán tọa độ nhảy vọt 1 bước: `enemy.x += cos * 160; enemy.y += sin * 160`. Phép gán này bỏ qua hoàn toàn hệ thống raycast và hitbox địa hình, khiến Boss xuyên thẳng qua các tảng đá/tường ngăn.
  - Khi người chơi dính đòn và mất máu, hệ thống vẫn gắn cờ stun 1.5s và unconditionally in text `"⚡ HÚC TRƯỢT! TRỪNG PHẠT +35%"`, gây mâu thuẫn trực quan nghiêm trọng.
- **Cách khắc phục**:
  - Chuyển cơ chế sang `chargeState` diễn ra trong nhiều frame (khoảng cách 160px với thời gian lướt 0.35s, tương đương vận tốc ~457 px/s).
  - Từng frame trong game loop: di chuyển theo vector hướng với bước di chuyển $\Delta s = v \cdot dt$. Kiểm tra hàm `isCollidingWithObstacle(nextX, nextY, hitboxRadius)`:
    - Nếu phát hiện chướng ngại vật phía trước: Boss dừng lại ngay lập tức tại vị trí an toàn trước va chạm, hủy charge, kích hoạt rung chấn màn hình (`screenShakeRef.current = 8`) và hiệu ứng va đập bụi đá.
    - Kiểm tra hitbox người chơi: nếu trúng đòn, trừ máu người chơi, đánh dấu `chargeState.hasHitPlayer = true`.
  - Khi kết thúc quá trình charge: kiểm tra biến `hasHitPlayer`. Nếu đánh trúng người chơi, Boss chỉ bị choáng do sơ hở (`"⚡ SƠ HỞ! TRỪNG PHẠT +35%"`). Chỉ khi không trúng người chơi mới thông báo `"⚡ HÚC TRƯỢT! TRỪNG PHẠT +35%"`.

### Task 3: Sửa lỗi Dash xuyên tường (Swept Collision)
- **Nguyên nhân**:
  - `triggerDash` tính trước điểm đích cách vị trí hiện tại một đoạn cố định: `targetX = p.x + cos * 45; targetY = p.y + sin * 45`.
  - Logic cũ chỉ kiểm tra `isPositionValid(targetX, targetY)`. Nếu người chơi đứng cách tường 20px, điểm đích 45px sẽ nằm bên kia bức tường mỏng hoặc nếu vị trí đích hợp lệ bên trong phòng trống sau tường, người chơi sẽ nhảy xuyên tường (phase-through).
- **Cách khắc phục**:
  - Triển khai thuật toán Swept Raymarching từng bước nhỏ 3px từ vị trí người chơi đến khoảng cách lướt tối đa.
  - Khi phát hiện bước đi tiếp theo chạm vật cản, áp dụng thuật toán Tìm kiếm Nhị phân (Binary Search) 4 bước để xác định chính xác bề mặt tiếp xúc với độ chuẩn xác dưới 0.2px.
  - Lùi lại một lề an toàn (`margin = 3px`) để đảm bảo hitbox hình tròn của nhân vật hoàn toàn tự do và không bị kẹt vào mesh địa hình.
  - Cập nhật tức thời `animPosRef.current = { x: p.x, y: p.y }` để camera và hình ảnh render không bị kéo trôi hay tạo ảo giác giật lùi.

### Task 4: Chuyển động độc lập FPS (Exponential Motion Smoothing)
- **Nguyên nhân**:
  - GameCanvas sử dụng hệ số nội suy cứng:
    `animPos.x += (p.x - animPos.x) * 0.35`
  - Hệ số 0.35 được thiết kế dựa trên giả định 60 FPS cố định. Khi chạy trên màn hình 120Hz (flagship Android), độ mượt nội suy chạy nhanh gấp đôi; ngược lại khi tụt xuống 30–40 FPS (khi giao tranh đông quái), nhân vật bị ì trệ và chậm hơn một nửa so với thời gian thực.
- **Cách khắc phục**:
  - Kẹp biến thiên thời gian: `const dt = Math.max(0.001, Math.min(0.05, (now - lastFrameTime) / 1000))`.
  - Áp dụng công thức suy giảm hàm mũ chuẩn vật lý trò chơi điện tử:
    $$\alpha = 1 - e^{-\lambda \cdot dt} \quad (\lambda = 24)$$
  - Với $\lambda = 24$, tại 60 FPS ($dt \approx 0.0166s$):
    $$\alpha = 1 - e^{-24 \times 0.01667} \approx 1 - e^{-0.4} \approx 0.33$$
    (trùng khớp hoàn hảo với cảm giác điều khiển 0.35 nguyên bản nhưng độc lập 100% với tần số quét của màn hình).

---

## 4. KẾT QUẢ BUILD & KIỂM THỬ

### 4.1 Kết quả kiểm tra biên dịch và kiểu dữ liệu (TypeScript & Lint)
- **`compile_applet`**:
  ```
  Build succeeded - the applet is compiled.
  ```
- **`lint_applet` (`tsc --noEmit`)**:
  ```
  Linting completed successfully.
  $ tsc --noEmit (0 errors)
  ```
- **`npm run build` (Vite Production Build)**:
  ```
  vite v8.3.4 building client environment for production...
  transforming...
  ✓ 1721 modules transformed.
  rendering chunks...
  dist/index.html                     2.22 kB │ gzip:   0.91 kB
  dist/assets/index-Du3D9Z-X.css    141.96 kB │ gzip:  17.82 kB
  dist/assets/index-D2W5jC4c.js   1,868.21 kB │ gzip: 476.96 kB
  ✓ built in 1.51s
  PWA v2.0.0: sw.js generated
  ```

### 4.2 Kết quả chạy Regression Tests (`node:test`)
Chạy lệnh kiểm thử tự động:
```bash
npx tsx --test src/engine/p0_regression.test.ts
```
**Kết quả: 8/8 Test Suite ĐẠT (PASS)**:
1. `Dash in open space travels full 150px without obstacle` -> **PASS**
2. `Dash starting flush against a wall (2px away facing wall) stops safely without penetrating` -> **PASS**
3. `Dash heading into an obstacle corner stops safely with margin` -> **PASS**
4. `Exponential smoothing reaches equivalent distance at 60 FPS and 30 FPS over 1 second` -> **PASS**
5. `Exponential smoothing does not overshoot on sudden delta time step` -> **PASS**
6. `Boss Charge multi-frame progress, obstacle stop and non-contradictory text` -> **PASS**
7. `Boss Charge hitting player displays SƠ HỞ TRỪNG PHẠT instead of HÚC TRƯỢT` -> **PASS**
8. `InputManager normalizes touch movement vector properly within [-1, 1]` -> **PASS**

---

## 5. NHỮNG YẾU TỐ CHƯA THỂ XÁC MINH TRONG MÔI TRƯỜNG SANDBOX

Do môi trường lập trình là máy ảo container headless Linux:
1. **Phản hồi rung phần cứng (Haptic Engine)**: Các lệnh rung `navigator.vibrate` của Web API / Capacitor Haptics cần thiết bị Android vật lý để cảm nhận độ trễ và lực rung.
2. **Độ trễ cảm ứng thực tế (Touch Digitizer Latency)**: Tần số lấy mẫu ngón tay 240Hz/360Hz của màn hình cảm ứng điện dung chỉ kiểm chứng được trên phần cứng máy thật.
3. **Ghost touches / Mồ hôi tay khi giao tranh**: Hành vi đa chạm trên mép màn hình cong (Edge rejection).

---

## 6. HƯỚNG DẪN KIỂM TRA TRÊN THIẾT BỊ ANDROID THẬT

Sau khi build APK hoặc chạy qua Capacitor CLI (`npx cap run android`):

1. **Kiểm tra Virtual Joystick (Task 1)**:
   - Dùng ngón cái trái di chuyển vòng tròn liên tục ở tốc độ cao (màn hình 90Hz/120Hz).
   - Quan sát góc trên màn hình xem có hiện tượng tụt khung hình hay không.
   - Giữ nguyên ngón trái đang di chuyển, đồng thời dùng ngón cái phải nhấp liên hồi nút Tấn công / Tuyệt kỹ / Né. Kiểm tra đảm bảo nhân vật không bị khựng lại hay đứng yên khi ngón phải nhả ra.
   - Thử kéo ngón tay ra ngoài vùng viền dưới của điện thoại; khi thả tay ra, joystick phải tự động hồi về tâm.

2. **Kiểm tra Dash né đòn sát tường (Task 3)**:
   - Điều khiển nhân vật đứng sát vách đá hoặc các bức tường cổ tự (cách tường 5px - 10px).
   - Hướng mặt vào thẳng bức tường và bấm nút Dash.
   - Nhân vật phải dừng lại ngay trước mép tường với khoảng đệm an toàn, tuyệt đối không bị kẹt vào trong tường hay dịch chuyển sang phòng kế bên.

3. **Kiểm tra Trận chiến với Boss (Task 2)**:
   - Khi Boss chuẩn bị Húc (hiển thị đường màu đỏ cảnh báo):
     - **Trường hợp né thành công**: Lướt ra sau tảng đá lớn. Boss lao đến va vào đá sẽ dừng lại, màn hình rung lên và xuất hiện dòng chữ `"⚡ HÚC TRƯỢT! TRỪNG PHẠT +35%"`.
     - **Trường hợp bị đòn húc trúng**: Người chơi bị hất lùi và mất máu. Kiểm tra trên đầu Boss phải hiển thị `"⚡ SƠ HỞ! TRỪNG PHẠT +35%"`, không được xuất hiện chữ `"HÚC TRƯỢT"`.

4. **Kiểm tra Độ mượt khi đổi tần số quét (Task 4)**:
   - Thử chuyển đổi tần số quét màn hình trên Android (Cài đặt -> Màn hình -> 60Hz và 120Hz).
   - Tốc độ di chuyển và độ mượt của camera/nhân vật phải đồng nhất 100% theo thời gian thực.
