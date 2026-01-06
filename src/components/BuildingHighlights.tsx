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
    <section className="py-24 bg-accent-subtle">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Choose Flex Hostel Okitipupa
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            Our flagship building offers everything you need for comfortable student living with modern amenities and prime location
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {highlights.map((highlight, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover-lift border border-border"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-subtle text-primary mb-6">
                {highlight.icon}
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {highlight.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {highlight.description}
              </p>
            </div>
          ))}
        </div>

        {/* Trust metrics */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-border">
            <div className="text-2xl font-bold text-primary mb-1">4.9★</div>
            <div className="text-sm text-muted-foreground">Student Rating</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-border">
            <div className="text-2xl font-bold text-primary mb-1">50</div>
            <div className="text-sm text-muted-foreground">Premium Rooms</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-border">
            <div className="text-2xl font-bold text-success mb-1">24/7</div>
            <div className="text-sm text-muted-foreground">Security</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-border">
            <div className="text-2xl font-bold text-primary mb-1">Prime</div>
            <div className="text-sm text-muted-foreground">Location</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BuildingHighlights;
