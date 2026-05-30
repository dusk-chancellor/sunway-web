import { adminStats, requireAdmin } from "@/server/store";
import { getUserId, json, fail } from "@/server/http";

export async function GET(req: Request) {
  try {
    requireAdmin(await getUserId(req));
    return json(adminStats());
  } catch (e) {
    return fail(e);
  }
}
