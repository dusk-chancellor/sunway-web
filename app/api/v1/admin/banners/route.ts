import { adminListBanners, adminUpsertBanner, requireAdmin } from "@/server/store";
import { getUserId, json, fail } from "@/server/http";

export async function GET(req: Request) {
  try {
    requireAdmin(await getUserId(req));
    return json({ items: adminListBanners() });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  try {
    requireAdmin(await getUserId(req));
    const b = await req.json();
    return json(
      adminUpsertBanner({
        title: b.title,
        subtitle: b.subtitle ?? "",
        ctaLabel: b.ctaLabel ?? "Shop now",
        ctaHref: b.ctaHref ?? "/",
        active: b.active ?? true,
      }),
      { status: 201 },
    );
  } catch (e) {
    return fail(e);
  }
}
