import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import { Link, useLocation } from "wouter";
import { 
  LogOut, 
  BookOpen, 
  Users, 
  Settings, 
  PenTool,
  Menu,
  X,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Navigation() {
  const { user, logout } = useAuth();
  const { data: settings } = useSettings();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const schoolName = settings?.schoolName || "School Diary";
  const schoolInitial = schoolName.charAt(0).toUpperCase();

  const NavLink = ({ href, icon: Icon, children, mobile = false }: { href: string; icon: any; children: React.ReactNode; mobile?: boolean }) => {
    const isActive = location === href;
    if (mobile) {
      return (
        <Link href={href}>
          <div 
            className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-3 cursor-pointer transition-all duration-300 ${
              isActive ? "text-primary scale-110" : "text-muted-foreground opacity-70"
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isActive ? "bg-primary/10" : "bg-transparent"}`}>
              <Icon className={`w-6 h-6 transition-transform ${isActive ? "stroke-[2.5px]" : "stroke-[2px]"}`} />
            </div>
            <span className={`text-[11px] font-bold tracking-tight ${isActive ? "text-primary" : "text-muted-foreground"}`}>{children}</span>
          </div>
        </Link>
      );
    }
    return (
      <Link href={href}>
        <div 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
            isActive 
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-medium" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          onClick={() => setIsOpen(false)}
        >
          <Icon className="w-5 h-5" />
          <span>{children}</span>
        </div>
      </Link>
    );
  };

  const navItems = user.role === "admin" ? [
    { href: "/admin/homework", icon: BookOpen, label: "Homework" },
    { href: "/admin/teachers", icon: Users, label: "Teachers" },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
  ] : [
    { href: "/teacher/entry", icon: PenTool, label: "Homework Entry" },
  ];

  return (
    <>
      {/* Top Navbar for Brand/Desktop */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
              {schoolInitial}
            </div>
            <span className="font-bold text-lg">{schoolName} Diary</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button 
                  variant={location === item.href ? "default" : "ghost"}
                  className="gap-2"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
            <div className="w-px h-6 bg-border mx-2" />
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => logout()}>
              <LogOut className="w-4 h-4 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>

          {/* Mobile Right Actions */}
          <div className="md:hidden flex items-center gap-2">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80%] sm:w-[385px]">
                <div className="flex flex-col h-full gap-6 mt-8">
                  <div className="flex items-center gap-3 px-2">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{user.name || user.username}</p>
                      <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {navItems.map((item) => (
                      <NavLink key={item.href} href={item.href} icon={item.icon}>
                        {item.label}
                      </NavLink>
                    ))}
                  </div>

                  <div className="mt-auto pb-8 space-y-2">
                    <div className="flex items-center justify-between px-2 py-2 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium">Theme</span>
                      <ThemeToggle />
                    </div>
                    <Button 
                      variant="destructive" 
                      className="w-full justify-start gap-3 h-12"
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                      }}
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Bottom Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around h-20 px-2">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} icon={item.icon} mobile>
              {item.label}
            </NavLink>
          ))}
          <button 
            onClick={() => setIsOpen(true)}
            className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-3 cursor-pointer transition-colors text-muted-foreground`}
          >
            <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold tracking-tight">Profile</span>
          </button>
        </div>
      </nav>
    </>
  );
}
