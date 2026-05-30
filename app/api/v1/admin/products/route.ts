import { adminListProducts, adminUpsertProduct, requireAdmin } from "@/server/store";
import { getUserId, json, fail } from "@/server/http";

export async function GET(req: Request) {
  try {
    requireAdmin(await getUserId(req));
    const q = new URL(req.url).searchParams.get("q") ?? undefined;
    return json({ items: adminListProducts(q) });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  try {
    requireAdmin(await getUserId(req));
    const b = await req.json();
    return json(
      adminUpsertProduct({
        name: b.name,
        description: b.description ?? "",
        priceMinor: Number(b.priceMinor),
        stockQty: Number(b.stockQty),
        categoryId: b.categoryId,
        isActive: b.isActive ?? true,
      }),
      { status: 201 },
    );
  } catch (e) {
    return fail(e);
  }
}
