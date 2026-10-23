"use client";

import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { StreamQuality } from "@/lib/scraper";

interface HlsPlayerProps {
  src: string; // m3u8 url
  fallbackEmbedUrl?: string;
  poster?: string;
  title?: string;
  streams?: StreamQuality[];
  onQualityChange?: (qualityUrl: string) => void;
}

export default function HlsPlayer({
  src,
  fallbackEmbedUrl,
  poster,
  title,
  streams = [],
  onQualityChange,
}: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<string>("Auto");
  const [hlsLevels, setHlsLevels] = useState<{ index: number; height: number; bitrate: number }[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1);

  // Initialize or reload HLS
  useEffect(() => {
    setError(null);
    setIsLoading(true);
    setUseIframeFallback(false);

    const video = videoRef.current;
    if (!video || !src) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
        maxBufferSize: 60 * 1000 * 1000,
        maxMaxBufferLength: 600,
        fragLoadingTimeOut: 30000,
        fragLoadingMaxRetry: 6,
        fragLoadingRetryDelay: 1000,
        manifestLoadingTimeOut: 20000,
        manifestLoadingMaxRetry: 4,
        levelLoadingTimeOut: 20000,
        levelLoadingMaxRetry: 4,
      });

      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsLoading(false);
        const levels = data.levels.map((lvl, index) => ({
          index,
          height: lvl.height,
          bitrate: lvl.bitrate,
        }));
        setHlsLevels(levels);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setCurrentLevel(data.level);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.warn("HLS event error:", data.type, data.details, data.fatal);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log("Fatal network error encountered, trying to recover...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log("Fatal media error encountered, trying to recover...");
              hls.recoverMediaError();
              break;
            default:
              console.error("Unrecoverable HLS error:", data.details);
              hls.destroy();
              setError("CDN stream direct playback failed. You can switch to Embed Player or use Direct Download.");
              if (fallbackEmbedUrl) {
                // Keep option to switch to iframe
              }
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS (Safari / iOS)
      video.src = src;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
      });
      video.addEventListener("error", () => {
        setError("Playback error on native HLS");
      });
    } else {
      setError("HLS playback is not supported in this browser.");
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, fallbackEmbedUrl]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    setVolume(val);
    if (val === 0) {
      video.muted = true;
      setIsMuted(true);
    } else if (video.muted) {
      video.muted = false;
      setIsMuted(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const seekTo = (parseFloat(e.target.value) / 100) * duration;
    video.currentTime = seekTo;
    setCurrentTime(seekTo);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const pad = (n: number) => n.toString().padStart(2, "0");
    if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
  };

  const selectQualityLevel = (levelIndex: number, label: string) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
      setSelectedQuality(label);
      setShowQualityMenu(false);
    }
  };

  if (useIframeFallback && fallbackEmbedUrl) {
    return (
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-2xl">
        <iframe
          src={fallbackEmbedUrl}
          className="w-full h-full border-0"
          allowFullScreen
          scrolling="no"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          title={title || "Video Player"}
        />
        <button
          onClick={() => setUseIframeFallback(false)}
          className="absolute top-3 right-3 px-3 py-1.5 bg-zinc-900/90 hover:bg-zinc-800 text-xs text-zinc-300 rounded-md border border-zinc-700 backdrop-blur transition"
        >
          Kembali ke Native Player
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden group select-none border border-zinc-800 shadow-2xl"
    >
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={() => {
          if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
          }
        }}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsLoading(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        playsInline
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] pointer-events-none z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-3 border-zinc-600 border-t-zinc-200 rounded-full animate-spin" />
            <span className="text-xs text-zinc-400 font-mono tracking-wider">
              STREAMING LIVE M3U8...
            </span>
          </div>
        </div>
      )}

      {/* Error Fallback Banner */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 text-zinc-200 p-6 text-center z-20">
          <AlertCircle className="w-10 h-10 text-zinc-400 mb-2" />
          <p className="text-sm font-medium mb-1">{error}</p>
          <p className="text-xs text-zinc-500 mb-4 max-w-md">
            Beberapa CDN membatasi browser langsung. Anda dapat memuat Embed Iframe Player resmi atau mendownload file video.
          </p>
          <div className="flex items-center gap-3">
            {fallbackEmbedUrl && (
              <button
                onClick={() => setUseIframeFallback(true)}
                className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold rounded-lg transition flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Gunakan Embed Player
              </button>
            )}
            <button
              onClick={() => {
                setError(null);
                if (hlsRef.current) {
                  hlsRef.current.loadSource(src);
                  hlsRef.current.startLoad();
                }
              }}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700 transition flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Coba Ulang
            </button>
          </div>
        </div>
      )}

      {/* Bypass Protection Badge */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-10 opacity-70 group-hover:opacity-100 transition">
        <span className="px-2 py-0.5 bg-zinc-900/90 border border-zinc-700/80 rounded-md text-[10px] font-mono text-zinc-300 flex items-center gap-1.5 backdrop-blur shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
          HLS Live Decrypted
        </span>
        {selectedQuality && (
          <span className="px-2 py-0.5 bg-zinc-900/90 border border-zinc-700/80 rounded-md text-[10px] font-mono text-zinc-400 backdrop-blur">
            {selectedQuality}
          </span>
        )}
      </div>

      {/* Fallback button top-right */}
      {fallbackEmbedUrl && (
        <button
          onClick={() => setUseIframeFallback(true)}
          className="absolute top-3 right-3 px-2.5 py-1 bg-zinc-900/80 hover:bg-zinc-800 text-[11px] text-zinc-400 hover:text-zinc-200 rounded-md border border-zinc-800 backdrop-blur transition z-10 opacity-0 group-hover:opacity-100"
          title="Beralih ke Iframe Player"
        >
          Mode Embed
        </button>
      )}

      {/* Video Control Bar */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        {/* Progress bar */}
        <div className="relative mb-2.5">
          <input
            type="range"
            min="0"
            max="100"
            value={duration ? (currentTime / duration) * 100 : 0}
            onChange={handleSeek}
            className="w-full h-1.5 bg-zinc-800/80 rounded-lg appearance-none cursor-pointer accent-zinc-200 hover:h-2 transition-all"
          />
        </div>

        <div className="flex items-center justify-between gap-3 text-zinc-300 text-xs">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-1.5 hover:text-white rounded transition hover:bg-zinc-800/60"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
            </button>

            {/* Mute/Volume */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleMute}
                className="p-1.5 hover:text-white rounded transition hover:bg-zinc-800/60"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-zinc-700 rounded appearance-none cursor-pointer accent-zinc-200"
              />
            </div>

            {/* Time */}
            <span className="font-mono text-[11px] text-zinc-400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2 relative">
            {/* Quality Selector */}
            <div className="relative">
              <button
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                className="px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition flex items-center gap-1 text-[11px] font-mono border border-zinc-700/60"
              >
                <Settings className="w-3 h-3" />
                {selectedQuality}
              </button>

              {showQualityMenu && (
                <div className="absolute bottom-full right-0 mb-2 w-32 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-30 py-1 text-xs">
                  <div className="px-3 py-1 text-[10px] text-zinc-500 font-mono uppercase tracking-wider border-b border-zinc-800">
                    Resolusi
                  </div>
                  <button
                    onClick={() => selectQualityLevel(-1, "Auto")}
                    className={`w-full text-left px-3 py-1.5 hover:bg-zinc-800 flex items-center justify-between ${
                      selectedQuality === "Auto" ? "text-white font-bold" : "text-zinc-400"
                    }`}
                  >
                    <span>Auto</span>
                    {selectedQuality === "Auto" && <span>✓</span>}
                  </button>

                  {hlsLevels.length > 0 ? (
                    hlsLevels.map((lvl) => {
                      const label = lvl.height >= 1000 ? "1080p" : `${lvl.height}p`;
                      const isSelected = currentLevel === lvl.index;
                      return (
                        <button
                          key={lvl.index}
                          onClick={() => selectQualityLevel(lvl.index, label)}
                          className={`w-full text-left px-3 py-1.5 hover:bg-zinc-800 flex items-center justify-between ${
                            isSelected ? "text-white font-bold" : "text-zinc-400"
                          }`}
                        >
                          <span>{label}</span>
                          {isSelected && <span>✓</span>}
                        </button>
                      );
                    })
                  ) : streams.length > 0 ? (
                    streams.map((st, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (onQualityChange) onQualityChange(st.proxyUrl || st.url);
                          setSelectedQuality(st.label);
                          setShowQualityMenu(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                      >
                        {st.label}
                      </button>
                    ))
                  ) : null}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 hover:text-white rounded transition hover:bg-zinc-800/60"
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
