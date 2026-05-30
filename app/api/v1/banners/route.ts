import { listBanners } from "@/server/store";
import { json, fail } from "@/server/http";

export async function GET(req: Request) {
  try {
    const active = new URL(req.url).searchParams.get("active") !== "false";
    return json({ items: listBanners(active) });
  } catch (e) {
    return fail(e);
  }
}
