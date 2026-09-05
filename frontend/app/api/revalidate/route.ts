import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

const ALLOWED_TAGS = ["landing", "projects", "seo", "navigation", "settings"];

export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;

  if (!secret || request.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json(
      { success: false, message: "Invalid revalidation secret." },
      { status: 401 },
    );
  }

  let tags: unknown;
  try {
    ({ tags } = await request.json());
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON payload." },
      { status: 422 },
    );
  }

  if (!Array.isArray(tags) || tags.length === 0) {
    return NextResponse.json(
      { success: false, message: "The tags field must be a non-empty array." },
      { status: 422 },
    );
  }

  const revalidated = tags.filter(
    (tag): tag is string => typeof tag === "string" && ALLOWED_TAGS.includes(tag),
  );

  // Webhook-driven invalidation: expire immediately so the next request revalidates.
  revalidated.forEach((tag) => revalidateTag(tag, { expire: 0 }));

  return NextResponse.json({
    success: true,
    message: "Revalidation triggered.",
    data: { revalidated, now: Date.now() },
  });
}
