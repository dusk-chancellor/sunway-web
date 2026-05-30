import { getPage, StoreError } from "@/server/store";
import { json, fail } from "@/server/http";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const page = getPage(slug);
    if (!page) throw new StoreError(404, "PAGE_NOT_FOUND", "Page not found");
    return json(page);
  } catch (e) {
    return fail(e);
  }
}
