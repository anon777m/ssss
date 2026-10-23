"use client";

import React, { useState } from "react";
import {
  Download,
  Link as LinkIcon,
  Search,
  Check,
  Copy,
  Terminal,
  ExternalLink,
  Clock,
  Calendar,
  Layers,
  Sparkles,
  Loader2,
  AlertTriangle,
  Play,
  FileCode,
  ShieldCheck,
} from "lucide-react";
import { VideoDetail } from "@/lib/scraper";
import HlsPlayer from "./HlsPlayer";
import M3u8DownloadDialog from "./M3u8DownloadDialog";

interface DownloaderToolProps {
  onPlayInTheater?: (video: VideoDetail) => void;
}

const SAMPLE_URLS = [
  {
    title: "Cewek Kacamata Tobrut Sange Parah",
    url: "https://www.avtub.net/201455/cewek-kacamata-tobrut-sange-parah-sini-puasin-dong/",
  },
  {
    title: "Miss Rikako & Minami Orgasme",
    url: "https://www.avtub.net/218962/rikako-katayama-minami-orgasme-threesome-om-brutal/",
  },
  {
    title: "Yumi Whispers Cici Rambut Merah",
    url: "https://www.avtub.net/218960/yumi-whispers-cici-rambut-merah-cobain-mainan-baru/",
  },
];

