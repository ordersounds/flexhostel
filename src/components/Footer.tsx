import { Link } from "react-router-dom";
import { Building2, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-stone-950 text-white relative overflow-hidden">
      {/* Subtle Teal Glow in Corner */}
      <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8">

          {/* Brand Mark (Spans more columns) */}
          <div className="md:col-span-12 lg:col-span-5 space-y-8">
            <Link to="/" className="flex items-center gap-4 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 transition-transform group-hover:scale-110">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-display font-bold tracking-tighter leading-none">
                  Flex Hostel
                </span>
                <span className="text-xs font-bold text-primary uppercase tracking-[0.2em] mt-1">
                  Living Redefined
                </span>
              </div>
            </Link>

            <p className="text-stone-400 text-lg font-light leading-relaxed max-w-md">
              Okitipupa's first premium student residence. We combine modern architecture with smart living to create the ultimate study environment.
            </p>

            <div className="flex items-center gap-6 pt-2">
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white tracking-tight">4.9/5</span>
                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-widest">Student Rating</span>
              </div>
              <div className="w-px h-8 bg-stone-800" />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white tracking-tight">500+</span>
                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-widest">Global Community</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-4 lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-8 items-center flex gap-2">
              <div className="w-1 h-1 rounded-full bg-primary" />
              Navigation
            </h4>
            <ul className="space-y-4">
              <li>
                <Link to="/okitipupa" className="text-stone-400 hover:text-primary transition-colors font-medium">
                  The Building
                </Link>
              </li>
              <li>
                <Link to="/okitipupa/rooms" className="text-stone-400 hover:text-primary transition-colors font-medium">
                  Available Suites
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-stone-400 hover:text-primary transition-colors font-medium">
                  Our Story
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-stone-400 hover:text-primary transition-colors font-medium">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-4 lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-8 items-center flex gap-2">
              <div className="w-1 h-1 rounded-full bg-primary" />
              Connect
            </h4>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-stone-500 flex-shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="text-stone-400 text-sm leading-relaxed">
                  Broad Street, <br /> Okitipupa, Ondo
                </span>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-stone-500 flex-shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <span className="text-stone-400 text-sm">+234 800 123 4567</span>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-stone-500 flex-shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <span className="text-stone-400 text-sm">hello@flexhostel.com</span>
              </li>
            </ul>
          </div>

          {/* Locations */}
          <div className="md:col-span-4 lg:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-8 items-center flex gap-2">
              <div className="w-1 h-1 rounded-full bg-primary" />
              Expansion
            </h4>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-stone-900/50 border border-stone-800 group hover:border-primary/20 transition-colors">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-white">Akure</span>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Soon</span>
                </div>
                <p className="text-xs text-stone-500 italic">Flagship 2.0 launching 2026</p>
              </div>
              <div className="p-4 rounded-2xl bg-stone-900/50 border border-stone-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-white">Ado-Ekiti</span>
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Planned</span>
                </div>
                <p className="text-xs text-stone-500">EKSU Proximity suites</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-24 pt-10 border-t border-stone-900/80">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4 order-2 md:order-1">
              <p className="text-stone-600 text-xs font-medium uppercase tracking-widest font-display">
                © {new Date().getFullYear()} Flex Hostel Residence
              </p>
            </div>

            <div className="flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest text-stone-500 order-1 md:order-2">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/safety" className="hover:text-white transition-colors">Safety</Link>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ml-2" />
              <span className="text-stone-600">All Systems Online</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
