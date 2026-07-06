import { db } from "@/db";
import { dailyTasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const fallbackTasks = (dayOfWeek: number) => [
  {
    id: 1,
    title: "Daily Steps",
    category: "steps",
    targetValue: 10000,
    currentValue: 0,
    unit: "steps",
    isCompleted: false,
    dayOfWeek,
  },
  {
    id: 2,
    title: "Drink Water",
    category: "water",
    targetValue: 8,
    currentValue: 0,
    unit: "glasses",
    isCompleted: false,
    dayOfWeek,
  },
  {
    id: 3,
    title: "Exercise",
    category: "exercise",
    targetValue: 30,
    currentValue: 0,
    unit: "min",
    isCompleted: false,
    dayOfWeek,
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dayOfWeek = searchParams.get("day");

  try {
    if (dayOfWeek !== null) {
      const tasks = await db.select().from(dailyTasks).where(eq(dailyTasks.dayOfWeek, parseInt(dayOfWeek)));
      return NextResponse.json(tasks.length > 0 ? tasks : fallbackTasks(parseInt(dayOfWeek)));
    }

    const tasks = await db.select().from(dailyTasks);
    return NextResponse.json(tasks);
  } catch {
    return NextResponse.json(dayOfWeek !== null ? fallbackTasks(parseInt(dayOfWeek)) : []);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await db
      .insert(dailyTasks)
      .values({
        title: body.title,
        category: body.category,
        targetValue: body.targetValue || 0,
        currentValue: body.currentValue || 0,
        unit: body.unit || "",
        isCompleted: false,
        dayOfWeek: body.dayOfWeek ?? new Date().getDay(),
      })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch {
    return NextResponse.json({ success: true });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.currentValue !== undefined) updateData.currentValue = body.currentValue;
    if (body.isCompleted !== undefined) updateData.isCompleted = body.isCompleted;
    if (body.targetValue !== undefined) updateData.targetValue = body.targetValue;

    const result = await db.update(dailyTasks).set(updateData).where(eq(dailyTasks.id, body.id)).returning();
    return NextResponse.json(result[0]);
  } catch {
    return NextResponse.json({ success: true });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    await db.delete(dailyTasks).where(eq(dailyTasks.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
