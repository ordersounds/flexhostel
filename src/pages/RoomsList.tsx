import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RoomCard from "@/components/RoomCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Filter, Search } from "lucide-react";
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
}

// All 50 US state names
const usStates = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", 
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming"
];

const generateSampleRooms = (): Room[] => {
  return usStates.map((state, index) => ({
    id: String(index + 1),
    room_name: state,
    price: 450000 + (index % 5) * 10000,
    cover_image_url: null,
    amenities: ["Air Conditioning", "Private Bathroom", "Study Desk", "Wardrobe"].slice(0, 2 + (index % 3)),
    status: index % 7 === 0 ? "occupied" : index % 5 === 0 ? "pending" : "available" as RoomStatus,
    gender: index % 3 === 0 ? "male" : index % 3 === 1 ? "female" : "any" as RoomGender,
  }));
};

const RoomsList = () => {
  const [rooms, setRooms] = useState<Room[]>(generateSampleRooms());
  const [filter, setFilter] = useState<"all" | "available">("all");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchRooms = async () => {
      const { data } = await supabase
        .from("rooms")
        .select("id, room_name, price, cover_image_url, amenities, status, gender")
        .order("room_name");

      if (data && data.length > 0) {
        setRooms(data.map(room => ({
          ...room,
          price: Number(room.price),
          amenities: (room.amenities as string[]) || [],
          status: room.status as RoomStatus,
          gender: room.gender as RoomGender,
        })));
      }
    };
    fetchRooms();
  }, []);

  const filteredRooms = rooms.filter(room => {
    const matchesStatus = filter === "all" || room.status === "available";
    const matchesGender = genderFilter === "all" || room.gender === genderFilter || room.gender === "any";
    const matchesSearch = room.room_name.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesGender && matchesSearch;
  });

  const availableCount = rooms.filter(r => r.status === "available").length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link 
              to="/okitipupa" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Building
            </Link>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              All Rooms in Okitipupa
            </h1>
            <p className="text-muted-foreground">
              {availableCount} of {rooms.length} rooms available
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 p-4 bg-muted/50 rounded-xl">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by room name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex bg-background rounded-lg p-1 border border-input">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    filter === "all" 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter("available")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    filter === "available" 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Available
                </button>
              </div>
            </div>

            {/* Gender Filter */}
            <div className="flex bg-background rounded-lg p-1 border border-input">
              <button
                onClick={() => setGenderFilter("all")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  genderFilter === "all" 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Genders
              </button>
              <button
                onClick={() => setGenderFilter("male")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  genderFilter === "male" 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Male
              </button>
              <button
                onClick={() => setGenderFilter("female")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  genderFilter === "female" 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Female
              </button>
            </div>
          </div>

          {/* Results Count */}
          <p className="text-sm text-muted-foreground mb-6">
            Showing {filteredRooms.length} room{filteredRooms.length !== 1 ? "s" : ""}
          </p>

          {/* Room Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRooms.map((room, index) => (
              <div 
                key={room.id} 
                className="animate-fade-in"
                style={{ animationDelay: `${Math.min(index, 12) * 50}ms` }}
              >
                <RoomCard
                  id={room.id}
                  roomName={room.room_name}
                  buildingName="Okitipupa Building"
                  buildingSlug="okitipupa"
                  price={room.price}
                  coverImage={room.cover_image_url || roomInterior}
                  amenities={room.amenities}
                  status={room.status}
                  gender={room.gender}
                />
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredRooms.length === 0 && (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground mb-4">
                No rooms match your filters
              </p>
              <Button variant="outline" onClick={() => { setFilter("all"); setGenderFilter("all"); setSearch(""); }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RoomsList;