export default function DownloaderTool({ onPlayInTheater }: DownloaderToolProps) {
  const [inputUrl, setInputUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<VideoDetail | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeStreamUrl, setActiveStreamUrl] = useState<string | null>(null);

  // M3u8dl Interactive Downloader Dialog State
  const [downloadDialogTarget, setDownloadDialogTarget] = useState<{
    streamUrl: string;
    qualityLabel: string;
  } | null>(null);

  const handleExtract = async (urlToFetch?: string) => {
    const target = urlToFetch || inputUrl;
    if (!target.trim()) {
      setError("Masukkan URL video AVTub terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError(null);
    setExtractedData(null);

    try {
      const res = await fetch(`/api/video/detail?url=${encodeURIComponent(target.trim())}`);
      const data = await res.json();

      if (!data.success || !data.video) {
        throw new Error(data.error || "Gagal mengekstrak metadata video");
      }

      setExtractedData(data.video);
      if (data.video.proxiedMasterM3u8) {
        setActiveStreamUrl(data.video.proxiedMasterM3u8);
      } else if (data.video.masterM3u8) {
        setActiveStreamUrl(data.video.masterM3u8);
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memproses link.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Download className="w-48 h-48 text-zinc-100" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-300 text-xs font-mono mb-3">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            <span>REAL LIVE STREAM &amp; METADATA EXTRACTOR</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
            AVTub Video Downloader
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed mb-6">
            Bypass proteksi JavaScript, decode VidHide Packer, dan decrypt AES-256-GCM YStream secara live. Dapatkan file stream M3U8, pilihan resolusi 1080p/720p/480p, dan metadata lengkap tanpa iklan berbahaya.
          </p>

          {/* Search Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExtract();
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Tempel URL AVTub (contoh: https://www.avtub.net/201455/...)"
                className="w-full pl-10 pr-4 py-3 bg-zinc-950/80 border border-zinc-700 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 text-sm transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengekstrak...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Ekstrak Video
                </>
              )}
            </button>
          </form>

          {/* Sample preset links */}
          <div className="mt-4 flex items-center flex-wrap gap-2 text-xs text-zinc-400">
            <span className="text-zinc-500">Coba contoh:</span>
            {SAMPLE_URLS.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputUrl(sample.url);
                  handleExtract(sample.url);
                }}
                className="px-2.5 py-1 rounded-md bg-zinc-800/70 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 transition truncate max-w-[200px]"
                title={sample.title}
              >
                {sample.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Gagal Memproses URL</p>
            <p className="text-xs text-red-300/90">{error}</p>
          </div>
        </div>
      )}

      {/* Extraction Result Section */}
      {extractedData && (
        <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Left: Thumbnail Preview & Quick Play */}
            <div className="w-full md:w-80 shrink-0 space-y-3">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 group">
                <img
                  src={extractedData.thumbnail}
                  alt={extractedData.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <button
                    onClick={() => {
                      if (onPlayInTheater) onPlayInTheater(extractedData);
                    }}
                    className="p-3 bg-zinc-100/95 hover:bg-white text-zinc-950 rounded-full shadow-lg transition transform hover:scale-105"
                  >
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  </button>
                </div>

                <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-[11px] font-mono text-zinc-300 rounded border border-zinc-700">
                  {extractedData.duration}
                </span>
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-zinc-900/90 text-[10px] font-mono text-zinc-300 rounded border border-zinc-700">
                  ID: {extractedData.id}
                </span>
              </div>

              {/* Provider info */}
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>CDN Provider:</span>
                  <span className="text-zinc-200 font-semibold">{extractedData.playerProvider}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Stream Status:</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Decrypted
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Resolusi Tersedia:</span>
                  <span className="text-zinc-300">
                    {extractedData.streams.length > 0
                      ? extractedData.streams.map((s) => s.label).join(", ")
                      : "Master Stream (Adaptive)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Metadata Details */}
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white leading-snug mb-2">
                  {extractedData.title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                  {extractedData.publishDate && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      {new Date(extractedData.publishDate).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    Durasi: {extractedData.duration}
                  </span>
                  {extractedData.categories.length > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-zinc-500" />
                      {extractedData.categories.join(", ")}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {extractedData.description && (
                <p className="text-xs text-zinc-400 bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80 leading-relaxed line-clamp-3">
                  {extractedData.description}
                </p>
              )}

              {/* Tags */}
              {extractedData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {extractedData.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-zinc-800 text-[11px] text-zinc-400 border border-zinc-700/50"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Buttons: Play in Theater & Direct Links */}
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => {
                    if (onPlayInTheater) onPlayInTheater(extractedData);
                  }}
                  className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold rounded-lg transition flex items-center gap-2 cursor-pointer shadow"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Putar di Web Player
                </button>

                {extractedData.originalDownloadUrl && (
                  <a
                    href={extractedData.originalDownloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700 transition flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Savetub Link
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Live In-Component Player Preview */}
          {activeStreamUrl && (
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-mono flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-zinc-400" />
                  Pratinjau Live Streaming:
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  Engine: Hls.js v1.5 + CORS Proxy
                </span>
              </div>
              <HlsPlayer
                src={activeStreamUrl}
                fallbackEmbedUrl={extractedData.embedUrl}
                poster={extractedData.thumbnail}
                title={extractedData.title}
                streams={extractedData.streams}
              />
            </div>
          )}

          {/* Download & Stream Resolvers Box */}
          <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-zinc-400" />
                Pilihan Download &amp; Link Asli
              </h4>
              <span className="text-[11px] text-zinc-400 font-mono">
                Bypass Live CDN Active
              </span>
            </div>

            {/* Quality Stream Buttons */}
            {extractedData.streams.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {extractedData.streams.map((stream, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        {stream.label}
                      </span>
                      {stream.resolution && (
                        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                          {stream.resolution}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() =>
                          setDownloadDialogTarget({
                            streamUrl: stream.url,
                            qualityLabel: stream.label,
                          })
                        }
                        className="flex-1 px-2.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-[11px] font-semibold rounded text-center transition flex items-center justify-center gap-1 cursor-pointer shadow"
                      >
                        <Download className="w-3 h-3" />
                        Download ({stream.label})
                      </button>
                      <button
                        onClick={() => copyToClipboard(stream.url, `stream-${idx}`)}
                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition cursor-pointer"
                        title="Salin Link Stream"
                      >
                        {copiedKey === `stream-${idx}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : extractedData.masterM3u8 ? (
              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Master HLS Stream (Adaptive 1080p/720p/480p)
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Format HLS Playlist asli dengan multi-resolusi
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setDownloadDialogTarget({
                        streamUrl: extractedData.masterM3u8!,
                        qualityLabel: "Master Quality",
                      })
                    }
                    className="px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold rounded transition flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download MP4
                  </button>
                  <button
                    onClick={() =>
                      copyToClipboard(extractedData.masterM3u8!, "master-url")
                    }
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition cursor-pointer"
                    title="Salin Link M3U8"
                  >
                    {copiedKey === "master-url" ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Quick Tools: Copy M3U8 & Copy FFMPEG Command */}
            {extractedData.masterM3u8 && (
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                    Download Cepat via FFMPEG / IDM / VLC:
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `ffmpeg -i "${extractedData.masterM3u8}" -c copy "${extractedData.title.replace(/[/\\?%*:|"<>]/g, "-")}.mp4"`,
                        "ffmpeg"
                      )
                    }
                    className="text-zinc-300 hover:text-white flex items-center gap-1 text-[11px] font-mono hover:underline cursor-pointer"
                  >
                    {copiedKey === "ffmpeg" ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        Tersalin!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Salin Perintah FFMPEG
                      </>
                    )}
                  </button>
                </div>

                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300 break-all select-all flex items-center justify-between gap-2">
                  <span className="truncate">
                    ffmpeg -i &quot;{extractedData.masterM3u8}&quot; -c copy &quot;{extractedData.title}.mp4&quot;
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `ffmpeg -i "${extractedData.masterM3u8}" -c copy "${extractedData.title}.mp4"`,
                        "ffmpeg"
                      )
                    }
                    className="p-1 hover:text-white shrink-0 cursor-pointer"
                  >
                    {copiedKey === "ffmpeg" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* M3U8 Multi-thread Download Dialog */}
      {downloadDialogTarget && extractedData && (
        <M3u8DownloadDialog
          isOpen={true}
          onClose={() => setDownloadDialogTarget(null)}
          videoTitle={extractedData.title}
          streamUrl={downloadDialogTarget.streamUrl}
          qualityLabel={downloadDialogTarget.qualityLabel}
          referer={extractedData.embedUrl || "https://www.avtub.net/"}
        />
      )}
    </div>
  );
}
