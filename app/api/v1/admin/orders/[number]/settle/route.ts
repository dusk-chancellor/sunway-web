import { adminSettleCod, requireAdmin } from "@/server/store";
import { getUserId, json, fail } from "@/server/http";

export async function POST(req: Request, { params }: { params: Promise<{ number: string }> }) {
  try {
    requireAdmin(await getUserId(req));
    const { number } = await params;
    return json(adminSettleCod(number));
  } catch (e) {
    return fail(e);
  }
}
