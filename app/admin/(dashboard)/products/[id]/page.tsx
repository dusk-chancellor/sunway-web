import { redirect } from "next/navigation";

// Product editing happens inline via the modal on the list page. This nested
// route exists for deep links; it simply forwards to the products list.
export default async function AdminProductEditRedirect() {
  redirect("/admin/products");
}
