import { adminChangeOrderStatus, requireAdmin } from "@/server/store";
import { getUserId, json, fail } from "@/server/http";

export async function POST(req: Request, { params }: { params: Promise<{ number: string }> }) {
  try {
    requireAdmin(await getUserId(req));
    const { number } = await params;
    const b = await req.json();
    return json(adminChangeOrderStatus(number, b.status, b.note ?? ""));
  } catch (e) {
    return fail(e);
  }
}
