import { apiFetch } from "../client";
import { authResultSchema, otpRequestResultSchema, userSchema, type AuthResult, type User } from "@/lib/validation/schemas";

export async function requestOtp(phone: string, purpose = "login") {
  return otpRequestResultSchema.parse(
    await apiFetch(`/auth/otp/request`, { method: "POST", body: { phone, purpose }, retryOnAuthFail: false }),
  );
}
export async function verifyOtp(phone: string, code: string, fullName?: string): Promise<AuthResult> {
  return authResultSchema.parse(
    await apiFetch(`/auth/otp/verify`, { method: "POST", body: { phone, code, fullName }, retryOnAuthFail: false }),
  );
}
export async function refresh(): Promise<AuthResult> {
  return authResultSchema.parse(await apiFetch(`/auth/refresh`, { method: "POST", retryOnAuthFail: false }));
}
export async function logout(): Promise<void> {
  await apiFetch(`/auth/logout`, { method: "POST", retryOnAuthFail: false });
}
export async function fetchMe(): Promise<User> {
  return userSchema.parse(await apiFetch(`/me`));
}
