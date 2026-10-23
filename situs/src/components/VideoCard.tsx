"use client";

import React, { useState } from "react";
import { Play, Download, Bookmark, BookmarkCheck, Clock, Layers } from "lucide-react";
import { VideoItem } from "@/lib/scraper";

interface VideoCardProps {
  video: VideoItem;
  onSelect: (video: VideoItem) => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (video: VideoItem) => void;
}

export default function VideoCard({
  video,
  onSelect,
  isBookmarked = false,
  onToggleBookmark,
}: VideoCardProps) {
  const [bookmarked, setBookmarked] = useState(isBookmarked);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !bookmarked;
    setBookmarked(next);
    if (onToggleBookmark) {
      onToggleBookmark(video);
    }
  };

  return (
    <div
      onClick={() => onSelect(video)}
      className="group relative bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800/90 hover:border-zinc-600/90 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 flex flex-col shadow-sm hover:shadow-xl"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden">
        <img
          src={video.thumbnail || "https://imgswipe.com/wp-content/uploads/ads/placeholder.webp"}
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
        />

        {/* Hover dark vignette overlay & Play Icon */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="p-3 bg-white text-zinc-950 rounded-full shadow-xl transform scale-90 group-hover:scale-100 transition duration-200">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
          {video.isHD && (
            <span className="px-1.5 py-0.5 rounded bg-zinc-900/90 border border-zinc-700 text-[10px] font-mono text-zinc-200 font-semibold backdrop-blur">
              HD
            </span>
          )}
        </div>

        {/* Top Right Bookmark Button */}
        <button
          onClick={handleBookmarkClick}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 backdrop-blur opacity-0 group-hover:opacity-100 transition cursor-pointer z-10"
          title={bookmarked ? "Hapus dari tersimpan" : "Simpan video"}
        >
          {bookmarked ? (
            <BookmarkCheck className="w-3.5 h-3.5 text-zinc-100" />
          ) : (
            <Bookmark className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Bottom Badges */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-10">
          <span className="px-1.5 py-0.5 rounded bg-black/85 text-[11px] font-mono text-zinc-200 font-medium backdrop-blur">
            {video.duration}
          </span>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3 flex-1 flex flex-col justify-between gap-2">
        <h3 className="text-xs sm:text-sm font-semibold text-zinc-200 group-hover:text-white line-clamp-2 leading-snug transition-colors">
          {video.title}
        </h3>

        <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-500 font-mono border-t border-zinc-800/60">
          <span className="truncate max-w-[150px]">
            {video.category || "AVTub Video"}
          </span>
          <span className="hover:text-zinc-300 transition flex items-center gap-1">
            <Play className="w-3 h-3" />
            Nonton
          </span>
        </div>
      </div>
    </div>
  );
}
