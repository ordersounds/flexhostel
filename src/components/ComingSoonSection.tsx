import { Link } from "react-router-dom";
import { ArrowRight, Bell, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const ComingSoonSection = () => {
  return (
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-primary mb-3">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">
              Expanding
            </span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
            Growing Across Nigeria
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Our flagship building in Okitipupa is just the beginning. More locations coming soon.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Active Building */}
          <Link 
            to="/okitipupa"
            className="group relative bg-card rounded-xl p-6 shadow-sm border border-border/50 hover:shadow-lg transition-all overflow-hidden"
          >
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success bg-success/10 rounded-full px-2 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                Live
              </span>
            </div>
            <h3 className="font-display text-xl font-bold text-foreground mb-2">
              Okitipupa
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Our flagship building with 50 premium rooms
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
              Explore Rooms
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>

          {/* Coming Soon 1 */}
          <div className="relative bg-card rounded-xl p-6 shadow-sm border border-border/50 opacity-75">
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center text-xs font-medium text-muted-foreground bg-muted rounded-full px-2 py-1">
                Coming Soon
              </span>
            </div>
            <h3 className="font-display text-xl font-bold text-foreground/70 mb-2">
              Akure
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Premium student accommodation launching 2026
            </p>
            <span className="text-sm text-muted-foreground">
              Ondo State
            </span>
          </div>

          {/* Coming Soon 2 */}
          <div className="relative bg-card rounded-xl p-6 shadow-sm border border-border/50 opacity-60">
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center text-xs font-medium text-muted-foreground bg-muted rounded-full px-2 py-1">
                2026
              </span>
            </div>
            <h3 className="font-display text-xl font-bold text-foreground/60 mb-2">
              Ado-Ekiti
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Expanding to serve more students
            </p>
            <span className="text-sm text-muted-foreground">
              Ekiti State
            </span>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 bg-primary/5 rounded-2xl p-8 max-w-2xl mx-auto text-center">
          <Bell className="h-8 w-8 text-primary mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold text-foreground mb-2">
            Be the First to Know
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Get notified when we launch in new locations
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 h-11 rounded-lg border border-input bg-background px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button type="submit">
              Notify Me
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ComingSoonSection;
