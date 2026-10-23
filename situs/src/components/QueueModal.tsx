"use client";

import React, { useRef, useEffect } from "react";
import { useDownloads, ActiveDownloadTask } from "@/context/DownloadContext";
import {
  Download,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Square,
  Terminal,
  Folder,
  FileVideo,
  ExternalLink,
  ChevronRight,
  HardDrive,
  Maximize2,
  Trash2,
} from "lucide-react";

export default function QueueModal() {
  const {
    tasks,
    activeTaskCount,
    isQueueModalOpen,
    setIsQueueModalOpen,
    cancelTask,
    selectedTaskForLog,
    setSelectedTaskForLog,
  } = useDownloads();

  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedTaskForLog && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTaskForLog?.logs]);

  if (!isQueueModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white shadow-inner flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white leading-tight">
                  Download Manager &amp; Background Queue
                </h3>
                {activeTaskCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold animate-pulse">
                    {activeTaskCount} Berjalan di Background
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                Multi-thread m3u8dl background worker ({tasks.length} total task)
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsQueueModalOpen(false);
              setSelectedTaskForLog(null);
            }}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Grid: Task List & Realtime Terminal */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Tasks List */}
          <div className={`${selectedTaskForLog ? "lg:col-span-6" : "lg:col-span-12"} space-y-3`}>
            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono pb-1 border-b border-zinc-800/80">
              <span>Daftar Antrian Download ({tasks.length})</span>
              <span className="text-[10px] text-zinc-500">Klik task untuk lihat log live</span>
            </div>

            {tasks.length === 0 ? (
              <div className="py-16 text-center space-y-3 bg-zinc-900/40 rounded-xl border border-zinc-800 p-6">
                <Download className="w-10 h-10 text-zinc-600 mx-auto" />
                <h4 className="text-xs font-semibold text-zinc-300">Belum Ada Task Download</h4>
                <p className="text-[11px] text-zinc-500">
                  Pilih video dan klik tombol Download pada resolusi yang kamu mau.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[58vh] overflow-y-auto pr-1">
                {tasks.map((task) => {
                  const isSelected = selectedTaskForLog?.id === task.id;
                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskForLog(task)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex flex-col gap-2.5 ${
                        isSelected
                          ? "bg-zinc-900 border-zinc-500 shadow-md"
                          : "bg-zinc-900/70 hover:bg-zinc-900 border-zinc-800"
                      }`}
                    >
                      {/* Title & Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-zinc-100 truncate leading-snug">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 mt-1">
                            <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                              {task.quality || "Master"}
                            </span>
                            <span className="truncate max-w-[140px] text-zinc-500" title={task.saveDir}>
                              📁 {task.saveDir.replace("/mnt/c/Users/Asus/", "C:\\...\\")}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {task.status === "running" ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800 text-[10px] font-mono font-bold">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              {task.progressPercent.toFixed(0)}%
                            </span>
                          ) : task.status === "completed" ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              100%
                            </span>
                          ) : task.status === "error" ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800 text-[10px] font-mono font-bold">
                              <AlertCircle className="w-3 h-3" />
                              Gagal
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-mono">
                              Batal
                            </span>
                          )}

                          {task.status === "running" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelTask(task.id);
                              }}
                              className="p-1 rounded bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-300 transition"
                              title="Hentikan download"
                            >
                              <Square className="w-3 h-3 fill-current" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-800/80">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            task.status === "completed"
                              ? "bg-emerald-500"
                              : task.status === "error"
                              ? "bg-red-500"
                              : task.status === "cancelled"
                              ? "bg-amber-500"
                              : "bg-zinc-200"
                          }`}
                          style={{ width: `${Math.max(2, task.progressPercent)}%` }}
                        />
                      </div>

                      {/* Speed & Segments */}
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                        <span>Speed: <strong className="text-zinc-200">{task.speed}</strong></span>
                        <span>Seg: <strong className="text-zinc-200">{task.downloadedSegments}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Real-time Live Log Viewer for Selected Task */}
          {selectedTaskForLog && (
            <div className="lg:col-span-6 flex flex-col space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-mono pb-1 border-b border-zinc-800/80">
                <span className="flex items-center gap-1.5 text-zinc-200 font-semibold truncate max-w-[280px]">
                  <Terminal className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  Live Log: {selectedTaskForLog.filename}.mp4
                </span>
                <button
                  onClick={() => setSelectedTaskForLog(null)}
                  className="text-[10px] text-zinc-500 hover:text-white"
                >
                  Tutup Log
                </button>
              </div>

              {/* Terminal Box */}
              <div className="flex-1 min-h-[300px] max-h-[55vh] rounded-xl bg-black/90 border border-zinc-800 p-3 font-mono text-[11px] leading-relaxed overflow-y-auto space-y-1 select-text shadow-inner">
                {selectedTaskForLog.logs.map((line, i) => (
                  <div
                    key={i}
                    className={`break-all ${
                      line.includes("[ERROR]") || line.includes("[FATAL]")
                        ? "text-red-400"
                        : line.includes("[SUCCESS]")
                        ? "text-emerald-400 font-bold"
                        : line.includes("[INIT]") || line.includes("[EXEC]")
                        ? "text-zinc-400"
                        : "text-zinc-300"
                    }`}
                  >
                    {line}
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>

              {/* Output Path Box */}
              {selectedTaskForLog.outputFilePath && (
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300 flex items-start gap-2 break-all">
                  <FileVideo className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Lokasi File:</span>
                    <span>{selectedTaskForLog.outputFilePath}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/90 flex items-center justify-between text-xs text-zinc-400 font-mono shrink-0">
          <span>Semua proses berjalan di background terminal WSL.</span>
          <button
            onClick={() => setIsQueueModalOpen(false)}
            className="px-4 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold rounded-lg transition"
          >
            Selesai / Minimize
          </button>
        </div>
      </div>
    </div>
  );
}
