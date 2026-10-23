import React, { useState } from "react";
import {
  Search,
  X,
  Menu,
  Download,
  Bookmark,
  History,
  ArrowLeft,
  ListOrdered,
  Loader2,
} from "lucide-react";
import { useDownloads } from "@/context/DownloadContext";

interface NavbarProps {
  onSearch: (query: string) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  activeTab: "feed" | "downloader" | "bookmarks" | "history";
  onTabChange: (tab: "feed" | "downloader" | "bookmarks" | "history") => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  canGoBack?: boolean;
  onBack?: () => void;
}

export default function Navbar({
  onSearch,
  activeFilter,
  onFilterChange,
  activeTab,
  onTabChange,
  onToggleSidebar,
  isSidebarOpen,
  canGoBack = false,
  onBack,
}: NavbarProps) {
  const [searchInput, setSearchInput] = useState("");
  const { tasks, activeTaskCount, setIsQueueModalOpen } = useDownloads();

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
      onTabChange("feed");
    }
  };

  const handleClearSearch = () => {
    setSearchInput("");
    onSearch("");
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-zinc-950/95 border-b border-zinc-800 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Back Button, Sidebar Toggle & Brand */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Universal Back Button */}
          {activeTab !== "feed" ? (
            <button
              onClick={() => onTabChange("feed")}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition flex items-center gap-1 text-xs font-semibold cursor-pointer shadow-sm"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden md:inline">Beranda</span>
            </button>
          ) : (
            <button
              onClick={onToggleSidebar}
              className="p-2 -ml-1 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div
            onClick={() => {
              onFilterChange("latest");
              onTabChange("feed");
              setSearchInput("");
            }}
            className="flex items-center gap-2 cursor-pointer select-none group ml-1"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-100 flex items-center justify-center font-black text-zinc-950 text-xs sm:text-sm tracking-tighter shadow group-hover:scale-105 transition">
              AV
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xs sm:text-sm tracking-tight text-white group-hover:text-zinc-200 transition flex items-center gap-1">
                AVTUB
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  FAST
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-xl mx-1 sm:mx-2">
          <form onSubmit={handleSubmitSearch} className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari video tanpa batas..."
              className="w-full pl-9 pr-8 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>

        {/* Right: Background Queue Status Button & Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Background Queue Button (Always Accessible) */}
          <button
            onClick={() => setIsQueueModalOpen(true)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border shadow-sm ${
              activeTaskCount > 0
                ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 animate-pulse"
                : tasks.length > 0
                ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700"
                : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 border-zinc-800"
            }`}
            title="Antrian & Riwayat Download Background"
          >
            {activeTaskCount > 0 ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ListOrdered className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Antrian</span>
            <span className="px-1.5 py-0.2 rounded-md bg-black/40 text-[10px] font-mono">
              {tasks.length}
            </span>
          </button>

          <button
            onClick={() => onTabChange("downloader")}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border ${
              activeTab === "downloader"
                ? "bg-zinc-100 text-zinc-950 border-white shadow"
                : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border-zinc-800"
            }`}
            title="Ekstrak URL AVTub"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Extractor</span>
          </button>

          <button
            onClick={() => onTabChange("bookmarks")}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer border ${
              activeTab === "bookmarks"
                ? "bg-zinc-100 text-zinc-950 border-white shadow"
                : "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border-zinc-800"
            }`}
            title="Video Tersimpan"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Tersimpan</span>
          </button>
        </div>
      </div>
    </header>
  );
}
