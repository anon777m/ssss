import { spawn, ChildProcess } from "child_process";
import fs from "fs";
import path from "path";

export interface DownloadTask {
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

// In-memory global task store for tracking processes
// Using globalThis so Next.js fast refresh does not wipe active download state
const globalStore = globalThis as unknown as {
  __m3u8dl_tasks?: Map<string, DownloadTask>;
  __m3u8dl_procs?: Map<string, ChildProcess>;
};

if (!globalStore.__m3u8dl_tasks) {
  globalStore.__m3u8dl_tasks = new Map<string, DownloadTask>();
}
if (!globalStore.__m3u8dl_procs) {
  globalStore.__m3u8dl_procs = new Map<string, ChildProcess>();
}

const tasks = globalStore.__m3u8dl_tasks;
const processes = globalStore.__m3u8dl_procs;

// Default suggested paths for WSL & Linux
export function getDefaultDownloadDirectories(): { label: string; path: string; isWindows?: boolean }[] {
  const list: { label: string; path: string; isWindows?: boolean }[] = [];

  // Check Windows User profile in WSL
  if (fs.existsSync("/mnt/c/Users")) {
    try {
      const userFolders = fs.readdirSync("/mnt/c/Users");
      for (const u of userFolders) {
        if (["Public", "Default", "Default User", "All Users", "desktop.ini"].includes(u)) continue;
        const winDownloads = `/mnt/c/Users/${u}/Downloads`;
        const winVideos = `/mnt/c/Users/${u}/Videos`;
        const winDesktop = `/mnt/c/Users/${u}/Desktop`;

        if (fs.existsSync(winDownloads)) {
          list.push({ label: `Windows Downloads (C:\\Users\\${u}\\Downloads)`, path: winDownloads, isWindows: true });
        }
        if (fs.existsSync(winVideos)) {
          list.push({ label: `Windows Videos (C:\\Users\\${u}\\Videos)`, path: winVideos, isWindows: true });
        }
        if (fs.existsSync(winDesktop)) {
          list.push({ label: `Windows Desktop (C:\\Users\\${u}\\Desktop)`, path: winDesktop, isWindows: true });
        }
      }
    } catch {
      // ignore
    }
  }

  // Home linux downloads
  const homeDir = process.env.HOME || "/home/dev";
  const linuxDownloads = path.join(homeDir, "Downloads");
  if (fs.existsSync(linuxDownloads)) {
    list.push({ label: `Linux Downloads (${linuxDownloads})`, path: linuxDownloads });
  }
  list.push({ label: `Linux Home (${homeDir})`, path: homeDir });

  return list;
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, "-").replace(/\s+/g, " ").trim();
}

