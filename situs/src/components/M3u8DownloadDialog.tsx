"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronUp,
  Download,
  Loader2,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
  Square,
  Terminal,
  FileVideo,
  ExternalLink,
  RefreshCw,
  Sliders,
  Settings2,
} from "lucide-react";

export interface M3u8DownloadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle: string;
  streamUrl: string;
  qualityLabel?: string;
  referer?: string;
}

export default function M3u8DownloadDialog({
  isOpen,
  onClose,
  videoTitle,
  streamUrl,
  qualityLabel = "HD Quality",
  referer,
}: M3u8DownloadDialogProps) {
  // Config state
  const [saveDir, setSaveDir] = useState<string>("/mnt/c/Users/Asus/Downloads");
  const [customFilename, setCustomFilename] = useState<string>("");
  const [threads, setThreads] = useState<number>(16);
  const [defaultPresets, setDefaultPresets] = useState<{ label: string; path: string; isWindows?: boolean }[]>([]);

  // Folder browser modal / dropdown
  const [isBrowsing, setIsBrowsing] = useState<boolean>(false);
  const [browseDir, setBrowseDir] = useState<string>("/mnt/c/Users/Asus/Downloads");
  const [browseParent, setBrowseParent] = useState<string | null>(null);
  const [browseFolders, setBrowseFolders] = useState<{ name: string; path: string }[]>([]);
  const [loadingBrowse, setLoadingBrowse] = useState<boolean>(false);

  // Active Task State
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<"idle" | "running" | "completed" | "error" | "cancelled">("idle");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [speed, setSpeed] = useState<string>("0 KB/s");
  const [downloadedSegments, setDownloadedSegments] = useState<string>("0/0");
  const [logs, setLogs] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [outputFilePath, setOutputFilePath] = useState<string | null>(null);

  const logEndRef = useRef<HTMLDivElement>(null);

  // Load default directories & initialize
  useEffect(() => {
    if (isOpen) {
      // Set default clean filename
      const cleanName = videoTitle
        .replace(/[/\\?%*:|"<>]/g, "-")
        .replace(/\s+/g, " ")
        .trim();
      setCustomFilename(`${cleanName}-${qualityLabel}`);

      // Fetch default dirs
      fetch("/api/m3u8dl/start")
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.defaultDirs && data.defaultDirs.length > 0) {
            setDefaultPresets(data.defaultDirs);
            setSaveDir(data.defaultDirs[0].path);
            setBrowseDir(data.defaultDirs[0].path);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, videoTitle, qualityLabel]);

  // Browse Directory Loader
  const loadDirectory = async (dirToLoad: string) => {
    setLoadingBrowse(true);
    try {
      const res = await fetch(`/api/m3u8dl/browse?dir=${encodeURIComponent(dirToLoad)}`);
      const data = await res.json();
      if (data.success) {
        setBrowseDir(data.current);
        setBrowseParent(data.parent);
        setBrowseFolders(data.folders || []);
      }
    } catch (err) {
      console.error("Browse error:", err);
    } finally {
      setLoadingBrowse(false);
    }
  };

  // Real-time polling for log & progress
  useEffect(() => {
    if (!taskId || taskStatus === "completed" || taskStatus === "error" || taskStatus === "cancelled") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/m3u8dl/progress?taskId=${encodeURIComponent(taskId)}`);
        const data = await res.json();
        if (data.success && data.task) {
          const t = data.task;
          setTaskStatus(t.status);
          setProgressPercent(t.progressPercent || 0);
          setSpeed(t.speed || "0 KB/s");
          setDownloadedSegments(t.downloadedSegments || "0/0");
          setLogs(t.logs || []);
          if (t.outputFilePath) setOutputFilePath(t.outputFilePath);
          if (t.error) setErrorMsg(t.error);

          // Auto scroll log to bottom
          if (logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: "smooth" });
          }
        }
      } catch (err) {
        console.error("Progress poll error:", err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [taskId, taskStatus]);

  // Start Download
  const handleStartDownload = async () => {
    setErrorMsg(null);
    setTaskStatus("running");
    setProgressPercent(0);
    setLogs(["[WEB] Mengirim request ke background downloader..."]);

    try {
      const res = await fetch("/api/m3u8dl/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: streamUrl,
          title: videoTitle,
          quality: qualityLabel,
          saveDir: saveDir,
          customFilename: customFilename,
          threads: threads,
          referer: referer || "https://www.avtub.net/",
        }),
      });

      const data = await res.json();
      if (!data.success || !data.task) {
        throw new Error(data.error || "Gagal memulai proses download m3u8dl");
      }

      setTaskId(data.task.id);
      setOutputFilePath(data.task.outputFilePath);
    } catch (err: any) {
      setTaskStatus("error");
      setErrorMsg(err.message || "Gagal menghubungi backend");
    }
  };

  // Cancel Download
  const handleCancelDownload = async () => {
    if (!taskId) return;
    try {
      await fetch(`/api/m3u8dl/progress?taskId=${encodeURIComponent(taskId)}`, {
        method: "DELETE",
      });
      setTaskStatus("cancelled");
    } catch (err) {
      console.error("Cancel failed:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white shadow-inner">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                M3U8 Multi-Thread Downloader
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                Engine: <span className="text-zinc-200">m3u8dl CLI</span> (Multi-thread + Direct MP4 Merger)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Target Video Info Pill */}
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block mb-0.5">
                Target Video ({qualityLabel})
              </span>
              <p className="text-xs font-semibold text-zinc-100 truncate">
                {videoTitle}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-200 font-mono text-[11px] font-bold border border-zinc-700 shrink-0">
              {qualityLabel}
            </span>
          </div>

          {/* Form Settings (Hide when running/completed to focus on logs) */}
          {taskStatus === "idle" && (
            <div className="space-y-4">
              {/* Folder Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Folder className="w-4 h-4 text-zinc-400" />
                    Pilih Lokasi Folder Download (WSL / Windows):
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsBrowsing(!isBrowsing);
                      if (!isBrowsing) loadDirectory(saveDir);
                    }}
                    className="text-[11px] text-zinc-400 hover:text-white underline flex items-center gap-1 cursor-pointer font-mono"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    {isBrowsing ? "Tutup Browser" : "Jelajahi Folder..."}
                  </button>
                </label>

                {/* Preset Chips */}
                {defaultPresets.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {defaultPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSaveDir(preset.path);
                          setBrowseDir(preset.path);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition flex items-center gap-1.5 cursor-pointer ${
                          saveDir === preset.path
                            ? "bg-zinc-100 text-zinc-950 font-bold border-white"
                            : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-zinc-800"
                        }`}
                      >
                        <HardDrive className="w-3 h-3" />
                        {preset.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Path Input Box */}
                <input
                  type="text"
                  value={saveDir}
                  onChange={(e) => setSaveDir(e.target.value)}
                  placeholder="/mnt/c/Users/Asus/Downloads"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-400 transition"
                />

                {/* Interactive Folder Browser Explorer */}
                {isBrowsing && (
                  <div className="mt-2.5 p-3 rounded-xl bg-zinc-900/90 border border-zinc-700 space-y-2">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800">
                      <span className="font-mono text-[11px] text-zinc-400 truncate max-w-[400px]">
                        📂 {browseDir}
                      </span>
                      {browseParent && (
                        <button
                          type="button"
                          onClick={() => loadDirectory(browseParent)}
                          className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] flex items-center gap-1 cursor-pointer font-mono"
                        >
                          <ChevronUp className="w-3 h-3" />
                          Naik Satu Folder
                        </button>
                      )}
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-1 text-xs pr-1">
                      {loadingBrowse ? (
                        <div className="py-6 flex items-center justify-center gap-2 text-zinc-400 text-xs">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Memuat folder...
                        </div>
                      ) : browseFolders.length === 0 ? (
                        <p className="text-zinc-500 text-[11px] py-2 text-center">
                          Tidak ada sub-folder.
                        </p>
                      ) : (
                        browseFolders.map((f, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 transition cursor-pointer group text-zinc-300"
                            onClick={() => loadDirectory(f.path)}
                          >
                            <span className="flex items-center gap-2 font-mono text-[11px] truncate">
                              <Folder className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
                              {f.name}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSaveDir(f.path);
                                setIsBrowsing(false);
                              }}
                              className="opacity-0 group-hover:opacity-100 px-2 py-0.5 bg-zinc-100 text-zinc-950 rounded text-[10px] font-bold"
                            >
                              Pilih Folder Ini
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="pt-2 border-t border-zinc-800 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSaveDir(browseDir);
                          setIsBrowsing(false);
                        }}
                        className="px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold rounded-lg shadow"
                      >
                        Gunakan Folder Aktif Ini
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Filename & Thread Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Nama File Output (.mp4):
                  </label>
                  <input
                    type="text"
                    value={customFilename}
                    onChange={(e) => setCustomFilename(e.target.value)}
                    placeholder="nama-video"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-zinc-400 font-mono transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                    <span>Threads (Koneksi):</span>
                    <span className="font-mono text-zinc-400">{threads}</span>
                  </label>
                  <select
                    value={threads}
                    onChange={(e) => setThreads(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-zinc-200 focus:outline-none font-mono"
                  >
                    <option value={8}>8 Threads</option>
                    <option value={16}>16 Threads (Cepat)</option>
                    <option value={24}>24 Threads (Turbo)</option>
                    <option value={32}>32 Threads (Maksimal)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Real-time Progress & Status Bar */}
          {taskStatus !== "idle" && (
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {taskStatus === "running" && <Loader2 className="w-4 h-4 text-zinc-300 animate-spin" />}
                  {taskStatus === "completed" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {taskStatus === "error" && <AlertCircle className="w-4 h-4 text-red-400" />}
                  {taskStatus === "cancelled" && <X className="w-4 h-4 text-amber-400" />}

                  <span className="font-semibold text-white capitalize">
                    {taskStatus === "running" && "Sedang Mendownload Segments..."}
                    {taskStatus === "completed" && "Download Berhasil & Selesai!"}
                    {taskStatus === "error" && "Download Mengalami Kesalahan"}
                    {taskStatus === "cancelled" && "Download Dibatalkan"}
                  </span>
                </div>

                <span className="font-mono font-bold text-sm text-zinc-100">
                  {progressPercent.toFixed(1)}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-800">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    taskStatus === "completed"
                      ? "bg-emerald-500"
                      : taskStatus === "error"
                      ? "bg-red-500"
                      : taskStatus === "cancelled"
                      ? "bg-amber-500"
                      : "bg-zinc-200"
                  }`}
                  style={{ width: `${Math.max(3, progressPercent)}%` }}
                />
              </div>

              {/* Stats pill: Segments, Speed, File Output */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
                <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                  <span className="text-zinc-500 block">Kecepatan:</span>
                  <span className="text-zinc-200 font-bold">{speed}</span>
                </div>
                <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80">
                  <span className="text-zinc-500 block">Segments:</span>
                  <span className="text-zinc-200 font-bold">{downloadedSegments}</span>
                </div>
                <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80 col-span-2 sm:col-span-1">
                  <span className="text-zinc-500 block">Status CLI:</span>
                  <span className="text-zinc-200 font-bold uppercase">{taskStatus}</span>
                </div>
              </div>

              {outputFilePath && taskStatus === "completed" && (
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 font-mono break-all flex items-start gap-2">
                  <FileVideo className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <div>
                    <span className="font-bold block">File Tersimpan di:</span>
                    <span>{outputFilePath}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* REALTIME LOG TERMINAL VIEWER */}
          <div className="rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-inner">
            <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-900 border-b border-zinc-800 text-[11px] font-mono text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                Live m3u8dl Execution Logs
              </span>
              <span className="text-[10px] text-zinc-500">
                {logs.length} baris log
              </span>
            </div>

            <div className="p-3 font-mono text-[11px] leading-relaxed text-zinc-300 max-h-52 overflow-y-auto space-y-1 select-text bg-black/40">
              {logs.length === 0 ? (
                <p className="text-zinc-600 italic">
                  Siap mendownload. Klik tombol &quot;Mulai Download&quot; di bawah untuk menjalankan m3u8dl.
                </p>
              ) : (
                logs.map((log, i) => (
                  <div
                    key={i}
                    className={`break-all ${
                      log.includes("[ERROR]") || log.includes("[FATAL]")
                        ? "text-red-400"
                        : log.includes("[SUCCESS]")
                        ? "text-emerald-400 font-bold"
                        : log.includes("[INIT]") || log.includes("[EXEC]")
                        ? "text-zinc-400"
                        : "text-zinc-200"
                    }`}
                  >
                    {log}
                  </div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-zinc-800 bg-zinc-900/90 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-700 transition cursor-pointer"
          >
            {taskStatus === "completed" ? "Tutup" : "Batal"}
          </button>

          {taskStatus === "idle" ? (
            <button
              onClick={handleStartDownload}
              className="px-5 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Mulai Download ke Folder Ini
            </button>
          ) : taskStatus === "running" ? (
            <button
              onClick={handleCancelDownload}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              Hentikan Download
            </button>
          ) : (
            <button
              onClick={() => {
                setTaskStatus("idle");
                setTaskId(null);
              }}
              className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Download Ulang / Video Lain
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
