import { listCategories } from "@/server/store";
import { json, fail } from "@/server/http";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const featured = url.searchParams.get("featured") === "true";
    return json({ items: listCategories({ featured }) });
  } catch (e) {
    return fail(e);
  }
}
