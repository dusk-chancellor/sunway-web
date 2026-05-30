import { getCart } from "@/server/store";
import { getCartKey, json, fail, setCartCookie } from "@/server/http";

export async function GET(req: Request) {
  try {
    const { key, setCookie } = await getCartKey(req);
    const res = json(getCart(key));
    if (setCookie) setCartCookie(res, setCookie);
    return res;
  } catch (e) {
    return fail(e);
  }
}
