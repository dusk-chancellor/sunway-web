import { listAddresses, createAddress } from "@/server/store";
import { getUserId, json, fail } from "@/server/http";
import { StoreError } from "@/server/store";

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    if (!userId) throw new StoreError(401, "UNAUTHENTICATED", "Not signed in");
    return json({ items: listAddresses(userId) });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId(req);
    if (!userId) throw new StoreError(401, "UNAUTHENTICATED", "Not signed in");
    const b = await req.json();
    return json(
      createAddress(userId, {
        fullName: b.fullName,
        country: b.country ?? "Uzbekistan",
        region: b.region,
        city: b.city,
        street: b.street,
        apartment: b.apartment ?? null,
        postalCode: b.postalCode ?? null,
        isDefault: Boolean(b.isDefault),
      }),
    );
  } catch (e) {
    return fail(e);
  }
}
