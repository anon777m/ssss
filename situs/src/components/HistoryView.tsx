"use client";

import React, { useEffect, useState } from "react";
import { Download, ExternalLink, ArrowLeft, Loader2, Clock, Check } from "lucide-react";

interface HistoryViewProps {
  onBackToFeed: () => void;
}

export default function HistoryView({ onBackToFeed }: HistoryViewProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("avtub_download_history");
      if (stored) {
        setHistory(JSON.parse(stored));
      } else {
        setHistory([]);
      }
    } catch (e) {
      console.error(e);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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
              <Download className="w-5 h-5 text-zinc-300" />
              Riwayat Download
            </h2>
            <p className="text-xs text-zinc-400">
              Catatan aktivitas download dan playlist M3U8 yang pernah dibuat ({history.length} item)
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-xs font-mono">Memuat riwayat...</span>
        </div>
      ) : history.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-zinc-900/40 rounded-2xl border border-zinc-800/60 p-8">
          <Clock className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-300">Belum Ada Riwayat Download</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Gunakan tombol Download M3U8 atau Downloader Tool untuk mengunduh stream video.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/80 bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
          {history.map((item) => (
            <div
              key={item.id}
              className="p-4 hover:bg-zinc-900 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-100">{item.title}</p>
                <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                  {item.quality && (
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 border border-zinc-700">
                      {item.quality}
                    </span>
                  )}
                  <span>{new Date(item.createdAt).toLocaleString("id-ID")}</span>
                </div>
              </div>

              {item.streamUrl && (
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={item.streamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700 transition flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Buka Link
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
