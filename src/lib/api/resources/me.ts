import { apiFetch } from "../client";
import { userSchema, addressSchema, type User, type Address, type AddressInput, type ProfileInput } from "@/lib/validation/schemas";
import { z } from "zod";

export async function updateProfile(input: ProfileInput): Promise<User> {
  return userSchema.parse(await apiFetch(`/me`, { method: "PATCH", body: input }));
}
export async function fetchAddresses(): Promise<Address[]> {
  const data = await apiFetch<{ items: unknown }>(`/me/addresses`);
  return z.array(addressSchema).parse(data.items);
}
export async function createAddress(input: AddressInput): Promise<Address> {
  return addressSchema.parse(await apiFetch(`/me/addresses`, { method: "POST", body: input }));
}
export async function updateAddress(id: string, input: Partial<AddressInput>): Promise<Address> {
  return addressSchema.parse(await apiFetch(`/me/addresses/${id}`, { method: "PATCH", body: input }));
}
export async function deleteAddress(id: string): Promise<void> {
  await apiFetch(`/me/addresses/${id}`, { method: "DELETE" });
}
