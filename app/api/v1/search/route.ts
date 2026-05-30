import { search } from "@/server/store";
import { json, fail } from "@/server/http";

export async function GET(req: Request) {
  try {
    const p = new URL(req.url).searchParams;
    const q = p.get("q") ?? "";
    const page = Number(p.get("page") ?? 1);
    return json(search(q, page));
  } catch (e) {
    return fail(e);
  }
}
