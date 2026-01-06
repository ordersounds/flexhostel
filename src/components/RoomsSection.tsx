import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Filter } from "lucide-react";
import RoomCard from "@/components/RoomCard";
import { supabase } from "@/integrations/supabase/client";
import roomInterior from "@/assets/room-interior.jpg";

type RoomStatus = "available" | "pending" | "occupied";
type RoomGender = "male" | "female" | "any";

interface Room {
  id: string;
  room_name: string;
  price: number;
  cover_image_url: string | null;
  amenities: string[];
  status: RoomStatus;
  gender: RoomGender;
  building: {
    name: string;
    slug: string;
  };
}

// Sample rooms for demo - will be replaced with real data
const sampleRooms: Room[] = [
  {
    id: "1",
    room_name: "Alabama",
    price: 450000,
    cover_image_url: roomInterior,
    amenities: ["Air Conditioning", "Private Bathroom", "Study Desk", "Wardrobe", "Reading Lamp"],
    status: "available",
    gender: "any",
    building: { name: "Okitipupa Building", slug: "okitipupa" },
  },
  {
    id: "2",
    room_name: "Alaska",
    price: 450000,
    cover_image_url: roomInterior,
    amenities: ["Air Conditioning", "Private Bathroom", "Study Desk", "WiFi Access"],
    status: "available",
    gender: "male",
    building: { name: "Okitipupa Building", slug: "okitipupa" },
  },
  {
    id: "3",
    room_name: "Arizona",
    price: 450000,
    cover_image_url: roomInterior,
    amenities: ["Air Conditioning", "Private Bathroom", "Wardrobe"],
    status: "pending",
    gender: "female",
    building: { name: "Okitipupa Building", slug: "okitipupa" },
  },
  {
    id: "4",
    room_name: "Arkansas",
    price: 450000,
    cover_image_url: roomInterior,
    amenities: ["Air Conditioning", "Private Bathroom", "Study Desk", "Power Backup"],
    status: "available",
    gender: "any",
    building: { name: "Okitipupa Building", slug: "okitipupa" },
  },
  {
    id: "5",
    room_name: "California",
    price: 480000,
    cover_image_url: roomInterior,
    amenities: ["Air Conditioning", "Private Bathroom", "Study Desk", "Window View", "Wardrobe"],
    status: "available",
    gender: "any",
    building: { name: "Okitipupa Building", slug: "okitipupa" },
  },
  {
    id: "6",
    room_name: "Colorado",
    price: 450000,
    cover_image_url: roomInterior,
    amenities: ["Air Conditioning", "Private Bathroom", "Ceiling Fan"],
    status: "occupied",
    gender: "male",
    building: { name: "Okitipupa Building", slug: "okitipupa" },
  },
];

const RoomsSection = () => {
  const [filter, setFilter] = useState<"all" | "available">("all");
  const [rooms, setRooms] = useState<Room[]>(sampleRooms);
  const [loading, setLoading] = useState(false);

  // Fetch rooms from database
  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("rooms")
          .select(`
            id,
            room_name,
            price,
            cover_image_url,
            amenities,
            status,
            gender,
            buildings (
              name,
              slug
            )
          `)
          .limit(6);

        if (error) throw error;

        if (data && data.length > 0) {
          const formattedRooms = data.map((room) => ({
            id: room.id,
            room_name: room.room_name,
            price: Number(room.price),
            cover_image_url: room.cover_image_url,
            amenities: (room.amenities as string[]) || [],
            status: room.status as RoomStatus,
            gender: room.gender as RoomGender,
            building: {
              name: (room.buildings as { name: string; slug: string })?.name || "Okitipupa Building",
              slug: (room.buildings as { name: string; slug: string })?.slug || "okitipupa",
            },
          }));
          setRooms(formattedRooms);
        }
      } catch (error) {
        console.log("Using sample rooms data");
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const filteredRooms = filter === "available" 
    ? rooms.filter(room => room.status === "available")
    : rooms;

  return (
    <section className="py-24 bg-gradient-to-b from-background to-primary/5 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-3">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-success rounded-full blur-2xl" />
      </div>

      <div className="container mx-auto px-6 relative">
        {/* Enhanced Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
            <span className="text-sm font-semibold text-primary">🏠 Premium Rooms</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-black text-foreground mb-4">
            Choose Your Perfect Room
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            Browse our selection of premium self-contained rooms, each designed for student comfort and convenience
          </p>
        </div>

        {/* Clean Filter */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <Filter className="h-5 w-5 text-primary" />
          <div className="flex bg-white rounded-lg p-1 shadow-sm border border-border">
            <button
              onClick={() => setFilter("all")}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                filter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent-subtle"
              }`}
            >
              All Rooms ({rooms.length})
            </button>
            <button
              onClick={() => setFilter("available")}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                filter === "available"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent-subtle"
              }`}
            >
              Available ({rooms.filter(r => r.status === "available").length})
            </button>
          </div>
        </div>

        {/* Enhanced Room Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredRooms.map((room, index) => (
            <div
              key={room.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <RoomCard
                id={room.id}
                roomName={room.room_name}
                buildingName={room.building.name}
                buildingSlug={room.building.slug}
                price={room.price}
                coverImage={room.cover_image_url || roomInterior}
                amenities={room.amenities}
                status={room.status}
                gender={room.gender}
              />
            </div>
          ))}
        </div>

        {/* Enhanced CTA */}
        <div className="text-center">
          <div className="glass-card rounded-2xl p-8 max-w-lg mx-auto shadow-xl border border-primary/10">
            <h3 className="font-display text-xl font-bold text-foreground mb-2">
              Can't find your perfect room?
            </h3>
            <p className="text-muted-foreground mb-6">
              Browse all 50 rooms with advanced filters and virtual tours
            </p>
            <Button asChild size="lg" variant="primary">
              <Link to="/okitipupa/rooms">
                View All Rooms
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RoomsSection;
