import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import type { OrderStatus, PaymentStatus } from "@/lib/validation/schemas";

const orderTone: Record<OrderStatus, "navy" | "ok" | "warn" | "bad" | "neutral"> = {
  pending: "warn",
  confirmed: "navy",
  in_delivery: "navy",
  delivered: "ok",
  cancelled: "bad",
};
const payTone: Record<PaymentStatus, "navy" | "ok" | "warn" | "bad" | "neutral"> = {
  pending: "warn",
  paid: "ok",
  failed: "bad",
  refunded: "neutral",
  cod_pending: "warn",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const t = useTranslations("status");
  return <Badge tone={orderTone[status]}>{t(status)}</Badge>;
}
export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const t = useTranslations("status");
  return <Badge tone={payTone[status]}>{t(status)}</Badge>;
}
