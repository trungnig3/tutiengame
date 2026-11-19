# PHASE 2.3 – ENVIRONMENT PIXEL ART TEST REPORT
**Dự án:** Phàm Trần Tiên Lộ (凡尘仙路) | **Nhánh:** `audit/android-performance`  

---

## 1. Tổng Quan Kết Quả Kiểm Thử Tự Động

| Bộ kiểm thử / Công cụ | Phạm vi | Kết quả | Tệp log gốc |
|---|---|---|---:|
| `node scripts/pixel_env_audit.cjs` | Kích thước PNG, RGBA alpha=0, periodic tile wrap, bộ nhớ giải mã & offscreen cache | **8/8 PASS** | `public/evidence/logs/phase_2_3_env_audit.json` |
| `phase2_3_environment_integration.test.ts` | Assets, `ENV_SPRITE_RECTS`, 8 bản đồ không biến đổi tọa độ, `EnvironmentRenderer` 2-pass Layer 2/3 & Nearest-Neighbor | **5/5 PASS** | `public/evidence/logs/phase_2_3_test_output.txt` |
| Bộ hồi quy Phase 2.0 + 2.1 + 2.2 + P0 | Toàn bộ 7 file `.test.ts` trong dự án (`lam_mac`, `monster`, `boss`, `environment`, `sandbox`, `p0_regression`) | **60/60 PASS (0 Fail)** | `public/evidence/logs/phase_2_3_test_output.txt` |
| `npx tsc --noEmit` | Kiểm tra toàn bộ kiểu TypeScript dự án | **EXIT 0 (0 lỗi)** | `public/evidence/logs/phase_2_3_build_check.txt` |
| `npm run build` | Production build Vite + PWA Service Worker precache (`158 entries`) | **EXIT 0 (1.65s)** | `public/evidence/logs/phase_2_3_build_check.txt` |
| Headless Chromium (`playwright-cli`) | Gameplay thực tế tại `map_thanh_khe`, `map_linh_vu`, `map_hac_phong_son` + Mobile `844×390` | **PASS (0 console errors)** | `public/evidence/phase2_3/*`, `public/evidence/videos/environment/*` |

---

## 2. Log Nguyên Bản Kiểm Toán Pixel (`phase_2_3_env_audit.json` – Trích Đoạn Tóm Tắt)

```json
{
  "phase": "2.3",
  "metadataVersion": "2.3.0",
  "totalRuntimeSheets": 7,
  "totalDiskBytes": 54572,
  "totalDiskKB": 53.29,
  "totalDecodedSpriteSheetsBytes": 2686976,
  "totalDecodedSpriteSheetsMB": 2.563,
  "activeMapStaticOffscreenCacheMaxBytes": 8640000,
  "activeMapStaticOffscreenCacheMaxMB": 8.24,
  "combinedEnvironmentDecodedAndCacheMB": 10.802,
  "hardwareNote": "Measured mathematically from RGBA8888 buffer dimensions; physical Android GPU FPS is NOT VERIFIED ON PHYSICAL HARDWARE."
}
```

---

## 3. Log Nguyên Bản Test Runner (`npx tsx --test`) – Toàn Bộ 7 Bộ Test

```text
# Subtest: PHASE 2.3: ENVIRONMENT PIXEL ART VALIDATION & INTEGRATION
    ok 1 - 1. All 7 runtime PNGs, metadata.json, preview_showcase.png, and legacy files exist on disk
    ok 2 - 2. Exact PNG dimensions, RGBA alpha transparency, and seamless ground tile wrapping
    ok 3 - 3. Deterministic MapEnvironmentLayout across ALL 8 maps preserves all gameplay coordinates
    ok 4 - 4. EnvironmentRenderer obstacle resolution, Nearest-Neighbor, 2-pass Layer 2/Layer 3 occlusion, & cache lifecycle
    ok 5 - 5. Phase 2.0 / 2.1 / 2.2 non-interference check
ok 12 - PHASE 2.3: ENVIRONMENT PIXEL ART VALIDATION & INTEGRATION

1..18
# tests 60
# suites 5
# pass 60
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1907.227873
```

---

## 4. Log Nguyên Bản Typecheck & Production Build (`phase_2_3_build_check.txt`)

```text
=== npx tsc --noEmit ===
EXIT: 0
=== npm run build ===

> react-example@0.0.0 build
> vite build

vite v8.3.4 building client environment for production...
transforming...
✓ 1732 modules transformed.
rendering chunks...
computing gzip size...
dist/manifest.json                                   0.74 kB │ gzip:   0.45 kB
dist/index.html                                      2.22 kB │ gzip:   0.91 kB
dist/assets/index-CqiazocI.css                     148.19 kB │ gzip:  18.44 kB
dist/assets/workbox-window.prod.es5-Bd17z0YL.js      5.65 kB │ gzip:   2.20 kB
dist/assets/index-DJsz8789.js                    1,971.94 kB │ gzip: 500.96 kB

✓ built in 1.65s
PWA v2.0.0
mode      generateSW
precache  158 entries (14939.35 KiB)
files generated
  dist/sw.js
  dist/workbox-afac4cd2.js
EXIT: 0
```

---

## 5. Danh Sách Bằng Chứng Trực Quan Đã Lưu Trữ (`public/evidence/`)

- **Ảnh chụp gameplay trực tiếp (`public/evidence/phase2_3/`)**:
  - `thanh_khe_village.png` (510 KB)
  - `thanh_khe_bridge.png` (510 KB)
  - `linh_vu_forest_boss.png` (533 KB)
  - `hac_phong_son.png` (435 KB)
  - `mobile_landscape_844x390.png` (154 KB)
- **Video WebM gameplay trực tiếp (`public/evidence/videos/environment/`)**:
  - `phase2_3_thanh_khe_gameplay.webm` (836 KB)
  - `phase2_3_biomes_walkthrough.webm` (2.2 MB)
- **Trang tổng hợp bằng chứng**: `/evidence/index.html` (đã cập nhật mục Phase 2.3 đầy đủ).
- **Giới hạn phần cứng**: *Chưa đo trực tiếp FPS trên thiết bị Android thật (`NOT VERIFIED ON PHYSICAL HARDWARE`).*
