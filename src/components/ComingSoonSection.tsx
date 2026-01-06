import { Link } from "react-router-dom";
import { ArrowRight, Bell, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ComingSoonSection = () => {
  return (
    <section className="py-24 bg-section">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Growing Across Nigeria
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            Our flagship building in Okitipupa is just the beginning. We're rapidly expanding to bring premium student living to more cities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
          {/* Active Building */}
          <Link
            to="/okitipupa"
            className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover-lift border border-border"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="inline-flex items-center text-sm font-medium text-success bg-success/10 rounded-full px-3 py-1">
                Live Now
              </span>
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-3">
              Okitipupa
            </h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Our flagship building with 50 premium self-contained rooms, 24/7 security, and modern amenities.
            </p>
            <div className="flex items-center gap-2 text-primary font-medium">
              Explore Rooms
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>

          {/* Coming Soon 1 */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-border">
            <div className="flex justify-between items-start mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="inline-flex items-center text-sm font-medium text-primary bg-primary/10 rounded-full px-3 py-1">
                Soon
              </span>
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-3">
              Akure
            </h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Premium student accommodation launching in 2026. Located in the heart of Ondo State's capital city.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary bg-primary/10 rounded-md px-2 py-1">
                Ondo State
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                Q2 2026
              </span>
            </div>
          </div>

          {/* Coming Soon 2 */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-border">
            <div className="flex justify-between items-start mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="inline-flex items-center text-sm font-medium text-success bg-success/10 rounded-full px-3 py-1">
                2026
              </span>
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-3">
              Ado-Ekiti
            </h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Expanding to serve students in Ekiti State with world-class facilities and campus proximity.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-success bg-success/10 rounded-md px-2 py-1">
                Ekiti State
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                Q4 2026
              </span>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="bg-white rounded-2xl p-12 max-w-2xl mx-auto text-center shadow-lg border border-border">
          <Bell className="h-8 w-8 text-primary mx-auto mb-4" />

          <h3 className="text-2xl font-bold text-foreground mb-3">
            Be the First to Know
          </h3>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Join our waitlist and get exclusive early access when we launch in new locations.
          </p>

          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 h-11 rounded-lg border border-input bg-background px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Button type="submit" size="default">
              Notify Me
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ComingSoonSection;
