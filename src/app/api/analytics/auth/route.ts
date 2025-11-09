import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ANALYTICS_PASSWORD = process.env.ANALYTICS_PASSWORD || "gicm-alpha-2024";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password } = body;

    if (password !== ANALYTICS_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Set a secure cookie for analytics access
    const response = NextResponse.json({ success: true });

    (await cookies()).set("analytics-auth", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("analytics-auth");

  return NextResponse.json({
    authenticated: authCookie?.value === "authenticated",
  });
}
