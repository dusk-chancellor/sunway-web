import { adminUpsertCategory, adminDeleteCategory, requireAdmin } from "@/server/store";
import { getUserId, json, fail } from "@/server/http";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(await getUserId(req));
    const { id } = await params;
    const b = await req.json();
    return json(adminUpsertCategory({ id, name: b.name, featured: Boolean(b.featured), isActive: b.isActive ?? true }));
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(await getUserId(req));
    const { id } = await params;
    return json(adminDeleteCategory(id));
  } catch (e) {
    return fail(e);
  }
}
