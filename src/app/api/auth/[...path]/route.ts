import { neonAuth } from "@/lib/auth/server";

const auth = neonAuth();

function missing() {
  return Response.json(
    { error: "Neon Auth is not configured. Enable Auth in the Neon console and set NEON_AUTH_BASE_URL." },
    { status: 503 },
  );
}

export const GET = auth ? auth.handler().GET : missing;
export const POST = auth ? auth.handler().POST : missing;
export const PUT = auth ? auth.handler().PUT : missing;
export const PATCH = auth ? auth.handler().PATCH : missing;
export const DELETE = auth ? auth.handler().DELETE : missing;
