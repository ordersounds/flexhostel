import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-black/5 transition-all duration-300">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        {/* Logo - Cleaner */}
        <Link to="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm group-hover:shadow-primary/50 transition-all duration-300">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground font-display">
            Flex Hostel
          </span>
        </Link>

        {/* Desktop Nav - Centered & Pill shape if we wanted, but simple text is cleaner for Airbnb style */}
        <nav className="hidden md:flex items-center gap-1">
          {["Our Building", "Rooms", "Amenities", "Contact"].map((item) => (
            <Link
              key={item}
              to={item === "Rooms" ? "/okitipupa/rooms" : "/okitipupa"}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-full transition-all"
            >
              {item}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
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
        </div>
      </div>
    </header>
  );
};

export default Header;
