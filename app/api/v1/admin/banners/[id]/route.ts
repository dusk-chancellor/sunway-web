import { adminUpsertBanner, adminDeleteBanner, requireAdmin } from "@/server/store";
import { getUserId, json, fail } from "@/server/http";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(await getUserId(req));
    const { id } = await params;
    const b = await req.json();
    return json(
      adminUpsertBanner({
        id,
        title: b.title,
        subtitle: b.subtitle ?? "",
        ctaLabel: b.ctaLabel ?? "Shop now",
        ctaHref: b.ctaHref ?? "/",
        active: b.active ?? true,
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
    return json(adminDeleteBanner(id));
  } catch (e) {
    return fail(e);
  }
}
