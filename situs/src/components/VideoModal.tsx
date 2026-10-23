"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  Clock,
  Bookmark,
  BookmarkCheck,
  Share2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Play,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ListVideo,
  Sparkles,
} from "lucide-react";
import { VideoDetail, VideoItem } from "@/lib/scraper";
import HlsPlayer from "./HlsPlayer";
import M3u8DownloadDialog from "./M3u8DownloadDialog";

interface VideoModalProps {
  slugOrUrl: string;
  onClose: () => void;
  onNavigateVideo: (slugOrUrl: string) => void;
  allVideosList?: VideoItem[];
  currentIndex?: number;
}

export default function VideoModal({
  slugOrUrl,
  onClose,
  onNavigateVideo,
  allVideosList = [],
  currentIndex = -1,
}: VideoModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<VideoDetail | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);

  // M3u8dl Interactive Downloader Dialog State
  const [downloadDialogTarget, setDownloadDialogTarget] = useState<{
    streamUrl: string;
    qualityLabel: string;
  } | null>(null);

  // Load video detail
  const loadDetail = useCallback(async (target: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/video/detail?url=${encodeURIComponent(target)}`);
      const data = await res.json();
      if (!data.success || !data.video) {
        throw new Error(data.error || "Gagal memuat detail video.");
      }
      setVideoData(data.video);

      // Check bookmark status via fast localStorage
      try {
        const stored = localStorage.getItem("avtub_bookmarks");
        if (stored) {
          const list = JSON.parse(stored);
          const found = list.some(
            (b: any) => b.postId === data.video.id || b.id === data.video.id || b.url === data.video.url
          );
          setIsBookmarked(found);
        }
      } catch {
        // ignore
      }
    } catch (err: any) {
      setError(err.message || "Gagal mengambil data video.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (slugOrUrl) {
      loadDetail(slugOrUrl);
    }
  }, [slugOrUrl, loadDetail]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Keyboard navigation: Escape to close, Left/Right arrows for Prev/Next video
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // Previous and Next video handling
  const handlePrev = () => {
    if (currentIndex > 0 && allVideosList[currentIndex - 1]) {
      onNavigateVideo(allVideosList[currentIndex - 1].url || allVideosList[currentIndex - 1].slug);
    } else if (videoData?.relatedVideos && videoData.relatedVideos.length > 0) {
      const last = videoData.relatedVideos[videoData.relatedVideos.length - 1];
      onNavigateVideo(last.url || last.slug);
    }
  };

  const handleNext = () => {
    if (currentIndex >= 0 && currentIndex < allVideosList.length - 1 && allVideosList[currentIndex + 1]) {
      onNavigateVideo(allVideosList[currentIndex + 1].url || allVideosList[currentIndex + 1].slug);
    } else if (videoData?.relatedVideos && videoData.relatedVideos.length > 0) {
      const nextRel = videoData.relatedVideos[0];
      onNavigateVideo(nextRel.url || nextRel.slug);
    }
  };

  const toggleBookmark = () => {
    if (!videoData) return;
    try {
      const stored = localStorage.getItem("avtub_bookmarks");
      let list = stored ? JSON.parse(stored) : [];
      if (isBookmarked) {
        list = list.filter((b: any) => b.postId !== videoData.id && b.id !== videoData.id);
        setIsBookmarked(false);
      } else {
        list.unshift({
          id: videoData.id,
          postId: videoData.id,
          title: videoData.title,
          url: videoData.url,
          thumbnail: videoData.thumbnail,
          duration: videoData.duration,
          category: videoData.categories[0] || "Bokep Indo",
        });
        setIsBookmarked(true);
      }
      localStorage.setItem("avtub_bookmarks", JSON.stringify(list));
    } catch (e) {
      console.error("Bookmark toggle failed:", e);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden animate-in fade-in duration-100">
      {/* Top Header Bar */}
      <header className="h-14 px-3 sm:px-5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-3 shrink-0 z-20">
        {/* Left: Tombol Kembali Langsung */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition shadow cursor-pointer"
            title="Kembali ke Beranda (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </button>

          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 text-[11px] font-mono text-zinc-300 border border-zinc-700">
            {videoData?.id ? `ID #${videoData.id}` : "THEATER VIEW"}
          </span>
        </div>

        {/* Center: Title Preview */}
        <div className="flex-1 max-w-xl mx-2 text-center truncate">
          <span className="text-xs font-semibold text-zinc-300">
            {videoData?.title || "Memuat video..."}
          </span>
        </div>

        {/* Right: Prev, Next & Close */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={handlePrev}
            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-xl border border-zinc-700 transition flex items-center gap-1 cursor-pointer"
            title="Video Sebelumnya (Panah Kiri)"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>

          <button
            onClick={handleNext}
            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-xl border border-zinc-700 transition flex items-center gap-1 cursor-pointer"
            title="Video Selanjutnya (Panah Kanan)"
          >
            <span className="hidden sm:inline">Selanjutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition cursor-pointer ml-1"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Modern Two-Column Layout (YouTube Style: Kiri Video, Kanan Info & Download & Video Lainnya) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* KOLOM KIRI (70%): Video Player Fokus Tanpa Perlu Scroll */}
        <div className="flex-1 lg:w-[68%] bg-black flex flex-col justify-center items-center p-2 sm:p-4 relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="w-12 h-12 text-zinc-400 animate-spin" />
              <p className="text-sm font-semibold text-zinc-200">
                Mendekripsi Player Stream &amp; CDN...
              </p>
            </div>
          ) : error ? (
            <div className="text-center space-y-3 p-6 max-w-md bg-zinc-900 rounded-2xl border border-zinc-800">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
              <p className="text-sm font-semibold text-zinc-200">{error}</p>
              <button
                onClick={() => loadDetail(slugOrUrl)}
                className="px-4 py-1.5 bg-zinc-100 text-zinc-950 font-bold text-xs rounded-lg shadow"
              >
                Coba Lagi
              </button>
            </div>
          ) : videoData ? (
            <div className="w-full h-full max-h-[82vh] aspect-video rounded-2xl overflow-hidden shadow-2xl border border-zinc-800/80 bg-zinc-950">
              <HlsPlayer
                src={videoData.proxiedMasterM3u8 || videoData.masterM3u8 || ""}
                fallbackEmbedUrl={videoData.embedUrl}
                poster={videoData.thumbnail}
                title={videoData.title}
                streams={videoData.streams}
              />
            </div>
          ) : null}
        </div>

        {/* KOLOM KANAN (32%): Sidebar Vertikal Berisi Judul, Tombol Download, dan Rekomendasi Video */}
        <div className="lg:w-[32%] bg-zinc-950 border-l border-zinc-800/90 flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {videoData && (
              <>
                {/* 1. Judul Video & Actions (Simpan, Bagi Link) */}
                <div className="space-y-3 border-b border-zinc-800/80 pb-4">
                  <h1 className="text-base sm:text-lg font-bold text-white leading-snug">
                    {videoData.title}
                  </h1>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        {videoData.duration}
                      </span>
                      {videoData.categories[0] && (
                        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                          {videoData.categories[0]}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={toggleBookmark}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                          isBookmarked
                            ? "bg-zinc-100 text-zinc-950 border-white"
                            : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800"
                        }`}
                      >
                        {isBookmarked ? (
                          <BookmarkCheck className="w-3.5 h-3.5 text-zinc-950" />
                        ) : (
                          <Bookmark className="w-3.5 h-3.5" />
                        )}
                        <span>{isBookmarked ? "Tersimpan" : "Simpan"}</span>
                      </button>

                      <button
                        onClick={() => copyToClipboard(videoData.url, "share-url")}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-800 transition cursor-pointer"
                        title="Bagi Link"
                      >
                        {copiedKey === "share-url" ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Share2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Tombol Download Resolusi (Langsung Terlihat di Kanan) */}
                <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs pb-1.5 border-b border-zinc-800">
                    <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-zinc-400" />
                      Download Video (MP4)
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Multi-thread CLI
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {videoData.streams.length > 0 ? (
                      videoData.streams.map((stream, idx) => (
                        <button
                          key={idx}
                          onClick={() =>
                            setDownloadDialogTarget({
                              streamUrl: stream.url,
                              qualityLabel: stream.label,
                            })
                          }
                          className="px-2.5 py-2 bg-zinc-950 hover:bg-zinc-100 hover:text-zinc-950 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-800 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{stream.label}</span>
                        </button>
                      ))
                    ) : videoData.masterM3u8 ? (
                      <button
                        onClick={() =>
                          setDownloadDialogTarget({
                            streamUrl: videoData.masterM3u8!,
                            qualityLabel: "Master Quality",
                          })
                        }
                        className="col-span-2 px-3 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download MP4 (Master HD)</span>
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* 3. Daftar Video Rekomendasi / Video Lainnya di Bawahnya */}
                {videoData.relatedVideos && videoData.relatedVideos.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                      <ListVideo className="w-4 h-4" />
                      <span>Video Lainnya ({videoData.relatedVideos.length})</span>
                    </div>

                    <div className="space-y-2">
                      {videoData.relatedVideos.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => onNavigateVideo(item.url || item.slug)}
                          className="group p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer flex gap-3 items-center shadow-sm"
                        >
                          {/* Thumbnail Kecil */}
                          <div className="relative w-28 aspect-video bg-zinc-950 rounded-lg overflow-hidden shrink-0">
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                              loading="lazy"
                            />
                            <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/80 text-[9px] font-mono text-zinc-300 rounded">
                              {item.duration}
                            </span>
                          </div>

                          {/* Info Judul */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-zinc-200 line-clamp-2 group-hover:text-white leading-snug">
                              {item.title}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* M3U8 Multi-thread Download Dialog */}
      {downloadDialogTarget && videoData && (
        <M3u8DownloadDialog
          isOpen={true}
          onClose={() => setDownloadDialogTarget(null)}
          videoTitle={videoData.title}
          streamUrl={downloadDialogTarget.streamUrl}
          qualityLabel={downloadDialogTarget.qualityLabel}
          referer={videoData.embedUrl || "https://www.avtub.net/"}
        />
      )}
    </div>
  );
}
