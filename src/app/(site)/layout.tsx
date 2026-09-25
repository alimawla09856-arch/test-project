import { Backdrop } from "@/components/ui/Backdrop";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Backdrop />
      {children}
    </>
  );
}
