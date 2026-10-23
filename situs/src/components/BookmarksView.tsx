"use client";

import React, { useEffect, useState } from "react";
import { Bookmark, Trash2, Play, ExternalLink, Loader2, ArrowLeft } from "lucide-react";
import { VideoItem } from "@/lib/scraper";

interface BookmarksViewProps {
  onSelectVideo: (item: VideoItem) => void;
  onBackToFeed: () => void;
}

export default function BookmarksView({ onSelectVideo, onBackToFeed }: BookmarksViewProps) {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = () => {
    try {
      const stored = localStorage.getItem("avtub_bookmarks");
      if (stored) {
        setBookmarks(JSON.parse(stored));
      } else {
        setBookmarks([]);
      }
    } catch (e) {
      console.error(e);
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const deleteBookmark = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = bookmarks.filter((b) => b.postId !== postId && b.id !== postId);
      setBookmarks(updated);
      localStorage.setItem("avtub_bookmarks", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToFeed}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-800 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-zinc-300" />
              Video Tersimpan
            </h2>
            <p className="text-xs text-zinc-400">
              Daftar video yang Anda simpan di database lokal ({bookmarks.length} video)
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-xs font-mono">Memuat bookmark...</span>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-zinc-900/40 rounded-2xl border border-zinc-800/60 p-8">
          <Bookmark className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-300">Belum Ada Video Tersimpan</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Klik ikon Simpan pada kartu video atau halaman pemutar untuk menyimpan video favorit ke sini.
          </p>
          <button
            onClick={onBackToFeed}
            className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold rounded-lg transition mt-2 cursor-pointer"
          >
            Jelajahi Video Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {bookmarks.map((item) => (
            <div
              key={item.id}
              onClick={() =>
                onSelectVideo({
                  id: item.postId,
                  title: item.title,
                  url: item.url,
                  slug: item.postId,
                  thumbnail: item.thumbnail || "",
                  duration: item.duration || "00:00",
                  isHD: true,
                  category: item.category,
                })
              }
              className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl overflow-hidden cursor-pointer transition flex flex-col shadow-sm"
            >
              <div className="relative aspect-video bg-zinc-950 overflow-hidden">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-[10px] font-mono text-zinc-300 rounded">
                  {item.duration}
                </span>

                <button
                  onClick={(e) => deleteBookmark(item.postId, e)}
                  className="absolute top-2 right-2 p-1.5 bg-zinc-900/80 hover:bg-red-950 text-zinc-400 hover:text-red-300 rounded border border-zinc-700 transition"
                  title="Hapus bookmark"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white line-clamp-2 leading-snug">
                  {item.title}
                </h4>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                  <span>ID: {item.postId}</span>
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Play className="w-3 h-3" /> Putar
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
