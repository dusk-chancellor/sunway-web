import { adminGetProduct, adminUpsertProduct, adminDeleteProduct, requireAdmin } from "@/server/store";
import { getUserId, json, fail } from "@/server/http";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(await getUserId(req));
    const { id } = await params;
    return json(adminGetProduct(id));
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(await getUserId(req));
    const { id } = await params;
    const b = await req.json();
    return json(
      adminUpsertProduct({
        id,
        name: b.name,
        description: b.description ?? "",
        priceMinor: Number(b.priceMinor),
        stockQty: Number(b.stockQty),
        categoryId: b.categoryId,
        isActive: b.isActive ?? true,
      }),
    );
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(await getUserId(req));
    const { id } = await params;
    return json(adminDeleteProduct(id));
  } catch (e) {
    return fail(e);
  }
}
