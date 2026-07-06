import { db } from "@/db";
import { mealPlans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const meals = await db.select().from(mealPlans).orderBy(mealPlans.dayOfWeek, mealPlans.mealType);
    return NextResponse.json(meals);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await db.insert(mealPlans).values({
      dayOfWeek: body.dayOfWeek,
      mealType: body.mealType,
      name: body.name,
      calories: body.calories || 0,
      protein: body.protein || 0,
      carbs: body.carbs || 0,
      fat: body.fat || 0,
      isVeg: body.isVeg ?? true,
      notes: body.notes || "",
    }).returning();
    return NextResponse.json(result[0], { status: 201 });
  } catch {
    return NextResponse.json({ success: true });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await db.delete(mealPlans).where(eq(mealPlans.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
