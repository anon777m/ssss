"use client";

import React from "react";
import {
  Flame,
  Clock,
  Eye,
  Layers,
  Sparkles,
  Download,
  Bookmark,
  History,
  ShieldCheck,
  Zap,
  Globe,
  Radio,
  X,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilter: string;
  activeCategory: string;
  onSelectFilter: (filter: string) => void;
  onSelectCategory: (category: string) => void;
  activeTab: "feed" | "downloader" | "bookmarks" | "history";
  onTabChange: (tab: "feed" | "downloader" | "bookmarks" | "history") => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  activeFilter,
  activeCategory,
  onSelectFilter,
  onSelectCategory,
  activeTab,
  onTabChange,
}: SidebarProps) {
  const feeds = [
    { id: "latest", label: "Terbaru", icon: Clock, desc: "Feed real-time update" },
    { id: "popular", label: "Terpopuler", icon: Flame, desc: "Trending sekarang" },
    { id: "most-viewed", label: "Paling Banyak Ditonton", icon: Eye, desc: "Top views sepanjang masa" },
  ];

  const categories = [
    { id: "bokep-indo", label: "Bokep Indo", icon: Zap },
    { id: "bokep-jilbab", label: "Bokep Jilbab", icon: Sparkles },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-zinc-950/95 border-r border-zinc-800/80 transition-transform duration-300 ease-in-out p-4 flex flex-col justify-between overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="space-y-6">
          {/* Mobile Close Button */}
          <div className="flex items-center justify-between md:hidden border-b border-zinc-800 pb-3">
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase">
              Menu Navigasi
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Feeds Section */}
          <div className="space-y-1">
            <span className="px-2 text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
              Feed Video Utama
            </span>
            {feeds.map((f) => {
              const Icon = f.icon;
              const isActive =
                activeTab === "feed" && activeFilter === f.id && !activeCategory;
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    onSelectCategory("");
                    onSelectFilter(f.id);
                    onTabChange("feed");
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                    isActive
                      ? "bg-zinc-100 text-zinc-950 font-bold shadow"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <div className="flex flex-col text-left">
                    <span>{f.label}</span>
                    <span
                      className={`text-[10px] ${
                        isActive ? "text-zinc-700" : "text-zinc-500"
                      }`}
                    >
                      {f.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Categories Section */}
          <div className="space-y-1">
            <span className="px-2 text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
              Kategori Teratas
            </span>
            {categories.map((c) => {
              const Icon = c.icon;
              const isActive =
                activeTab === "feed" && activeCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    onSelectCategory(c.id);
                    onTabChange("feed");
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                    isActive
                      ? "bg-zinc-100 text-zinc-950 font-bold shadow"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tools & Library Section */}
          <div className="space-y-1">
            <span className="px-2 text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
              Fitur &amp; Download
            </span>

            <button
              onClick={() => {
                onTabChange("downloader");
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                activeTab === "downloader"
                  ? "bg-zinc-100 text-zinc-950 font-bold shadow"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>URL Downloader Tool</span>
            </button>

            <button
              onClick={() => {
                onTabChange("bookmarks");
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                activeTab === "bookmarks"
                  ? "bg-zinc-100 text-zinc-950 font-bold shadow"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Bookmark className="w-4 h-4 shrink-0" />
              <span>Video Tersimpan</span>
            </button>

            <button
              onClick={() => {
                onTabChange("history");
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                activeTab === "history"
                  ? "bg-zinc-100 text-zinc-950 font-bold shadow"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <History className="w-4 h-4 shrink-0" />
              <span>Riwayat Download</span>
            </button>
          </div>
        </div>

        {/* Bottom Fast Engine Status Card */}
        <div className="pt-4 border-t border-zinc-800/80">
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-[11px] font-mono space-y-1.5">
            <div className="flex items-center justify-between text-zinc-300">
              <span className="flex items-center gap-1.5 font-semibold text-xs text-white">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Fast Engine Active
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[10px] text-zinc-500">
              Zero Database • Instant Browser Cache • Multi-thread Downloader
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
