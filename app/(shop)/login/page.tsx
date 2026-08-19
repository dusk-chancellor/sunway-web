import type { Metadata } from "next";
import { OtpForm } from "@/components/storefront/OtpForm";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return <OtpForm mode="login" />;
}
