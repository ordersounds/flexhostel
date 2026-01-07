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

const RoomsList = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "available">("all");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      try {
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
      } catch (err) {
        console.error("Error fetching rooms:", err);
      } finally {
        setLoading(false);
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
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === "all"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter("available")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === "available"
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
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${genderFilter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                All Genders
              </button>
              <button
                onClick={() => setGenderFilter("male")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${genderFilter === "male"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Male
              </button>
              <button
                onClick={() => setGenderFilter("female")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${genderFilter === "female"
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
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="aspect-[4/5] rounded-[2.5rem] bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredRooms.length > 0 ? (
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
          ) : (
            <div className="text-center py-24 bg-muted/30 rounded-[3rem] border-2 border-dashed border-muted">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Search className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4">
                {rooms.length === 0 ? "Residence Registry Empty" : "No suites matching selection"}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-8 font-light">
                {rooms.length === 0
                  ? "We haven't enrolled any suites into the Okitipupa registry yet. Please sync your database."
                  : "Try adjusting your filters to find your preferred student accommodation."}
              </p>
              {rooms.length > 0 && (
                <Button variant="outline" className="rounded-full px-8" onClick={() => { setFilter("all"); setGenderFilter("all"); setSearch(""); }}>
                  Reset Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RoomsList;
