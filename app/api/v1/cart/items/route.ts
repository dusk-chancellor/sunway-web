import { addToCart } from "@/server/store";
import { getCartKey, json, fail, setCartCookie } from "@/server/http";

export async function POST(req: Request) {
  try {
    const { key, userId, setCookie } = await getCartKey(req);
    const body = (await req.json()) as { productId: string; quantity?: number };
    const cart = addToCart(key, userId, body.productId, body.quantity ?? 1);
    const res = json(cart);
    if (setCookie) setCartCookie(res, setCookie);
    return res;
  } catch (e) {
    return fail(e);
  }
}
