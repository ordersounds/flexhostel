import { Link } from "react-router-dom";
import { Building2, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-background">
                  Flex Hostel
                </span>
                <span className="text-xs font-medium text-primary uppercase tracking-wide">
                  Okitipupa
                </span>
              </div>
            </Link>
            <p className="text-background/70 leading-relaxed">
              Premium student accommodation in Okitipupa, Ondo State. Your home away from home with modern amenities and 24/7 security.
            </p>
            {/* Social proof */}
            <div className="flex items-center gap-4 text-sm text-background/60">
              <span>⭐ 4.9/5 Rating</span>
              <span>•</span>
              <span>500+ Happy Students</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-background mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/okitipupa" className="text-background/70 hover:text-primary transition-colors">
                  Our Building
                </Link>
              </li>
              <li>
                <Link to="/okitipupa/rooms" className="text-background/70 hover:text-primary transition-colors">
                  View Rooms
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-background/70 hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-background mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-background/70">
                <MapPin className="h-4 w-4" />
                <span>Okitipupa, Ondo State</span>
              </li>
              <li className="flex items-center gap-3 text-background/70">
                <Phone className="h-4 w-4" />
                <span>+234 800 123 4567</span>
              </li>
              <li className="flex items-center gap-3 text-background/70">
                <Mail className="h-4 w-4" />
                <span>hello@flexhostel.com</span>
              </li>
            </ul>
          </div>

          {/* Expansion */}
          <div>
            <h4 className="font-semibold text-background mb-4">Growing Fast</h4>
            <p className="text-background/70 mb-4 leading-relaxed">
              Expanding across Nigeria. More premium locations coming in 2026.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-primary/20 px-3 py-1 text-sm font-medium text-primary">
                Akure — Soon
              </span>
              <span className="inline-flex items-center rounded-full bg-success/20 px-3 py-1 text-sm font-medium text-success">
                Ado-Ekiti — 2026
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-background/20 text-center">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-background/50 text-sm">
              © {new Date().getFullYear()} Flex Hostel. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-background/50">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Support</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
