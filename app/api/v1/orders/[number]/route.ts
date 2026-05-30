import { getOrder } from "@/server/store";
import { getUserId, json, fail } from "@/server/http";
import { StoreError } from "@/server/store";

export async function GET(req: Request, { params }: { params: Promise<{ number: string }> }) {
  try {
    const userId = await getUserId(req);
    if (!userId) throw new StoreError(401, "UNAUTHENTICATED", "Not signed in");
    const { number } = await params;
    return json(getOrder(userId, number));
  } catch (e) {
    return fail(e);
  }
}
