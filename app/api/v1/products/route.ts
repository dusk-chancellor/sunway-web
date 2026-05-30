import { listProducts, getRelated } from "@/server/store";
import { json, fail } from "@/server/http";

export async function GET(req: Request) {
  try {
    const p = new URL(req.url).searchParams;
    const relatedTo = p.get("related_to");
    if (relatedTo) {
      const rawLimit = Number(p.get("limit") ?? 4);
      const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 4;
      return json({ items: getRelated(relatedTo, limit) });
    }
    const num = (k: string) => {
      const raw = p.get(k);
      if (raw == null) return undefined;
      const n = Number(raw);
      return Number.isFinite(n) ? n : undefined;
    };
    return json(
      listProducts({
        categorySlug: p.get("category") ?? undefined,
        minPrice: num("min_price"),
        maxPrice: num("max_price"),
        sort: p.get("sort") ?? undefined,
        featured: p.get("featured") === "true",
        page: num("page"),
        pageSize: num("page_size"),
      }),
    );
  } catch (e) {
    return fail(e);
  }
}
