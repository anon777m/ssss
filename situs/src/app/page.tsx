"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import VideoCard from "@/components/VideoCard";
import VideoModal from "@/components/VideoModal";
import DownloaderTool from "@/components/DownloaderTool";
import BookmarksView from "@/components/BookmarksView";
import HistoryView from "@/components/HistoryView";
import QueueModal from "@/components/QueueModal";
import { DownloadProvider } from "@/context/DownloadContext";
import { VideoItem, VideoDetail } from "@/lib/scraper";
import {
  Flame,
  Clock,
  Eye,
  RefreshCw,
  Loader2,
  AlertCircle,
  Download,
  Sparkles,
  ChevronDown,
  Layers,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"feed" | "downloader" | "bookmarks" | "history">("feed");
  const [activeFilter, setActiveFilter] = useState<string>("latest");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [selectedVideoSlug, setSelectedVideoSlug] = useState<string | null>(null);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number>(-1);

  // Fetch video feed (page 1 or pagination)
  const fetchVideos = useCallback(
    async (
      targetPage = 1,
      isLoadMore = false,
      filter = activeFilter,
      category = activeCategory,
      query = searchQuery
    ) => {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      try {
        const params = new URLSearchParams();
        params.set("page", String(targetPage));

        if (query) {
          params.set("search", query);
        } else if (category) {
          params.set("category", category);
        } else if (filter) {
          params.set("filter", filter);
        }

        const res = await fetch(`/api/videos?${params.toString()}`);
        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || "Gagal mengambil data video.");
        }

        if (isLoadMore) {
          setVideos((prev) => {
            const seen = new Set(prev.map((v) => v.id));
            const newItems = (data.items || []).filter((item: VideoItem) => !seen.has(item.id));
            return [...prev, ...newItems];
          });
        } else {
          setVideos(data.items || []);
        }

        setPage(targetPage);
        setHasNextPage(data.hasNextPage ?? (data.items && data.items.length >= 15));
      } catch (err: any) {
        setError(err.message || "Terjadi kesalahan saat memuat video.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeFilter, activeCategory, searchQuery]
  );

  // Initial load & when filter/category changes
  useEffect(() => {
    if (activeTab === "feed") {
      fetchVideos(1, false, activeFilter, activeCategory, searchQuery);
    }
  }, [activeFilter, activeCategory, searchQuery, activeTab, fetchVideos]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setActiveCategory("");
    setActiveTab("feed");
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setActiveCategory("");
    setSearchQuery("");
    setActiveTab("feed");
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setSearchQuery("");
    setActiveTab("feed");
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasNextPage) {
      fetchVideos(page + 1, true);
    }
  };

  const handleSelectVideo = (video: VideoItem) => {
    const idx = videos.findIndex((v) => v.id === video.id);
    setSelectedVideoIndex(idx);
    setSelectedVideoSlug(video.url || video.slug || video.id);
  };

  const handleNavigateVideo = (slugOrUrl: string) => {
    const idx = videos.findIndex(
      (v) => v.url === slugOrUrl || v.slug === slugOrUrl || v.id === slugOrUrl
    );
    setSelectedVideoIndex(idx);
    setSelectedVideoSlug(slugOrUrl);
  };

  const getFeedTitle = () => {
    if (searchQuery) return `Hasil Pencarian: "${searchQuery}"`;
    if (activeCategory === "bokep-indo") return "Kategori: Bokep Indo";
    if (activeCategory === "bokep-jilbab") return "Kategori: Bokep Jilbab";
    if (activeFilter === "popular") return "Video Terpopuler (Trending)";
    if (activeFilter === "most-viewed") return "Paling Banyak Ditonton";
    return "Video Terbaru (Live Feed)";
  };

  return (
    <DownloadProvider>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased selection:bg-zinc-700 selection:text-white">
        {/* Top Navbar */}
        <Navbar
          onSearch={handleSearch}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />

        <div className="flex-1 flex">
          {/* Collapsible Sidebar */}
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            activeFilter={activeFilter}
            activeCategory={activeCategory}
            onSelectFilter={handleFilterChange}
            onSelectCategory={handleCategoryChange}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Main Content Area */}
          <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full transition-all">
            {activeTab === "downloader" ? (
              <DownloaderTool
                onPlayInTheater={(video) => {
                  setSelectedVideoSlug(video.url || video.slug || video.id);
                }}
              />
            ) : activeTab === "bookmarks" ? (
              <BookmarksView
                onSelectVideo={handleSelectVideo}
                onBackToFeed={() => setActiveTab("feed")}
              />
            ) : activeTab === "history" ? (
              <HistoryView onBackToFeed={() => setActiveTab("feed")} />
            ) : (
              /* Main Video Feed */
              <div className="space-y-6">
                {/* Category & Filter Pill Carousel */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
                  <button
                    onClick={() => handleFilterChange("latest")}
                    className={`px-3.5 py-1.5 rounded-full font-medium transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                      activeFilter === "latest" && !activeCategory && !searchQuery
                        ? "bg-zinc-100 text-zinc-950 border-white font-semibold"
                        : "bg-zinc-900/90 text-zinc-400 hover:text-white border-zinc-800"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Terbaru
                  </button>

                  <button
                    onClick={() => handleFilterChange("popular")}
                    className={`px-3.5 py-1.5 rounded-full font-medium transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                      activeFilter === "popular" && !activeCategory && !searchQuery
                        ? "bg-zinc-100 text-zinc-950 border-white font-semibold"
                        : "bg-zinc-900/90 text-zinc-400 hover:text-white border-zinc-800"
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    Terpopuler
                  </button>

                  <button
                    onClick={() => handleFilterChange("most-viewed")}
                    className={`px-3.5 py-1.5 rounded-full font-medium transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                      activeFilter === "most-viewed" && !activeCategory && !searchQuery
                        ? "bg-zinc-100 text-zinc-950 border-white font-semibold"
                        : "bg-zinc-900/90 text-zinc-400 hover:text-white border-zinc-800"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Paling Banyak Ditonton
                  </button>

                  <button
                    onClick={() => handleCategoryChange("bokep-indo")}
                    className={`px-3.5 py-1.5 rounded-full font-medium transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                      activeCategory === "bokep-indo"
                        ? "bg-zinc-100 text-zinc-950 border-white font-semibold"
                        : "bg-zinc-900/90 text-zinc-400 hover:text-white border-zinc-800"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Bokep Indo
                  </button>

                  <button
                    onClick={() => handleCategoryChange("bokep-jilbab")}
                    className={`px-3.5 py-1.5 rounded-full font-medium transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                      activeCategory === "bokep-jilbab"
                        ? "bg-zinc-100 text-zinc-950 border-white font-semibold"
                        : "bg-zinc-900/90 text-zinc-400 hover:text-white border-zinc-800"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Bokep Jilbab
                  </button>

                  <button
                    onClick={() => setActiveTab("downloader")}
                    className="px-3.5 py-1.5 rounded-full font-medium transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap border bg-zinc-900/90 text-zinc-300 hover:text-white border-zinc-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Downloader Tool
                  </button>
                </div>

                {/* Feed Header */}
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-3">
                    <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      {getFeedTitle()}
                    </h1>
                    <span className="text-xs font-mono text-zinc-500">
                      ({videos.length} video)
                    </span>
                  </div>

                  <button
                    onClick={() => fetchVideos(1, false)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
                    title="Segarkan data"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  </button>
                </div>

                {/* Video Grid */}
                {loading && videos.length === 0 ? (
                  <div className="py-24 flex flex-col items-center justify-center gap-3 text-center">
                    <Loader2 className="w-10 h-10 text-zinc-400 animate-spin" />
                    <p className="text-sm font-medium text-zinc-300">
                      Mengambil live feed dari AVTub...
                    </p>
                    <p className="text-xs text-zinc-500 font-mono">
                      Bypassing CDN &amp; parsing metadata
                    </p>
                  </div>
                ) : error && videos.length === 0 ? (
                  <div className="py-20 text-center space-y-4 bg-zinc-900/40 rounded-2xl border border-zinc-800 p-8">
                    <AlertCircle className="w-12 h-12 text-zinc-500 mx-auto" />
                    <div>
                      <h3 className="text-base font-semibold text-zinc-200">
                        Gagal Mengambil Data
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                        {error}
                      </p>
                    </div>
                    <button
                      onClick={() => fetchVideos(1, false)}
                      className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold rounded-lg transition cursor-pointer"
                    >
                      Coba Lagi
                    </button>
                  </div>
                ) : videos.length === 0 ? (
                  <div className="py-20 text-center space-y-3 bg-zinc-900/40 rounded-2xl border border-zinc-800 p-8">
                    <Eye className="w-12 h-12 text-zinc-600 mx-auto" />
                    <h3 className="text-sm font-semibold text-zinc-300">
                      Tidak Ada Video Ditemukan
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Coba ubah kata kunci pencarian atau pilih filter lainnya.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {videos.map((video) => (
                        <VideoCard
                          key={video.id}
                          video={video}
                          onSelect={handleSelectVideo}
                        />
                      ))}
                    </div>

                    {/* Unlimited Pagination */}
                    {hasNextPage && (
                      <div className="pt-8 pb-12 flex flex-col items-center justify-center gap-2">
                        <button
                          onClick={handleLoadMore}
                          disabled={loadingMore}
                          className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white text-xs font-semibold rounded-xl transition shadow flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {loadingMore ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Memuat Halaman {page + 1}...</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              <span>Muat Lebih Banyak Video (Halaman {page + 1})</span>
                            </>
                          )}
                        </button>
                        <span className="text-[11px] font-mono text-zinc-500">
                          Unlimited browsing tanpa batas
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </main>
        </div>

        {/* Video Modal / Theater Mode */}
        {selectedVideoSlug && (
          <VideoModal
            slugOrUrl={selectedVideoSlug}
            onClose={() => setSelectedVideoSlug(null)}
            onNavigateVideo={handleNavigateVideo}
            allVideosList={videos}
            currentIndex={selectedVideoIndex}
          />
        )}

        {/* Background Queue Modal */}
        <QueueModal />
      </div>
    </DownloadProvider>
  );
}
