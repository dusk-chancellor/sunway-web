import { getUser, updateUser } from "@/server/store";
import { getUserId, json, fail } from "@/server/http";
import { StoreError } from "@/server/store";

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    if (!userId) throw new StoreError(401, "UNAUTHENTICATED", "Not signed in");
    return json(getUser(userId));
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await getUserId(req);
    if (!userId) throw new StoreError(401, "UNAUTHENTICATED", "Not signed in");
    const body = (await req.json()) as { fullName?: string; email?: string; dob?: string };
    return json(updateUser(userId, body));
  } catch (e) {
    return fail(e);
  }
}
