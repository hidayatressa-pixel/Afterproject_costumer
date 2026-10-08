import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Printer,
  QrCode,
  Settings,
  LogOut,
  Search,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Volume2,
  VolumeX,
  RefreshCw,
  Plus,
  Filter,
  DollarSign,
  TrendingUp,
  Layers,
  Sparkles,
  Smartphone,
  HardDrive,
  Cloud,
} from 'lucide-react';
import { PrintRequest, StoreSettings, RequestStatus } from '../types';
import { BrandingLockup } from './BrandingLockup';
import { formatRupiah } from '../lib/pricing';
import { getAllRequests, updateRequestStatus, saveStoreSettings } from '../lib/db';
import { RequestDetailModal } from './RequestDetailModal';
import { QRDisplayView } from './QRDisplayView';
import { PrintTicketModal } from './PrintTicketModal';

interface AdminDashboardProps {
  settings: StoreSettings;
  onSettingsUpdated: (newSettings: StoreSettings) => void;
  onLogout: () => void;
  onNavigateToUpload: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

type AdminTab = 'dashboard' | 'requests' | 'qrcode' | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  settings,
  onSettingsUpdated,
  onLogout,
  onNavigateToUpload,
  soundEnabled,
  onToggleSound,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('requests');
  const [requests, setRequests] = useState<PrintRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('all');
  const [selectedRequest, setSelectedRequest] = useState<PrintRequest | null>(null);
  const [ticketRequest, setTicketRequest] = useState<PrintRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Settings edit state
  const [editableSettings, setEditableSettings] = useState<StoreSettings>(settings);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    const data = await getAllRequests();
    setRequests(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Filtered requests
  const filteredRequests = requests.filter((req) => {
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesSearch =
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.customerPhone || '').includes(searchQuery) ||
      (req.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.files.some((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Analytics counts
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const processingCount = requests.filter((r) => r.status === 'processing').length;
  const readyCount = requests.filter((r) => r.status === 'ready').length;
  const completedCount = requests.filter((r) => r.status === 'completed').length;
  const totalRevenue = requests
    .filter((r) => r.status === 'completed' || r.paymentStatus === 'paid')
    .reduce((sum, r) => sum + (r.actualPrice || r.estimatedPrice || 0), 0);

  // Quick cycle status
  const handleQuickCycleStatus = async (e: React.MouseEvent, req: PrintRequest) => {
    e.stopPropagation();
    let nextStatus: RequestStatus = 'pending';
    if (req.status === 'pending') nextStatus = 'processing';
    else if (req.status === 'processing') nextStatus = 'ready';
    else if (req.status === 'ready') nextStatus = 'completed';
    else if (req.status === 'completed') nextStatus = 'pending';

    await updateRequestStatus(req.id, nextStatus);
    fetchRequests();
  };

  const handleDownloadFile = (e: React.MouseEvent, fileItem: { name: string; dataUrl?: string }) => {
    e.stopPropagation();
    if (fileItem.dataUrl) {
      const a = document.createElement('a');
      a.href = fileItem.dataUrl;
      a.download = fileItem.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const blob = new Blob([`AFTER PROJECT PHOTOCOPY - File Placeholder: ${fileItem.name}`], {
        type: 'text/plain',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileItem.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadAllFiles = (e: React.MouseEvent, req: PrintRequest) => {
    e.stopPropagation();
    if (!req.files || req.files.length === 0) return;
    req.files.forEach((file, index) => {
      setTimeout(() => {
        handleDownloadFile(e, file);
      }, index * 250);
    });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveStoreSettings(editableSettings);
    onSettingsUpdated(editableSettings);
    setSettingsSavedMessage(true);
    setTimeout(() => setSettingsSavedMessage(false), 3000);
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Menunggu',
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          dot: 'bg-amber-500',
        };
      case 'processing':
        return {
          label: 'Sedang Cetak',
          bg: 'bg-sky-100 text-sky-900 border-sky-300',
          dot: 'bg-sky-500 animate-pulse',
        };
      case 'ready':
        return {
          label: 'Siap Diambil',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          dot: 'bg-emerald-500',
        };
      case 'completed':
        return {
          label: 'Selesai',
          bg: 'bg-neutral-100 text-neutral-800 border-neutral-300',
          dot: 'bg-neutral-500',
        };
      default:
        return {
          label: status,
          bg: 'bg-neutral-100 text-neutral-800 border-neutral-300',
          dot: 'bg-neutral-400',
        };
    }
  };

  return (
    <div className="ap-admin-shell min-h-screen flex flex-col">
      {/* Required Admin Header (Statis) */}
      <header className="relative bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">
            {/* Header Title: AFTER PROJECT PHOTOCOPY */}
            <div className="flex items-center gap-3">
              <BrandingLockup size="md" />
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold ap-gradient-button text-white tracking-widest uppercase">
                OPERATOR KASIR
              </span>
            </div>

            {/* Navigation tabs */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'dashboard'
                    ? 'ap-gradient-button text-white shadow-lg'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden md:inline">Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab('requests')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap relative ${
                  activeTab === 'requests'
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <Printer className="w-4 h-4" />
                <span>Print Requests</span>
                {pendingCount > 0 && (
                  <span className="ml-1 w-4 h-4 rounded-full bg-amber-500 text-neutral-900 text-[10px] font-bold flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('qrcode')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'qrcode'
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>QR Code</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>

              <div className="h-5 w-px bg-neutral-200 mx-1 hidden sm:block" />

              <button
                onClick={onToggleSound}
                className="p-2 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
                title={soundEnabled ? 'Matikan Notifikasi Suara' : 'Aktifkan Notifikasi Suara'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <VolumeX className="w-4 h-4 text-neutral-400" />
                )}
              </button>

              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors whitespace-nowrap border border-neutral-200"
                title="Buka halaman upload pelanggan"
              >
                <LogOut className="w-3.5 h-3.5 rotate-180 text-neutral-500" />
                <span className="hidden sm:inline">Halaman Pelanggan</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: OVERVIEW DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/70 p-4 rounded-2xl border border-blue-200 shadow-sm">
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                  Total Masuk
                </span>
                <div className="text-2xl font-black font-mono text-blue-900 mt-1 tabular-nums">
                  {requests.length}
                </div>
                <div className="text-[11px] text-blue-600/80 mt-1 font-medium">Hari ini</div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50/70 p-4 rounded-2xl border border-amber-200 shadow-sm">
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                  Menunggu Antrian
                </span>
                <div className="text-2xl font-black font-mono text-amber-900 mt-1 tabular-nums">
                  {pendingCount}
                </div>
                <div className="text-[11px] text-amber-700/80 mt-1 font-medium">Belum dicetak</div>
              </div>

              <div className="bg-gradient-to-br from-sky-50 to-cyan-50/70 p-4 rounded-2xl border border-sky-200 shadow-sm">
                <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider block">
                  Sedang Dicetak
                </span>
                <div className="text-2xl font-black font-mono text-sky-900 mt-1 tabular-nums">
                  {processingCount}
                </div>
                <div className="text-[11px] text-sky-700/80 mt-1 font-medium">Proses mesin</div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50/70 p-4 rounded-2xl border border-emerald-200 shadow-sm">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Siap Diambil
                </span>
                <div className="text-2xl font-black font-mono text-emerald-900 mt-1 tabular-nums">
                  {readyCount}
                </div>
                <div className="text-[11px] text-emerald-700/80 mt-1 font-medium">Di etalase kasir</div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-violet-50/70 p-4 rounded-2xl border border-purple-200 shadow-sm col-span-2 lg:col-span-1">
                <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">
                  Estimasi Omset
                </span>
                <div className="text-xl font-black font-mono text-purple-900 mt-1 tabular-nums">
                  {formatRupiah(totalRevenue)}
                </div>
                <div className="text-[11px] text-purple-700/80 mt-1 font-medium">{completedCount} pesanan selesai</div>
              </div>
            </div>

            {/* Quick Action Queue Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-blue-900/50">
              <div>
                <span className="text-xs font-black text-blue-300 uppercase tracking-widest">
                  OPERATOR WORKFLOW
                </span>
                <h3 className="text-xl sm:text-2xl font-black mt-1">
                  LOGIN → RECEIVE → DOWNLOAD → PRINT
                </h3>
                <p className="text-xs text-blue-100/80 mt-2 max-w-xl">
                  Dokumen dari customer masuk otomatis ke antrian di bawah. Anda cukup klik tombol
                  "Download" untuk membuka file di PC cetak toko, lalu cetak sesuai instruksi.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setActiveTab('requests')}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md active:scale-95"
                >
                  Buka Antrian Print
                </button>
                <button
                  onClick={onNavigateToUpload}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-xl transition-colors"
                >
                  Upload Manual
                </button>
              </div>
            </div>

            {/* Recent Pending Requests Preview */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-neutral-900">
                  Antrian Perlu Diproses Segera ({pendingCount})
                </h4>
                <button
                  onClick={() => setActiveTab('requests')}
                  className="text-xs font-semibold text-neutral-600 hover:text-neutral-900"
                >
                  Lihat Semua →
                </button>
              </div>

              {pendingCount === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-xs">
                  Tidak ada antrian tertunda. Semua dokumen sedang atau telah selesai diproses!
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {requests
                    .filter((r) => r.status === 'pending')
                    .slice(0, 4)
                    .map((req) => {
                      const firstFile = req.files[0];
                      return (
                      <div
                        key={req.id}
                        onClick={() => setSelectedRequest(req)}
                        className="py-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-neutral-50 px-2 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-black text-neutral-900 w-16">
                            {req.id}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-neutral-900">
                              {req.customerName}
                            </div>
                            <div className="text-[11px] text-neutral-500">
                              {req.files.length} file {req.notes ? `· "${req.notes}"` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {req.files.length > 1 ? (
                            <button
                              onClick={(e) => handleDownloadAllFiles(e, req)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 shadow-sm"
                              title="Download Semua File"
                            >
                              <Download className="w-3 h-3 text-emerald-300" />
                              <span>Download ({req.files.length})</span>
                            </button>
                          ) : firstFile ? (
                            <button
                              onClick={(e) => handleDownloadFile(e, firstFile)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 shadow-sm"
                              title="Download File"
                            >
                              <Download className="w-3 h-3 text-emerald-300" />
                              <span>Download</span>
                            </button>
                          ) : null}
                          <button
                            onClick={(e) => handleQuickCycleStatus(e, req)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
                          >
                            Cetak
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PRINT REQUESTS (Required Header Title & Subtitle) */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Required Dashboard title & Subtitle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-neutral-900">
                  Print Requests
                </h1>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Kelola file pelanggan yang masuk.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchRequests}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors shadow-sm"
                  title="Muat ulang antrian"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>

                <button
                  onClick={onNavigateToUpload}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-neutral-900 rounded-xl hover:bg-neutral-800 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Input Pesanan Baru</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
              <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                {/* Search input */}
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari ID (AP-842), nama, file..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-neutral-400 hover:text-neutral-700 absolute right-3 top-2.5"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Status Filter Segmented Controls */}
                <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                  {[
                    { id: 'all', label: 'Semua', count: requests.length },
                    { id: 'pending', label: 'Menunggu', count: pendingCount },
                    { id: 'processing', label: 'Cetak', count: processingCount },
                    { id: 'ready', label: 'Siap Ambil', count: readyCount },
                    { id: 'completed', label: 'Selesai', count: completedCount },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id as 'all' | RequestStatus)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                        statusFilter === tab.id
                          ? 'bg-neutral-900 text-white shadow-sm'
                          : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className="font-mono text-[10px] opacity-80 tabular-nums">
                        ({tab.count})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              {filteredRequests.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-3">
                    <Printer className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-neutral-800">
                    Tidak ada pesanan yang sesuai filter
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Coba sesuaikan pencarian atau reset filter status Anda.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4">Waktu & ID</th>
                        <th className="py-3.5 px-4">Nama Pelanggan</th>
                        <th className="py-3.5 px-4">File Dokumen</th>
                        <th className="py-3.5 px-4">Catatan</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-4 text-right">Download & Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRequests.map((req) => {
                        const statusObj = getStatusBadge(req.status);
                        const primaryFile = req.files[0];

                        return (
                          <tr
                            key={req.id}
                            onClick={() => setSelectedRequest(req)}
                            className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                          >
                            {/* Request ID & Time */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="font-mono font-black text-sm text-blue-900 block">
                                {req.id}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(req.createdAt).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </td>

                            {/* Customer info */}
                            <td className="py-3.5 px-4">
                              <div className="font-extrabold text-slate-900 text-sm">
                                {req.customerName}
                              </div>
                              {req.customerPhone && (
                                <div className="text-[11px] text-slate-500 font-mono">
                                  {req.customerPhone}
                                </div>
                              )}
                            </td>

                            {/* Files */}
                            <td className="py-3.5 px-4">
                              <div className="max-w-[240px]">
                                {primaryFile ? (
                                  <div className="font-bold text-slate-800 truncate" title={primaryFile.name}>
                                    📄 {primaryFile.name}
                                  </div>
                                ) : (
                                  <span className="text-slate-400">Tidak ada file</span>
                                )}
                                <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                  <span className="font-semibold text-blue-700">{req.files.length} dokumen</span>
                                  {primaryFile && primaryFile.size > 0 && (
                                    <>
                                      <span>·</span>
                                      <span className="font-mono">{(primaryFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Customer Notes */}
                            <td className="py-3.5 px-4">
                              {req.notes ? (
                                <span className="p-1.5 bg-amber-50 text-amber-900 rounded-lg text-[11px] font-medium border border-amber-200 block max-w-[200px] truncate" title={req.notes}>
                                  💬 {req.notes}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px] italic">-</span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusObj.bg}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${statusObj.dot}`} />
                                <span>{statusObj.label}</span>
                              </span>
                            </td>

                            {/* Direct Download & Actions */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                {req.files.length > 1 ? (
                                  <button
                                    onClick={(e) => handleDownloadAllFiles(e, req)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                                    title="Download Semua Dokumen Sekaligus"
                                  >
                                    <Download className="w-3.5 h-3.5 text-emerald-300" />
                                    <span>Download ({req.files.length} File)</span>
                                  </button>
                                ) : primaryFile ? (
                                  <button
                                    onClick={(e) => handleDownloadFile(e, primaryFile)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                                    title="Download File Langsung"
                                  >
                                    <Download className="w-3.5 h-3.5 text-emerald-300" />
                                    <span>Download</span>
                                  </button>
                                ) : null}

                                <button
                                  onClick={(e) => handleQuickCycleStatus(e, req)}
                                  className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors border border-slate-200"
                                  title="Ubah Status"
                                >
                                  {req.status === 'pending' ? 'Cetak' : req.status === 'processing' ? 'Siap' : req.status === 'ready' ? 'Selesai' : 'Reset'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: QR CODE */}
        {activeTab === 'qrcode' && (
          <QRDisplayView settings={settings} onNavigateToUpload={onNavigateToUpload} />
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Pengaturan Toko & Tarif Cetak</h2>
              <p className="text-xs text-neutral-500">
                Ubah informasi toko, tarif harga per lembar fotocopy/print, dan PIN keamanan operator.
              </p>
            </div>

            {settingsSavedMessage && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Pengaturan berhasil disimpan!</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Store Identity */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2">
                  Identitas Toko & Konter
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Nama Toko
                    </label>
                    <input
                      type="text"
                      value={editableSettings.storeName}
                      onChange={(e) =>
                        setEditableSettings({ ...editableSettings, storeName: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Nomor WhatsApp Kasir / Toko
                    </label>
                    <input
                      type="text"
                      value={editableSettings.storeWhatsapp}
                      onChange={(e) =>
                        setEditableSettings({ ...editableSettings, storeWhatsapp: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Alamat Lengkap Toko
                  </label>
                  <input
                    type="text"
                    value={editableSettings.storeAddress}
                    onChange={(e) =>
                      setEditableSettings({ ...editableSettings, storeAddress: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      PIN Keamanan Operator (4 Digit)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={editableSettings.operatorPin}
                      onChange={(e) =>
                        setEditableSettings({ ...editableSettings, operatorPin: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Jam Buka Operasional
                    </label>
                    <input
                      type="text"
                      value={editableSettings.operatingHours}
                      onChange={(e) =>
                        setEditableSettings({ ...editableSettings, operatingHours: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Rules */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2">
                  Tarif Print Per Halaman (Rp)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Hitam Putih (B&W) / lembar
                    </label>
                    <input
                      type="number"
                      value={editableSettings.pricing.bwPerPage}
                      onChange={(e) =>
                        setEditableSettings({
                          ...editableSettings,
                          pricing: {
                            ...editableSettings.pricing,
                            bwPerPage: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Warna Biasa / lembar
                    </label>
                    <input
                      type="number"
                      value={editableSettings.pricing.colorPerPage}
                      onChange={(e) =>
                        setEditableSettings({
                          ...editableSettings,
                          pricing: {
                            ...editableSettings.pricing,
                            colorPerPage: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Full Color Foto / lembar
                    </label>
                    <input
                      type="number"
                      value={editableSettings.pricing.fullColorPerPage}
                      onChange={(e) =>
                        setEditableSettings({
                          ...editableSettings,
                          pricing: {
                            ...editableSettings.pricing,
                            fullColorPerPage: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="text-xs font-bold text-neutral-800 mb-2">
                    Biaya Jilid & Finishing (Rp)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="text-[11px] text-neutral-500">Steples</span>
                      <input
                        type="number"
                        value={editableSettings.pricing.bindingPrices.staple}
                        onChange={(e) =>
                          setEditableSettings({
                            ...editableSettings,
                            pricing: {
                              ...editableSettings.pricing,
                              bindingPrices: {
                                ...editableSettings.pricing.bindingPrices,
                                staple: Number(e.target.value),
                              },
                            },
                          })
                        }
                        className="w-full mt-1 px-2.5 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] text-neutral-500">Mika & Lakban</span>
                      <input
                        type="number"
                        value={editableSettings.pricing.bindingPrices.mika_tape}
                        onChange={(e) =>
                          setEditableSettings({
                            ...editableSettings,
                            pricing: {
                              ...editableSettings.pricing,
                              bindingPrices: {
                                ...editableSettings.pricing.bindingPrices,
                                mika_tape: Number(e.target.value),
                              },
                            },
                          })
                        }
                        className="w-full mt-1 px-2.5 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] text-neutral-500">Spiral Kawat</span>
                      <input
                        type="number"
                        value={editableSettings.pricing.bindingPrices.spiral}
                        onChange={(e) =>
                          setEditableSettings({
                            ...editableSettings,
                            pricing: {
                              ...editableSettings.pricing,
                              bindingPrices: {
                                ...editableSettings.pricing.bindingPrices,
                                spiral: Number(e.target.value),
                              },
                            },
                          })
                        }
                        className="w-full mt-1 px-2.5 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <span className="text-[11px] text-neutral-500">Hard Cover</span>
                      <input
                        type="number"
                        value={editableSettings.pricing.bindingPrices.hard_cover}
                        onChange={(e) =>
                          setEditableSettings({
                            ...editableSettings,
                            pricing: {
                              ...editableSettings.pricing,
                              bindingPrices: {
                                ...editableSettings.pricing.bindingPrices,
                                hard_cover: Number(e.target.value),
                              },
                            },
                          })
                        }
                        className="w-full mt-1 px-2.5 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-neutral-900 text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors shadow-sm"
                >
                  Simpan Perubahan Pengaturan
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          settings={settings}
          onClose={() => setSelectedRequest(null)}
          onUpdated={fetchRequests}
        />
      )}

      {/* Ticket Slip Modal */}
      {ticketRequest && (
        <PrintTicketModal
          request={ticketRequest}
          settings={settings}
          onClose={() => setTicketRequest(null)}
        />
      )}
    </div>
  );
};
