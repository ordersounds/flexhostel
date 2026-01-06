import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBuilding from "@/assets/hero-building.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-background">

      {/* 1. Immersive Background Image (Right side bleeding, Mobile Top) */}
      <div className="absolute top-0 right-0 w-full lg:w-[55%] h-[50vh] lg:h-full z-0">
        <img
          src={heroBuilding}
          alt="Modern Student Housing"
          className="w-full h-full object-cover object-center"
        />
        {/* Gradient Overlay for Text Readability on Mobile/Tablet */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background lg:bg-gradient-to-l lg:from-transparent lg:via-background/20 lg:to-background" />
      </div>

      <div className="container mx-auto px-6 relative z-10 pt-[40vh] lg:pt-0">
        <div className="max-w-4xl">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md border border-black/5 rounded-full px-4 py-1.5 mb-8 shadow-sm animate-reveal-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-foreground/80">
              Applications Open 2026
            </span>
          </div>

          {/* Headline - Editorial Style */}
          <h1 className="font-display text-5xl md:text-7xl lg:text-[6rem] font-bold tracking-tighter leading-[0.9] text-foreground mb-8 animate-reveal-up delay-100">
            Student living, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-400">
              perfected.
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-xl mb-10 animate-reveal-up delay-200 font-light">
            Forget everything you know about hostels. <br className="hidden md:block" />
            Welcome to Okitipupa's first standard luxury student residence.
          </p>

          {/* CTA Group */}
          <div className="flex flex-col sm:flex-row gap-4 animate-reveal-up delay-300 items-start">
            <Button asChild size="lg" className="h-14 px-8 rounded-full text-base font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/okitipupa/rooms">
                Reserve Your Room
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>

            <Button asChild variant="ghost" size="lg" className="h-14 px-8 rounded-full text-base hover:bg-secondary/50 group">
              <Link to="/tour">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                  <Play className="w-3.5 h-3.5 fill-primary text-primary ml-0.5" />
                </div>
                Watch Tour
              </Link>
            </Button>
          </div>

        </div>

        {/* Floating "Card" - The 10x Detail that bridges the gap */}
        <div className="hidden lg:block absolute bottom-12 right-12 animate-reveal-up delay-300">
          <div className="glass p-6 rounded-3xl border-white/40 shadow-2xl backdrop-blur-xl max-w-xs cursor-pointer hover:scale-[1.02] transition-transform duration-500">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-black/50">Starting From</span>
              <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wide rounded-full">Available Now</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-foreground tracking-tighter">₦450k</span>
              <span className="text-sm font-medium text-black/60">/year</span>
            </div>
            <div className="mt-4 pt-4 border-t border-black/5 flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border border-white" />
                ))}
              </div>
              <span className="text-xs font-medium text-black/60">3 students booked today</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
