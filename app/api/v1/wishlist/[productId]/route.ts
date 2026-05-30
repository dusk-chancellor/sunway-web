import { addWishlist, removeWishlist } from "@/server/store";
import { getUserId, json, fail } from "@/server/http";
import { StoreError } from "@/server/store";

export async function POST(req: Request, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const userId = await getUserId(req);
    if (!userId) throw new StoreError(401, "UNAUTHENTICATED", "Sign in to use the wishlist");
    const { productId } = await params;
    return json(addWishlist(userId, productId));
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const userId = await getUserId(req);
    if (!userId) throw new StoreError(401, "UNAUTHENTICATED", "Sign in to use the wishlist");
    const { productId } = await params;
    return json(removeWishlist(userId, productId));
  } catch (e) {
    return fail(e);
  }
}
