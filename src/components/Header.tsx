import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-bold text-foreground leading-tight">
              Flex Hostel
            </span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Okitipupa
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/okitipupa" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Our Building
          </Link>
          <Link 
            to="/okitipupa/rooms" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Rooms
          </Link>
          <Link 
            to="/about" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link 
            to="/auth"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </Link>
          <Link 
            to="/okitipupa/rooms"
            className="hidden sm:inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Explore Rooms
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
