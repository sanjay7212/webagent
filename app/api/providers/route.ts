import { NextResponse } from "next/server";
import { getAvailableModels } from "@/lib/providers/models";

export async function GET() {
  return NextResponse.json({ models: getAvailableModels() });
}
