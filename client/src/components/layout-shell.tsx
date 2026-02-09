import { Navigation } from "./Navigation";

interface LayoutShellProps {
  children: React.ReactNode;
}

export function LayoutShell({ children }: LayoutShellProps) {
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-6">
        {children}
      </main>
    </div>
  );
}
