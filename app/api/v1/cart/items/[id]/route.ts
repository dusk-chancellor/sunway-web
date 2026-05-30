import { updateCartItem, removeCartItem } from "@/server/store";
import { getCartKey, json, fail } from "@/server/http";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { key } = await getCartKey(req);
    const body = (await req.json()) as { quantity: number };
    return json(updateCartItem(key, id, body.quantity));
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { key } = await getCartKey(req);
    return json(removeCartItem(key, id));
  } catch (e) {
    return fail(e);
  }
}
