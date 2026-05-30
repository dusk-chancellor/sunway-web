import { Header } from "@/components/storefront/Header";
import { CategoryNav } from "@/components/storefront/CategoryNav";
import { Footer } from "@/components/storefront/Footer";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { MobileNav } from "@/components/storefront/MobileNav";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <CategoryNav />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <MobileNav />
    </>
  );
}
