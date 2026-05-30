import { updateAddress, deleteAddress } from "@/server/store";
import { getUserId, json, fail } from "@/server/http";
import { StoreError } from "@/server/store";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(req);
    if (!userId) throw new StoreError(401, "UNAUTHENTICATED", "Not signed in");
    const { id } = await params;
    const b = await req.json();
    return json(updateAddress(userId, id, b));
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(req);
    if (!userId) throw new StoreError(401, "UNAUTHENTICATED", "Not signed in");
    const { id } = await params;
    return json(deleteAddress(userId, id));
  } catch (e) {
    return fail(e);
  }
}
