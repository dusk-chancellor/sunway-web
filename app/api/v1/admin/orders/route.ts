import { adminListOrders, requireAdmin } from "@/server/store";
import { getUserId, json, fail } from "@/server/http";

export async function GET(req: Request) {
  try {
    requireAdmin(await getUserId(req));
    const p = new URL(req.url).searchParams;
    return json(adminListOrders({ status: p.get("status") ?? undefined, q: p.get("q") ?? undefined }));
  } catch (e) {
    return fail(e);
  }
}
