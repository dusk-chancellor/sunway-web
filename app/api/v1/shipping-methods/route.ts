import { listShippingMethods } from "@/server/store";
import { json, fail } from "@/server/http";

export async function GET() {
  try {
    return json({ items: listShippingMethods() });
  } catch (e) {
    return fail(e);
  }
}
