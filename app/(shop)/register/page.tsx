import type { Metadata } from "next";
import { OtpForm } from "@/components/storefront/OtpForm";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage() {
  return <OtpForm mode="register" />;
}