export function startM3u8dlDownload(params: {
  url: string;
  title: string;
  quality?: string;
  saveDir?: string;
  customFilename?: string;
  threads?: number;
  referer?: string;
}): DownloadTask {
  const taskId = "dl_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

  const defaultDirs = getDefaultDownloadDirectories();
  const targetSaveDir = params.saveDir && params.saveDir.trim()
    ? params.saveDir.trim()
    : (defaultDirs[0]?.path || process.cwd());

  // Ensure directory exists
  if (!fs.existsSync(targetSaveDir)) {
    try {
      fs.mkdirSync(targetSaveDir, { recursive: true });
    } catch (e: any) {
      console.error("Failed to create dir:", e);
    }
  }

  const cleanTitle = sanitizeFilename(params.title || "video");
  const rawFileName = params.customFilename && params.customFilename.trim()
    ? sanitizeFilename(params.customFilename.trim().replace(/\.mp4$/i, ""))
    : `${cleanTitle}${params.quality ? `-${params.quality}` : ""}`;

  const task: DownloadTask = {
    id: taskId,
    title: params.title,
    url: params.url,
    quality: params.quality,
    saveDir: targetSaveDir,
    filename: rawFileName,
    status: "running",
    logs: [
      `[INIT] Memulai task download ID: ${taskId}`,
      `[INIT] Judul: ${params.title}`,
      `[INIT] Kualitas: ${params.quality || "Default/Master"}`,
      `[INIT] Folder Simpan: ${targetSaveDir}`,
      `[INIT] Nama File Output: ${rawFileName}.mp4`,
      `[EXEC] Menjalankan binary m3u8dl multi-threaded...`,
    ],
    progressPercent: 0,
    speed: "0 KB/s",
    downloadedSegments: "0/0",
    startTime: Date.now(),
    outputFilePath: path.join(targetSaveDir, `${rawFileName}.mp4`),
  };

  tasks.set(taskId, task);

  const m3u8dlPath = "/home/dev/.nvm/versions/node/v24.19.0/bin/m3u8dl";
  const threads = params.threads || 16;
  const ffmpegPath = "/home/dev/.local/bin/ffmpeg";

  const args: string[] = [
    params.url,
    "-f", rawFileName,
    "-S", targetSaveDir,
    "-n", String(threads),
  ];

  if (fs.existsSync(ffmpegPath)) {
    args.push("--ffmpeg-path", ffmpegPath);
  }

  const customHeaders: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Referer": params.referer || "https://www.avtub.net/",
  };

  args.push("-H", JSON.stringify(customHeaders));

  const env = {
    ...process.env,
    PATH: `/home/dev/.nvm/versions/node/v24.19.0/bin:/home/dev/.local/bin:${process.env.PATH || ""}`,
  };

  const child = spawn(m3u8dlPath, args, {
    cwd: targetSaveDir,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  processes.set(taskId, child);

  const cleanAnsi = (str: string) =>
    str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");

  const handleOutput = (data: Buffer) => {
    const rawText = data.toString("utf8");
    const rawLines = rawText.split(/\r?\n|\r/);
    for (const rawLine of rawLines) {
      const line = cleanAnsi(rawLine).trim();
      if (!line) continue;

      // Add to logs (max 400 logs preserved)
      task.logs.push(line);
      if (task.logs.length > 400) {
        task.logs.shift();
      }

      // Parse progress if available
      const percentMatch = line.match(/(\d+(?:\.\d+)?)%/);
      if (percentMatch) {
        task.progressPercent = Math.min(100, Math.max(0, parseFloat(percentMatch[1])));
      }

      const segMatch = line.match(/(\d+\/\d+)/);
      if (segMatch) {
        task.downloadedSegments = segMatch[1];
      }

      const speedMatch = line.match(/(\d+(?:\.\d+)?\s*(?:KB|MB|GB|B)\/s)/i);
      if (speedMatch) {
        task.speed = speedMatch[1];
      }
    }
  };

  child.stdout.on("data", handleOutput);
  child.stderr.on("data", handleOutput);

  child.on("close", (code) => {
    task.endTime = Date.now();
    processes.delete(taskId);

    if (code === 0) {
      task.status = "completed";
      task.progressPercent = 100;
      task.logs.push(`[SUCCESS] Download selesai! File tersimpan di: ${task.outputFilePath}`);
    } else if (task.status !== "cancelled") {
      task.status = "error";
      task.error = `m3u8dl process exited with code ${code}`;
      task.logs.push(`[ERROR] Download gagal atau terhenti dengan exit code ${code}`);
    }
  });

  child.on("error", (err) => {
    task.endTime = Date.now();
    processes.delete(taskId);
    task.status = "error";
    task.error = err.message;
    task.logs.push(`[FATAL] Error spawning m3u8dl: ${err.message}`);
  });

  return task;
}

export function getTask(taskId: string): DownloadTask | undefined {
  return tasks.get(taskId);
}

export function getAllTasks(): DownloadTask[] {
  return Array.from(tasks.values()).reverse();
}

export function cancelTask(taskId: string): boolean {
  const child = processes.get(taskId);
  const task = tasks.get(taskId);
  if (task) {
    task.status = "cancelled";
    task.logs.push(`[CANCELLED] Download dibatalkan oleh pengguna.`);
  }
  if (child) {
    child.kill("SIGINT");
    processes.delete(taskId);
    return true;
  }
  return false;
}
