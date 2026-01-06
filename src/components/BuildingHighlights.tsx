import { MapPin, DoorOpen, Shield } from "lucide-react";

interface BuildingHighlight {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const highlights: BuildingHighlight[] = [
  {
    icon: <MapPin className="h-6 w-6" />,
    title: "Prime Location",
    description: "Located in the heart of Okitipupa, close to major institutions",
  },
  {
    icon: <DoorOpen className="h-6 w-6" />,
    title: "50 Premium Rooms",
    description: "Self-contained rooms with modern amenities and private bathrooms",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "24/7 Security",
    description: "Round-the-clock security personnel and CCTV coverage",
  },
];

const BuildingHighlights = () => {
  return (
    <section className="py-16 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
            Why Choose Flex Hostel Okitipupa
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Our flagship building offers everything you need for comfortable student living
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {highlights.map((highlight, index) => (
            <div 
              key={index}
              className="bg-card rounded-xl p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                {highlight.icon}
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                {highlight.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {highlight.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BuildingHighlights;
