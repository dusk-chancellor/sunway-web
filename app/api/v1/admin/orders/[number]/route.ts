import { adminGetOrder, requireAdmin } from "@/server/store";
import { getUserId, json, fail } from "@/server/http";

export async function GET(req: Request, { params }: { params: Promise<{ number: string }> }) {
  try {
    requireAdmin(await getUserId(req));
    const { number } = await params;
    return json(adminGetOrder(number));
  } catch (e) {
    return fail(e);
  }
}
