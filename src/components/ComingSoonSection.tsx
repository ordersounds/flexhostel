import { Link } from "react-router-dom";
import { ArrowRight, Bell, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ComingSoonSection = () => {
  return (
    <section className="py-24 lg:py-32 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">

        {/* Editorial Header */}
        <div className="max-w-4xl mx-auto mb-20 text-center animate-reveal-up">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Expansion</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold text-foreground mb-8 tracking-tighter leading-[0.95]">
            Growing Across <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-400">Nigeria.</span>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-light max-w-2xl mx-auto">
            Our flagship in Okitipupa is only the beginning. <br className="hidden md:block" />
            We're bringing premium student living to every major campus.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-24">
          {/* Active Building */}
          <Link
            to="/okitipupa"
            className="group relative bg-stone-50 rounded-[2.5rem] p-10 shadow-sm transition-all duration-700 hover:shadow-2xl hover:-translate-y-2 border border-stone-100 animate-reveal-up delay-100"
          >
            <div className="flex justify-between items-start mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 transition-transform group-hover:scale-110">
                <Building2 className="h-6 w-6" />
              </div>
              <Badge className="bg-primary text-white border-none px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
                Live Now
              </Badge>
            </div>

            <h3 className="text-3xl font-bold text-stone-900 mb-4 tracking-tighter">
              Okitipupa
            </h3>
            <p className="text-stone-500 mb-8 leading-relaxed font-light italic">
              "The flagship residence." 50 premium suites, elite security, and a vibrant community.
            </p>
            <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs group-hover:gap-3 transition-all">
              Explore Now
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>

          {/* Coming Soon 1 */}
          <div className="group relative bg-[#0a0a0a] rounded-[2.5rem] p-10 shadow-2xl transition-all duration-700 hover:-translate-y-2 border border-white/5 animate-reveal-up delay-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full" />
            <div className="flex justify-between items-start mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-stone-400 border border-white/10 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                <Building2 className="h-6 w-6" />
              </div>
              <Badge className="bg-stone-800 text-stone-400 border-none px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                Soon
              </Badge>
            </div>

            <h3 className="text-3xl font-bold text-white mb-4 tracking-tighter">
              Akure
            </h3>
            <p className="text-stone-400 mb-8 leading-relaxed font-light">
              Premium student accommodation launching in the heart of Ondo State's capital.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-md">
                Ondo State
              </span>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                Q2 2026
              </span>
            </div>
          </div>

          {/* Coming Soon 2 */}
          <div className="group relative bg-white rounded-[2.5rem] p-10 shadow-sm transition-all duration-700 hover:shadow-xl hover:-translate-y-2 border border-stone-100 animate-reveal-up delay-300">
            <div className="flex justify-between items-start mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <Building2 className="h-6 w-6" />
              </div>
              <Badge className="bg-stone-100 text-stone-400 border-none px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                2026
              </Badge>
            </div>

            <h3 className="text-3xl font-bold text-stone-900 mb-4 tracking-tighter">
              Ado-Ekiti
            </h3>
            <p className="text-stone-500 mb-8 leading-relaxed font-light">
              Serving the academic heart of Ekiti State with world-class facilities.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-stone-900 uppercase tracking-widest bg-stone-100 px-3 py-1 rounded-md">
                Ekiti State
              </span>
              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                Q4 2026
              </span>
            </div>
          </div>
        </div>

        {/* Newsletter / Waitlist */}
        <div className="animate-reveal-up delay-300">
          <div className="relative overflow-hidden rounded-[3rem] p-10 md:p-16 text-center bg-stone-50 border border-stone-200 shadow-xl max-w-4xl mx-auto">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/5 blur-[80px] rounded-full" />

            <div className="relative z-10">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-8">
                <Bell className="h-8 w-8 text-primary" />
              </div>

              <h3 className="font-display text-3xl md:text-5xl font-bold text-stone-900 mb-4 tracking-tighter">
                Be the First to Know
              </h3>
              <p className="text-stone-500 text-lg md:text-xl font-light mb-10 max-w-lg mx-auto leading-relaxed">
                Join our exclusive waitlist and get first dibs on launches in new locations.
              </p>

              <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto relative group">
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="flex-1 h-16 rounded-full border border-stone-200 bg-white px-8 text-base placeholder:text-stone-400 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                />
                <Button type="submit" size="lg" className="h-16 px-10 rounded-full text-base font-bold bg-primary text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                  Notify Me
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComingSoonSection;
