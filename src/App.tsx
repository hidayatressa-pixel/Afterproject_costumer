import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CustomerUploadView } from './components/CustomerUploadView';
import { AdminDashboard } from './components/AdminDashboard';
import { CustomerReceiptModal } from './components/CustomerReceiptModal';
import { CustomerTrackerModal } from './components/CustomerTrackerModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { StoreSettings, PrintRequest } from './types';
import { DEFAULT_STORE_SETTINGS } from './lib/pricing';
import {
  getStoreSettings,
  getAllRequests,
  getRequestById,
  subscribeToSync,
} from './lib/db';
import { playNotificationChime } from './lib/audio';

export default function App() {
  const [currentView, setCurrentView] = useState<'customer' | 'admin'>('customer');
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [showTrackerModal, setShowTrackerModal] = useState(false);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('after_project_admin_auth') === 'true';
  });
  const [activeReceipt, setActiveReceipt] = useState<PrintRequest | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Initialize settings, view mode from URL or localStorage, and pending requests
  useEffect(() => {
    getStoreSettings().then(setSettings);
    refreshPendingCount();

    // Check URL parameters for explicit mode or tracking
    const params = new URLSearchParams(window.location.search);
    const trackId = params.get('track');
    const modeParam = params.get('mode') || params.get('view') || params.get('page');

    if (trackId) {
      getRequestById(trackId).then((req) => {
        if (req) {
          setActiveReceipt(req);
        } else {
          setShowTrackerModal(true);
        }
      });
    }

    const hasSessionAuth = sessionStorage.getItem('after_project_admin_auth') === 'true';

    if (modeParam === 'owner' || modeParam === 'admin') {
      if (hasSessionAuth) {
        setCurrentView('admin');
      } else {
        // Harus masukkan PIN terlebih dahulu
        setCurrentView('customer');
        setShowAdminPinModal(true);
      }
    } else {
      setCurrentView('customer');
    }
  }, []);

  const handleSwitchView = (view: 'customer' | 'admin') => {
    setCurrentView(view);
    localStorage.setItem('after_project_view_mode', view);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('page', view === 'admin' ? 'owner' : 'customer');
    window.history.replaceState({}, '', newUrl.toString());
  };

  const handleRequestOwnerAccess = () => {
    if (isAdminAuthenticated) {
      handleSwitchView('admin');
    } else {
      setShowAdminPinModal(true);
    }
  };

  const handlePinSuccess = () => {
    setIsAdminAuthenticated(true);
    sessionStorage.setItem('after_project_admin_auth', 'true');
    setShowAdminPinModal(false);
    handleSwitchView('admin');
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('after_project_admin_auth');
    handleSwitchView('customer');
  };

  const refreshPendingCount = async () => {
    const list = await getAllRequests();
    const count = list.filter((r) => r.status === 'pending').length;
    setPendingCount(count);
  };

  // Cross-tab and live sync subscription
  useEffect(() => {
    const unsubscribe = subscribeToSync((payload) => {
      refreshPendingCount();

      if (payload.type === 'NEW_REQUEST') {
        if (soundEnabled) {
          playNotificationChime();
        }
      } else if (payload.type === 'SETTINGS_UPDATED') {
        setSettings(payload.settings);
      }
    });

    return () => unsubscribe();
  }, [soundEnabled]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Header (Hanya tampil di halaman Pelanggan tanpa tombol switch) */}
      {currentView === 'customer' && (
        <Header onOpenTracker={() => setShowTrackerModal(true)} />
      )}

      {/* Main Views: Pure Customer Page vs Pure Owner/Admin Page */}
      <main className="flex-1 flex flex-col">
        {currentView === 'customer' ? (
          <CustomerUploadView
            settings={settings}
            onRequestSubmitted={(req) => {
              setActiveReceipt(req);
              refreshPendingCount();
            }}
            onOpenQRStandee={handleRequestOwnerAccess}
          />
        ) : (
          <AdminDashboard
            settings={settings}
            onSettingsUpdated={setSettings}
            onLogout={handleAdminLogout}
            onNavigateToUpload={() => handleSwitchView('customer')}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled((prev) => !prev)}
          />
        )}
      </main>

      {/* Footer: Akses Owner/Operator dipusatkan di sini dengan proteksi PIN */}
      {currentView === 'customer' ? (
        <footer className="bg-white border-t border-slate-200/80 py-5 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 no-print mt-auto">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-blue-900">AFTER PROJECT</span>
              <span className="italic uppercase text-blue-600 font-bold">PHOTOCOPY</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500">Digital Print File Transfer</span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">{settings.operatingHours}</span>
              <span className="text-slate-300">·</span>
              <button
                type="button"
                onClick={handleRequestOwnerAccess}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 font-semibold transition-all shadow-sm"
              >
                <span>Akses Owner / Operator (PIN)</span>
                {pendingCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] inline-flex items-center justify-center animate-pulse">
                    {pendingCount}
                  </span>
                )}
                <span>→</span>
              </button>
            </div>
          </div>
        </footer>
      ) : (
        <footer className="bg-neutral-900 border-t border-neutral-800 py-3.5 px-4 sm:px-6 lg:px-8 text-xs text-neutral-400 no-print mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-neutral-300 font-medium">
              <span className="text-white font-bold">AFTER PROJECT PHOTOCOPY</span>
              <span className="text-neutral-600">·</span>
              <span className="text-neutral-400">Mode Operator & Owner</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleAdminLogout}
                className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 hover:underline font-semibold transition-colors"
              >
                <span>← Keluar & Kembali ke Halaman Pelanggan</span>
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* PIN Access Modal for Owner/Operator */}
      {showAdminPinModal && (
        <AdminLoginModal
          correctPin={settings.operatorPin}
          onSuccess={handlePinSuccess}
          onClose={() => setShowAdminPinModal(false)}
        />
      )}

      {/* Modals */}
      {showTrackerModal && (
        <CustomerTrackerModal
          onClose={() => setShowTrackerModal(false)}
          onSelectRequest={(req) => {
            setActiveReceipt(req);
            setShowTrackerModal(false);
          }}
        />
      )}

      {activeReceipt && (
        <CustomerReceiptModal
          request={activeReceipt}
          onClose={() => setActiveReceipt(null)}
          onNewOrder={() => {
            setActiveReceipt(null);
            handleSwitchView('customer');
          }}
        />
      )}
    </div>
  );
}
