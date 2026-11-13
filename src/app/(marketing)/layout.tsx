import { Footer } from "@/features/landing/components/Footer";
import { Nav } from "@/features/landing/components/Nav";

/**
 * Every public page shares the homepage's navigation and footer. Each page
 * renders its own `<main id="main">` so the skip link lands on its content.
 */
export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Nav />
      {children}
      <Footer />
    </>
  );
}
