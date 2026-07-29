import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// TODO: Implement Client API Route Handlers in the next pass.
// Must verify server-side that session.user.role === 'CLIENT' before servicing queries.
// Handles: fetching client projects, invoices, submitting reviews, and sending project messages.

export async function GET(request: NextRequest) {
  // TODO: Add auth check and Prisma queries for client data
  return NextResponse.json({ message: "Client API Endpoint Placeholder" });
}

export async function POST(request: NextRequest) {
  // TODO: Add mutation logic for client actions
  return NextResponse.json({ message: "Client API Endpoint Placeholder" });
}
