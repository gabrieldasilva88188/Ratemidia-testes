import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Layout do site público: Navbar + Footer. O painel admin (grupo "(admin)")
// tem layout próprio, sem eles, como no design.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
