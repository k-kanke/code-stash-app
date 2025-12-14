import { NextResponse } from "next/server";
import { getServerApiBase } from "@/lib/server-api";
import { clearAuthCookie, setAuthCookie } from "@/lib/auth-cookie";

type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  error?: string;
};

type Mode = "login" | "register";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const mode: Mode = body?.mode === "register" ? "register" : "login";
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 },
      );
    }

    if (mode === "register" && !name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 },
      );
    }

    const endpoint =
      mode === "register" ? "/api/auth/register" : "/api/auth/login";
    const payload =
      mode === "register"
        ? { name, email, password }
        : { email, password };

    const upstream = await fetch(`${getServerApiBase()}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const { payload: parsed, rawText } = await parseAuthResponse(upstream);

    if (!upstream.ok || !parsed) {
      const message = parsed?.error ?? rawText ?? "Failed to authenticate";
      return NextResponse.json({ error: message }, { status: upstream.status });
    }

    if (!parsed.token) {
      return NextResponse.json(
        { error: "Invalid authentication response" },
        { status: 502 },
      );
    }

    await setAuthCookie(parsed.token);
    return NextResponse.json(
      { user: parsed.user },
      { status: mode === "register" ? 201 : 200 },
    );
  } catch (error) {
    console.error("Failed to handle auth", error);
    return NextResponse.json(
      { error: "Failed to authenticate" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    await clearAuthCookie();
    return NextResponse.json({ status: "logged_out" }, { status: 200 });
  } catch (error) {
    console.error("Failed to logout", error);
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 },
    );
  }
}

async function parseAuthResponse(response: Response) {
  const rawText = await response.text();
  if (!rawText) {
    return { payload: null as AuthResponse | null, rawText };
  }

  try {
    const payload = JSON.parse(rawText) as AuthResponse;
    return { payload, rawText };
  } catch {
    return { payload: null as AuthResponse | null, rawText };
  }
}
