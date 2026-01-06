import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  Snowflake, 
  Bath, 
  Lamp, 
  Wifi, 
  DoorOpen,
  User,
  Phone,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import roomInterior from "@/assets/room-interior.jpg";

type RoomStatus = "available" | "pending" | "occupied";

const amenityIcons: Record<string, React.ReactNode> = {
  "Air Conditioning": <Snowflake className="h-5 w-5" />,
  "Private Bathroom": <Bath className="h-5 w-5" />,
  "Reading Lamp": <Lamp className="h-5 w-5" />,
  "WiFi Access": <Wifi className="h-5 w-5" />,
  "Study Desk": <DoorOpen className="h-5 w-5" />,
};

const RoomDetail = () => {
  const { roomName } = useParams();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Sample room data
  const room = {
    id: "1",
    room_name: roomName?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Alabama",
    price: 450000,
    description: "A comfortable and modern self-contained room perfect for focused students. Features natural lighting, ample storage space, and a private bathroom.",
    amenities: ["Air Conditioning", "Private Bathroom", "Study Desk", "Wardrobe", "Reading Lamp", "WiFi Access"],
    status: "available" as RoomStatus,
    gender: "any",
    images: [roomInterior, roomInterior, roomInterior],
    agent: {
      name: "John Adeyemi",
      phone: "+234 801 234 5678",
    },
  };

  const formattedPrice = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(room.price);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % room.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + room.images.length) % room.images.length);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        {/* Image Gallery */}
        <section className="relative h-[50vh] min-h-[400px] bg-muted">
          <img
            src={room.images[currentImageIndex]}
            alt={`Room ${room.room_name}`}
            className="w-full h-full object-cover"
          />
          
          {/* Navigation Arrows */}
          {room.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {room.images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentImageIndex ? "bg-background" : "bg-background/50"
                }`}
              />
            ))}
          </div>

          {/* Back Button */}
          <Link 
            to="/okitipupa/rooms"
            className="absolute top-20 left-4 inline-flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 text-sm font-medium hover:bg-background transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Rooms
          </Link>
        </section>

        {/* Content */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Flex Hostel — Okitipupa Building
                      </p>
                      <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                        Room {room.room_name}
                      </h1>
                    </div>
                    <Badge variant={room.status} className="text-sm">
                      {room.status === "available" ? "Available" : room.status === "pending" ? "Pending" : "Occupied"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {room.description}
                  </p>
                </div>

                {/* Amenities */}
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                    Room Amenities
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {room.amenities.map((amenity) => (
                      <div 
                        key={amenity}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="text-primary">
                          {amenityIcons[amenity] || <DoorOpen className="h-5 w-5" />}
                        </div>
                        <span className="text-sm font-medium text-foreground">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Agent Info */}
                <div className="bg-muted/50 rounded-xl p-6">
                  <h2 className="font-display text-lg font-semibold text-foreground mb-4">
                    Your Assigned Agent
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{room.agent.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {room.agent.phone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 bg-card rounded-xl p-6 shadow-md border border-border/50">
                  <div className="text-center mb-6">
                    <p className="text-sm text-muted-foreground mb-1">Yearly Rent</p>
                    <p className="font-display text-3xl font-bold text-foreground">
                      {formattedPrice}
                    </p>
                    <p className="text-sm text-muted-foreground">/year</p>
                  </div>

                  <div className="space-y-4 mb-6 text-sm">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Tenancy Duration</span>
                      <span className="font-medium">12 months</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Gender</span>
                      <span className="font-medium capitalize">{room.gender === "any" ? "Any" : room.gender}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Building</span>
                      <span className="font-medium">Okitipupa</span>
                    </div>
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full" 
                    disabled={room.status !== "available"}
                    onClick={() => navigate(`/apply/${room.room_name.toLowerCase().replace(" ", "-")}`)}
                  >
                    {room.status === "available" ? "Apply Now" : "Not Available"}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Full payment required before move-in
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default RoomDetail;
