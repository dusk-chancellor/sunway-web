"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchNasiyaStatus, fetchNasiyaQuote } from "@/lib/api/resources/nasiya";
import { syncOrderPayment } from "@/lib/api/resources/orders";

/**
 * Installment queries. Every one of these becomes a call to Uzum on the
 * backend, so they are never refetched on focus and are only enabled once the
 * customer has actually chosen installments at checkout.
 */

export function useNasiyaStatus(enabled: boolean) {
  return useQuery({
    queryKey: ["nasiya", "status"],
    queryFn: fetchNasiyaStatus,
    enabled,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

// The quote prices the current cart, so it is keyed on the cart's contents and
// invalidated whenever the cart changes.
export function useNasiyaQuote(enabled: boolean, cartKey: string) {
  return useQuery({
    queryKey: ["nasiya", "quote", cartKey],
    queryFn: fetchNasiyaQuote,
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

// Re-reads an order's payment state from its gateway. For installments this is
// also what confirms a signed contract, so it is a mutation, not a query — it
// changes state on purpose.
export function useSyncPayment(number: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => syncOrderPayment(number),
    onSuccess: (order) => {
      qc.setQueryData(["order", number], order);
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
