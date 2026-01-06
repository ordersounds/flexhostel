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
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              Choose Your Room
            </h2>
            <p className="text-muted-foreground">
              Browse our selection of premium self-contained rooms
            </p>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex bg-muted rounded-lg p-1">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filter === "all" 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Rooms
              </button>
              <button
                onClick={() => setFilter("available")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filter === "available" 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Available
              </button>
            </div>
          </div>
        </div>

        {/* Room Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room, index) => (
            <div 
              key={room.id} 
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
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

        {/* View All CTA */}
        <div className="text-center mt-10">
          <Button asChild size="lg">
            <Link to="/okitipupa/rooms">
              View All 50 Rooms
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default RoomsSection;
