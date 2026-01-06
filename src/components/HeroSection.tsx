import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, ShieldCheck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBuilding from "@/assets/hero-building.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 pb-12 lg:pt-0 lg:pb-0 overflow-hidden bg-background">
      {/* Background Decor - Subtle Apple-like gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left: Typography Content */}
          <div className="max-w-2xl space-y-8 animate-fade-in">
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-2 bg-secondary/50 border border-primary/10 rounded-full px-4 py-1.5 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                Applications Open for 2026/27
              </span>
            </div>

            <h1 className="font-display text-5xl md:text-6xl lg:text-[5rem] font-bold tracking-tight leading-[0.95] text-foreground">
              Student living, <br />
              <span className="text-primary">reimagined.</span>
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
              Experience the new standard of living in Okitipupa. 50 premium self-contained suites designed for focus, comfort, and community.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button asChild size="lg" className="h-14 px-8 rounded-full text-base shadow-lg hover:shadow-primary/25 transition-all duration-300">
                <Link to="/okitipupa/rooms">
                  Explore Rooms
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>

              <Button asChild size="lg" variant="outline" className="h-14 px-8 rounded-full text-base border-2 hover:bg-secondary/50">
                <Link to="/okitipupa">
                  View Building
                </Link>
              </Button>
            </div>

            {/* Trust Indicators - Minimal */}
            <div className="pt-8 flex items-center gap-8 border-t border-border/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 rounded-full text-primary">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground">24/7 Security</span>
                  <span className="text-xs text-muted-foreground">Always safe</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 rounded-full text-blue-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground">Prime Location</span>
                  <span className="text-xs text-muted-foreground">Campus nearby</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Hero Image - Magazine Style */}
          <div className="relative lg:h-[800px] flex items-center justify-center animate-slide-up">
            <div className="relative w-full aspect-[4/5] lg:aspect-auto lg:h-[90%] rounded-[2rem] overflow-hidden shadow-2xl border border-white/50 group">
              <img
                src={heroBuilding}
                alt="Modern Student Housing"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />

              {/* Floating Glass Card in Image - Apple Style */}
              <div className="absolute bottom-6 left-6 right-6 p-6 glass rounded-[1.5rem] border-white/20 shadow-xl backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-black/60 uppercase tracking-wider mb-1">Starting from</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-black tracking-tight rounded-md">₦450k</span>
                      <span className="text-sm text-black/60 font-medium">/year</span>
                    </div>
                  </div>
                  <div className="h-10 w-10 bg-black text-white rounded-full flex items-center justify-center">
                    <ArrowRight className="w-5 h-5 -rotate-45" />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
