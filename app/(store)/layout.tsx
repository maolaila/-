import { StoreFooter } from "@/components/store/footer";
import { StoreHeader } from "@/components/store/header";

export const dynamic = "force-dynamic";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StoreHeader />
      <main>{children}</main>
      <StoreFooter />
    </>
  );
}
