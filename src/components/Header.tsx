import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, User, LogOut, LayoutDashboard, ChevronDown, Menu, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const getDashboardLink = () => {
    if (profile?.role === "landlord") return "/landlord";
    return "/dashboard";
  };

  const navLinks = [
    { label: "Our Building", href: "/okitipupa" },
    { label: "Rooms", href: "/okitipupa/rooms" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-black/5 transition-all duration-300">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm group-hover:shadow-primary/50 transition-all duration-300">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground font-display">
            Flex Hostel
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-full transition-all"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-10 w-20 bg-stone-100 rounded-full animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2">
              {/* Message Indicator */}
              <Link to="/dashboard?tab=messages">
                <Button variant="ghost" size="icon" className="rounded-full h-11 w-11 border border-stone-100 hover:bg-stone-50 text-stone-400 hover:text-primary transition-colors relative">
                  <MessageSquare className="h-5 w-5" />
                  {/* Optional: Add unread dot here if we have that state later */}
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full h-11 pl-2 pr-3 sm:pr-4 gap-2 border border-stone-100 hover:bg-stone-50">
                    <div className="h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center overflow-hidden border-2 border-white">
                      {profile?.photo_url ? (
                        <img src={profile.photo_url} alt={profile.name} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-4 w-4 text-stone-400" />
                      )}
                    </div>
                    <span className="text-sm font-semibold text-stone-700 hidden sm:block">
                      {profile?.name?.split(" ")[0] || "Account"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-stone-400 hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-stone-100 shadow-xl">
                  <DropdownMenuLabel className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                    {profile?.role || "Member"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-stone-100" />
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer h-11">
                    <Link to={getDashboardLink()} className="flex items-center gap-3">
                      <LayoutDashboard className="h-4 w-4 text-primary" />
                      <span className="font-medium">{profile?.role === "landlord" ? "Landlord Portal" : "Dashboard"}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="rounded-xl cursor-pointer h-11 text-red-500 focus:text-red-500 focus:bg-red-50">
                    <LogOut className="h-4 w-4 mr-3" />
                    <span className="font-medium">Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <>
              <Link
                to="/auth"
                className="text-sm font-semibold text-foreground hover:text-primary transition-colors px-3"
              >
                Sign In
              </Link>
              <Button asChild className="hidden sm:inline-flex rounded-full px-6 shadow-sm hover:shadow-md">
                <Link to="/okitipupa/rooms">
                  Book Now
                </Link>
              </Button>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center h-10 w-10 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-stone-100 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <nav className="container mx-auto px-6 py-6 space-y-2">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-base font-medium text-stone-700 hover:text-primary hover:bg-stone-50 rounded-xl transition-all"
              >
                {item.label}
              </Link>
            ))}

            <div className="pt-4 border-t border-stone-100 mt-4">
              {user ? (
                <>
                  <Link
                    to={getDashboardLink()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-base font-medium text-stone-700 hover:text-primary hover:bg-stone-50 rounded-xl transition-all"
                  >
                    <LayoutDashboard className="h-5 w-5 text-primary" />
                    {profile?.role === "landlord" ? "Landlord Portal" : "Dashboard"}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all"
                >
                  Sign In
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
