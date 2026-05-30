import { listAdminCategories, adminUpsertCategory, requireAdmin } from "@/server/store";
import { getUserId, json, fail } from "@/server/http";

export async function GET(req: Request) {
  try {
    requireAdmin(await getUserId(req));
    return json({ items: listAdminCategories() });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  try {
    requireAdmin(await getUserId(req));
    const b = await req.json();
    return json(
      adminUpsertCategory({ name: b.name, featured: Boolean(b.featured), isActive: b.isActive ?? true }),
      { status: 201 },
    );
  } catch (e) {
    return fail(e);
  }
}
