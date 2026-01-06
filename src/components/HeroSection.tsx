import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBuilding from "@/assets/hero-building.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroBuilding}
          alt="Flex Hostel Okitipupa Building"
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/60 to-foreground/40" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-20">
        <div className="max-w-2xl text-background animate-slide-up">
          <div className="inline-flex items-center gap-2 bg-background/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-medium text-background/90">
              Now accepting applications
            </span>
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            Premium Student Living in{" "}
            <span className="text-primary-glow">Okitipupa</span>
          </h1>

          <p className="text-lg md:text-xl text-background/80 mb-8 max-w-lg">
            50 self-contained rooms. 24/7 security. Modern amenities. Your home away from home.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="xl" variant="hero">
              <Link to="/okitipupa/rooms">
                Explore Available Rooms
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>

            <Button asChild size="xl" variant="hero-outline">
              <Link to="/okitipupa">
                Tour Our Building
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-background/30 flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-background/50 rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
