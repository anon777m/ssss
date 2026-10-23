import { NextRequest, NextResponse } from "next/server";
import { getTask, getAllTasks, cancelTask } from "@/lib/m3u8dlManager";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("taskId");

  if (taskId) {
    const task = getTask(taskId);
    if (!task) {
      return NextResponse.json({ success: false, error: "Task tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ success: true, task });
  }

  const tasks = getAllTasks();
  return NextResponse.json({ success: true, tasks });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("taskId");

  if (!taskId) {
    return NextResponse.json({ success: false, error: "taskId parameter dibutuhkan" }, { status: 400 });
  }

  const ok = cancelTask(taskId);
  return NextResponse.json({ success: true, cancelled: ok });
}
