"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Download, CheckCircle2, AlertCircle, Loader2, X, HardDrive, Terminal, Play } from "lucide-react";

export interface ActiveDownloadTask {
  id: string;
  title: string;
  url: string;
  quality?: string;
  saveDir: string;
  filename: string;
  status: "idle" | "running" | "completed" | "error" | "cancelled";
  logs: string[];
  progressPercent: number;
  speed: string;
  downloadedSegments: string;
  startTime: number;
  endTime?: number;
  error?: string;
  outputFilePath?: string;
}

interface DownloadContextType {
  tasks: ActiveDownloadTask[];
  activeTaskCount: number;
  startDownload: (params: {
    url: string;
    title: string;
    quality?: string;
    saveDir?: string;
    customFilename?: string;
    threads?: number;
    referer?: string;
  }) => Promise<string | null>;
  cancelTask: (taskId: string) => Promise<void>;
  selectedTaskForLog: ActiveDownloadTask | null;
  setSelectedTaskForLog: (task: ActiveDownloadTask | null) => void;
  isQueueModalOpen: boolean;
  setIsQueueModalOpen: (open: boolean) => void;
}

const DownloadContext = createContext<DownloadContextType>({
  tasks: [],
  activeTaskCount: 0,
  startDownload: async () => null,
  cancelTask: async () => {},
  selectedTaskForLog: null,
  setSelectedTaskForLog: () => {},
  isQueueModalOpen: false,
  setIsQueueModalOpen: () => {},
});

export function DownloadProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<ActiveDownloadTask[]>([]);
  const [selectedTaskForLog, setSelectedTaskForLog] = useState<ActiveDownloadTask | null>(null);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);

  // Poll all running tasks continuously in background
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch("/api/m3u8dl/progress");
        const data = await res.json();
        if (data.success && Array.isArray(data.tasks)) {
          setTasks(data.tasks);

          // Update selected log modal if open
          if (selectedTaskForLog) {
            const updated = data.tasks.find((t: ActiveDownloadTask) => t.id === selectedTaskForLog.id);
            if (updated) setSelectedTaskForLog(updated);
          }
        }
      } catch {
        // silent fail
      }
    };

    fetchTasks();
    const interval = setInterval(fetchTasks, 1000);
    return () => clearInterval(interval);
  }, [selectedTaskForLog]);

  const startDownload = async (params: {
    url: string;
    title: string;
    quality?: string;
    saveDir?: string;
    customFilename?: string;
    threads?: number;
    referer?: string;
  }) => {
    try {
      const res = await fetch("/api/m3u8dl/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (data.success && data.task) {
        setTasks((prev) => [data.task, ...prev.filter((t) => t.id !== data.task.id)]);
        return data.task.id;
      }
      return null;
    } catch {
      return null;
    }
  };

  const cancelTask = async (taskId: string) => {
    try {
      await fetch(`/api/m3u8dl/progress?taskId=${encodeURIComponent(taskId)}`, {
        method: "DELETE",
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: "cancelled" } : t))
      );
    } catch {
      // ignore
    }
  };

  const activeTaskCount = tasks.filter((t) => t.status === "running").length;

  return (
    <DownloadContext.Provider
      value={{
        tasks,
        activeTaskCount,
        startDownload,
        cancelTask,
        selectedTaskForLog,
        setSelectedTaskForLog,
        isQueueModalOpen,
        setIsQueueModalOpen,
      }}
    >
      {children}
    </DownloadContext.Provider>
  );
}

export const useDownloads = () => useContext(DownloadContext);
