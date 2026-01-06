import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, User, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
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
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("name, role, photo_url")
          .eq("id", session.user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("name, role, photo_url")
          .eq("id", session.user.id)
          .single();
        setProfile(data);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getDashboardLink = () => {
    if (profile?.role === "landlord") return "/landlord";
    return "/dashboard";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-black/5 transition-all duration-300">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm group-hover:shadow-primary/50 transition-all duration-300">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground font-display">
            Flex Hostel
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { label: "Our Building", href: "/okitipupa" },
            { label: "Rooms", href: "/okitipupa/rooms" },
          ].map((item) => (
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
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-10 w-24 bg-stone-100 rounded-full animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-full h-11 pl-2 pr-4 gap-2 border border-stone-100 hover:bg-stone-50">
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
                  <ChevronDown className="h-4 w-4 text-stone-400" />
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
          ) : (
            <>
              <Link
                to="/auth"
                className="text-sm font-semibold text-foreground hover:text-primary transition-colors px-4"
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
        </div>
      </div>
    </header>
  );
};

export default Header;
