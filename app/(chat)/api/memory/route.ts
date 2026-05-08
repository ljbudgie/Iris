import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { IrisError } from "@/lib/errors";
import { getMemPalaceClient } from "@/lib/mempalace/client";

const rememberSchema = z.object({
  wing: z.string().min(1).max(120).default("wing_user"),
  room: z.string().min(1).max(120).default("user-approved"),
  content: z.string().min(1).max(8000),
});

async function getConnectedClient() {
  const client = getMemPalaceClient();
  if (!client) {
    return null;
  }
  if (!client.isConnected()) {
    await client.connect();
  }
  return client;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new IrisError("unauthorized:chat").toResponse();
  }

  const client = await getConnectedClient();
  if (!client) {
    return Response.json({
      configured: false,
      status: null,
      results: [],
    });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (query) {
    const results = await client.search({ query, limit: 10 });
    return Response.json({ configured: true, results });
  }

  const status = await client.status();
  return Response.json({ configured: true, status, results: [] });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new IrisError("unauthorized:chat").toResponse();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new IrisError("bad_request:api", "Invalid JSON body.").toResponse();
  }

  const parsed = rememberSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        code: "bad_request:api",
        message: "Invalid memory payload.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const client = await getConnectedClient();
  if (!client) {
    return new IrisError(
      "bad_request:api",
      "MemPalace is not configured."
    ).toResponse();
  }

  const stored = await client.addDrawer({
    ...parsed.data,
    content: JSON.stringify({
      content: parsed.data.content,
      provenance: {
        source: "memory-page",
        approvedByUser: true,
        storedAt: new Date().toISOString(),
      },
    }),
    added_by: "iris",
  });

  return Response.json({ stored }, { status: 201 });
}
