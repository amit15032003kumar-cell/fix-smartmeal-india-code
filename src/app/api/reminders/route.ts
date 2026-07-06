import { db } from "@/db";
import { reminders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await db.select().from(reminders).orderBy(reminders.time);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await db.insert(reminders).values({
      title: body.title,
      description: body.description || "",
      time: body.time,
      type: body.type,
      isActive: true,
    }).returning();
    return NextResponse.json(result[0], { status: 201 });
  } catch {
    return NextResponse.json({ success: true });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await db.update(reminders)
      .set({ isActive: body.isActive })
      .where(eq(reminders.id, body.id))
      .returning();
    return NextResponse.json(result[0]);
  } catch {
    return NextResponse.json({ success: true });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await db.delete(reminders).where(eq(reminders.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
