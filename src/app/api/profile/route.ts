import { db } from "@/db";
import { userProfile } from "@/db/schema";
import { eq } from "drizzle-orm";
import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const profileFilePath = path.join(process.cwd(), "local_db", "profile.json");

async function readFallbackProfile() {
  try {
    const file = await fs.readFile(profileFilePath, "utf-8");
    return JSON.parse(file);
  } catch {
    return null;
  }
}

async function writeFallbackProfile(profile: Record<string, unknown>) {
  await fs.mkdir(path.dirname(profileFilePath), { recursive: true });
  await fs.writeFile(profileFilePath, JSON.stringify(profile, null, 2), "utf-8");
}

export async function GET() {
  try {
    const profiles = await db.select().from(userProfile).limit(1);
    if (profiles.length === 0) {
      const fallback = await readFallbackProfile();
      return NextResponse.json(fallback);
    }
    return NextResponse.json(profiles[0]);
  } catch {
    const fallback = await readFallbackProfile();
    return NextResponse.json(fallback);
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
    const existing = await db.select().from(userProfile).limit(1);

    if (existing.length > 0) {
      const updateData: Record<string, unknown> = {
        name: body.name,
        age: body.age,
        gender: body.gender,
        weightKg: body.weightKg,
        heightCm: body.heightCm,
        lifestyle: body.lifestyle,
        goal: body.goal,
        updatedAt: new Date(),
      };
      if (body.profilePicture !== undefined) {
        updateData.profilePicture = body.profilePicture;
      }
      const result = await db
        .update(userProfile)
        .set(updateData)
        .where(eq(userProfile.id, existing[0].id))
        .returning();
      const profile = result[0];
      await writeFallbackProfile(profile);
      return NextResponse.json(profile);
    }

    const result = await db
      .insert(userProfile)
      .values({
        name: body.name,
        age: body.age,
        gender: body.gender,
        weightKg: body.weightKg,
        heightCm: body.heightCm,
        lifestyle: body.lifestyle,
        goal: body.goal,
        profilePicture: body.profilePicture || "",
      })
      .returning();
    const profile = result[0];
    await writeFallbackProfile(profile);
    return NextResponse.json(profile, { status: 201 });
  } catch {
    const profile = {
      id: 1,
      name: body?.name || "User",
      age: body?.age || 25,
      gender: body?.gender || "male",
      weightKg: body?.weightKg || 70,
      heightCm: body?.heightCm || 170,
      lifestyle: body?.lifestyle || "normal",
      goal: body?.goal || "maintain",
      profilePicture: body?.profilePicture || "",
      healthAppConnected: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await writeFallbackProfile(profile);
    return NextResponse.json(profile, { status: 201 });
  }
}
