import { listOrders, createOrder } from "@/server/store";
import { getUserId, getCartKey, json, fail } from "@/server/http";
import { StoreError } from "@/server/store";

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    if (!userId) throw new StoreError(401, "UNAUTHENTICATED", "Not signed in");
    return json(listOrders(userId));
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId(req);
    if (!userId) throw new StoreError(401, "UNAUTHENTICATED", "Sign in to place an order");
    const { key } = await getCartKey(req);
    const b = await req.json();
    const idempotencyKey = req.headers.get("Idempotency-Key") ?? undefined;
    const order = createOrder(userId, key, {
      shippingAddressId: b.shippingAddressId,
      shippingMethodId: b.shippingMethodId,
      paymentMethod: b.paymentMethod,
    }, idempotencyKey);
    return json(order, { status: 201 });
  } catch (e) {
    return fail(e);
  }
}
