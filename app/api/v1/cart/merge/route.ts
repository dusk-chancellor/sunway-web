import { mergeCart } from "@/server/store";
import { getUserId, json, fail, clearCartCookie, CART_COOKIE } from "@/server/http";
import { cookies } from "next/headers";
import { StoreError } from "@/server/store";

export async function POST(req: Request) {
  try {
    const userId = await getUserId(req);
    if (!userId) throw new StoreError(401, "UNAUTHENTICATED", "Sign in first");
    const guestToken = (await cookies()).get(CART_COOKIE)?.value;
    const cart = mergeCart(guestToken ?? "", userId);
    const res = json(cart);
    clearCartCookie(res);
    return res;
  } catch (e) {
    return fail(e);
  }
}
