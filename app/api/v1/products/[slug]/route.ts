import { getProductBySlug } from "@/server/store";
import { json, fail } from "@/server/http";
import { StoreError } from "@/server/store";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const product = getProductBySlug(slug);
    if (!product) throw new StoreError(404, "PRODUCT_NOT_FOUND", "Product not found");
    return json(product);
  } catch (e) {
    return fail(e);
  }
}
