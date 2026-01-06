import { Link } from "react-router-dom";
import { Building2, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background/80">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="font-display text-lg font-bold text-background">
                Flex Hostel
              </span>
            </Link>
            <p className="text-sm text-background/60">
              Premium student accommodation in Okitipupa, Ondo State. Your home away from home.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-background mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/okitipupa" className="text-sm text-background/60 hover:text-background transition-colors">
                  Our Building
                </Link>
              </li>
              <li>
                <Link to="/okitipupa/rooms" className="text-sm text-background/60 hover:text-background transition-colors">
                  View Rooms
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-background/60 hover:text-background transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-background mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-background/60">
                <MapPin className="h-4 w-4" />
                <span>Okitipupa, Ondo State</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-background/60">
                <Phone className="h-4 w-4" />
                <span>+234 800 123 4567</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-background/60">
                <Mail className="h-4 w-4" />
                <span>hello@flexhostel.com</span>
              </li>
            </ul>
          </div>

          {/* Expansion */}
          <div>
            <h4 className="font-display font-semibold text-background mb-4">Expanding Soon</h4>
            <p className="text-sm text-background/60 mb-3">
              Currently serving Okitipupa. More locations coming in 2026.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-background/10 px-3 py-1 text-xs text-background/60">
                Akure — Coming Soon
              </span>
              <span className="inline-flex items-center rounded-full bg-background/10 px-3 py-1 text-xs text-background/60">
                Ado-Ekiti — 2026
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-background/10 text-center">
          <p className="text-sm text-background/40">
            © {new Date().getFullYear()} Flex Hostel. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
