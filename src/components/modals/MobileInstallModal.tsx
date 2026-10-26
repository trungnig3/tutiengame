import React, { useState } from 'react';
import { X, Smartphone, Download, Share2, CheckCircle2, QrCode, Copy, ExternalLink, ShieldCheck, Zap } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface MobileInstallModalProps {
  onClose: () => void;
}

export const MobileInstallModal: React.FC<MobileInstallModalProps> = ({ onClose }) => {
  const { isInstalled, canInstall, isIOS, installApp } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'pwa' | 'apk'>('pwa');

  const currentUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInstallClick = async () => {
    const success = await installApp();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-xl bg-stone-900 border-2 border-amber-500/70 rounded-2xl shadow-2xl p-6 text-stone-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-center border-b border-amber-800/60 pb-3 mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 p-0.5 shadow-lg flex items-center justify-center">
              <img src="/pwa-192x192.png" alt="Icon" className="w-full h-full object-cover rounded-[10px]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-amber-300 font-title">
                Tải & Chơi Trên Điện Thoại Mobile
              </h2>
              <p className="text-xs text-stone-400">Trải nghiệm màn hình dọc/ngang, mượt mà không độ trễ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs: PWA Trực Tiếp vs Xuất APK */}
        <div className="flex border-b border-stone-800 mb-4 gap-2 relative z-10">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer border-b-2 ${
              activeTab === 'pwa'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            Cài Đặt Nhanh (PWA WebApp)
          </button>
          <button
            onClick={() => setActiveTab('apk')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer border-b-2 ${
              activeTab === 'apk'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Download className="w-4 h-4 text-sky-400" />
            Đóng Gói File APK / Native
          </button>
        </div>

        {/* Tab 1: PWA (Recommended, Works Instantly) */}
        {activeTab === 'pwa' && (
          <div className="overflow-y-auto space-y-4 pr-1 text-xs sm:text-sm relative z-10 custom-scrollbar">
            {isInstalled ? (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-600/70 text-emerald-200 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Game đã được cài đặt vào máy!</p>
                  <p className="text-xs text-emerald-300/80">Bạn đang trải nghiệm chế độ Độc lập (Standalone Native App).</p>
                </div>
              </div>
            ) : canInstall ? (
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/70 to-stone-900 border border-amber-500/80 shadow-lg text-center space-y-3">
                <div className="inline-flex p-3 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300">
                  <Download className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-amber-200">Trình duyệt đã sẵn sàng cài đặt!</h3>
                  <p className="text-xs text-stone-300 mt-1">
                    Nhấn nút bên dưới để thêm game vào màn hình chính điện thoại, mở lên chơi toàn màn hình như ứng dụng tải từ App Store / CH Play.
                  </p>
                </div>
                <button
                  onClick={handleInstallClick}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-stone-950 font-bold text-sm tracking-wide shadow-xl transition transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Cài Đặt Game Vào Điện Thoại Ngay
                </button>
              </div>
            ) : null}

            {/* Platform Guides */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* iOS Guide */}
              <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                  <Smartphone className="w-4 h-4" />
                  iPhone / iPad (Safari)
                </div>
                <ol className="text-xs text-stone-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>Mở liên kết game trên trình duyệt <strong>Safari</strong>.</li>
                  <li>
                    Nhấn vào nút <strong>Chia sẻ (Share)</strong> <Share2 className="w-3.5 h-3.5 inline text-sky-400" /> ở thanh dưới màn hình.
                  </li>
                  <li>Cuộn xuống chọn <strong>"Thêm vào MH chính"</strong> (Add to Home Screen).</li>
                  <li>Nhấn <strong>"Thêm" (Add)</strong> ở góc trên bên phải.</li>
                </ol>
                <div className="text-[11px] text-emerald-400 bg-emerald-950/40 p-2 rounded border border-emerald-800/40">
                  ✓ Icon game xuất hiện ngoài màn hình, mở lên chơi toàn màn hình (không thanh web)!
                </div>
              </div>

              {/* Android Guide */}
              <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-2">
                <div className="flex items-center gap-2 text-sky-300 font-bold text-xs uppercase tracking-wider">
                  <Smartphone className="w-4 h-4" />
                  Android (Chrome, Cốc Cốc)
                </div>
                <ol className="text-xs text-stone-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>Mở liên kết game trên <strong>Chrome / Cốc Cốc</strong>.</li>
                  <li>
                    Nhấn vào <strong>dấu 3 chấm (⋮)</strong> ở góc trên bên phải trình duyệt.
                  </li>
                  <li>Chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào màn hình chính"</strong>.</li>
                  <li>Xác nhận <strong>Cài đặt</strong>.</li>
                </ol>
                <div className="text-[11px] text-sky-400 bg-sky-950/40 p-2 rounded border border-sky-800/40">
                  ✓ Hỗ trợ chơi offline một phần, joystick cảm ứng ảo tự động tối ưu hóa!
                </div>
              </div>
            </div>

            {/* Quick Share Link / QR */}
            <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 space-y-2">
              <div className="text-xs font-bold text-amber-300 flex items-center justify-between">
                <span>Liên Kết Truy Cập Trên Điện Thoại</span>
                <span className="text-[10px] text-stone-400 font-normal">Quét hoặc gửi link sang mobile</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-300 select-all font-mono truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-stone-950" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Đã Sao Chép!' : 'Sao Chép'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Export to APK (Capacitor / Android Studio) */}
        {activeTab === 'apk' && (
          <div className="overflow-y-auto space-y-3.5 pr-1 text-xs sm:text-sm relative z-10 custom-scrollbar">
            <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-800/50 text-sky-200">
              <p className="font-bold text-xs sm:text-sm">Đóng gói file cài đặt .APK cài trực tiếp trên Android</p>
              <p className="text-[11px] text-sky-300/80 mt-1">
                Dự án được xây dựng bằng React + Vite nên có thể đóng gói thành file `.apk` cài đặt trực tiếp thông qua Capacitor chỉ với vài bước lệnh đơn giản:
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-stone-950 border border-stone-800 space-y-1.5">
                <span className="text-[11px] font-bold text-amber-400">Bước 1: Build mã nguồn web thành thư mục tĩnh</span>
                <pre className="p-2 rounded bg-stone-900 text-stone-300 text-[11px] font-mono overflow-x-auto">
                  npm run build
                </pre>
              </div>

              <div className="p-3 rounded-lg bg-stone-950 border border-stone-800 space-y-1.5">
                <span className="text-[11px] font-bold text-amber-400">Bước 2: Cài đặt Capacitor Android bridge</span>
                <pre className="p-2 rounded bg-stone-900 text-stone-300 text-[11px] font-mono overflow-x-auto">
                  npm install @capacitor/core @capacitor/cli @capacitor/android
                </pre>
              </div>

              <div className="p-3 rounded-lg bg-stone-950 border border-stone-800 space-y-1.5">
                <span className="text-[11px] font-bold text-amber-400">Bước 3: Khởi tạo và đồng bộ sang Android Project</span>
                <pre className="p-2 rounded bg-stone-900 text-stone-300 text-[11px] font-mono overflow-x-auto">
{`npx cap init "Phàm Trần Tiên Lộ" "com.phamtrantienlo.game" --web-dir dist
npx cap add android
npx cap copy`}
                </pre>
              </div>

              <div className="p-3 rounded-lg bg-stone-950 border border-stone-800 space-y-1.5">
                <span className="text-[11px] font-bold text-amber-400">Bước 4: Xuất file APK bằng Android Studio</span>
                <pre className="p-2 rounded bg-stone-900 text-stone-300 text-[11px] font-mono overflow-x-auto">
                  npx cap open android
                </pre>
                <p className="text-[11px] text-stone-400">
                  Trong Android Studio: Chọn menu <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>. Bạn sẽ nhận được file <code>app-debug.apk</code> hoặc <code>app-release.apk</code> để gửi vào điện thoại cài đặt ngay!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-stone-800 pt-3 mt-4 flex justify-between items-center relative z-10 text-[11px] text-stone-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Tiến trình và vật phẩm được lưu trữ an toàn trong máy</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 transition font-medium cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
