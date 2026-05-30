import { listWishlist } from "@/server/store";
import { getUserId, json, fail } from "@/server/http";
import { StoreError } from "@/server/store";

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    if (!userId) throw new StoreError(401, "UNAUTHENTICATED", "Not signed in");
    return json({ items: listWishlist(userId) });
  } catch (e) {
    return fail(e);
  }
}
