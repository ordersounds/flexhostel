import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Filter, Zap, Search } from "lucide-react";
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


const RoomsSection = () => {
  const [filter, setFilter] = useState<"all" | "available">("all");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

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
        } else {
          setRooms([]);
        }
      } catch (error) {
        console.error("Supabase Error:", error);
        setRooms([]);
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
    <section className="py-24 lg:py-32 bg-stone-50 relative overflow-hidden">
      {/* Editorial Background Element */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-teal-500/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="container mx-auto px-6 relative">
        {/* Editorial Header */}
        <div className="max-w-4xl mx-auto mb-20 text-center animate-reveal-up">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Premium Rooms</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold text-foreground mb-8 tracking-tighter leading-[0.95]">
            Choose Your <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-400">Perfect Suite.</span>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-light max-w-2xl mx-auto">
            Browse our selection of luxury student residence rooms. <br className="hidden md:block" />
            Designed for those who demand more.
          </p>
        </div>

        {/* Clean Minimalist Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-16 animate-reveal-up delay-100">
          <div className="flex bg-white/80 backdrop-blur-md rounded-full p-1.5 shadow-sm border border-stone-200">
            <button
              onClick={() => setFilter("all")}
              className={`px-8 py-2.5 text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 ${filter === "all"
                ? "bg-primary text-white shadow-lg"
                : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
                }`}
            >
              All Rooms ({rooms.length})
            </button>
            <button
              onClick={() => setFilter("available")}
              className={`px-8 py-2.5 text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 ${filter === "available"
                ? "bg-primary text-white shadow-lg"
                : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
                }`}
            >
              Available ({rooms.filter(r => r.status === "available").length})
            </button>
          </div>

          <div className="flex items-center gap-2 text-stone-400 text-xs font-bold uppercase tracking-widest">
            <Filter className="w-4 h-4" />
            <span>Filter by Feature</span>
          </div>
        </div>

        {/* Enhanced Room Grid - Mobile App Feed Style */}
        {rooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-8 lg:gap-12 mb-24">
            {filteredRooms.map((room, index) => (
              <div
                key={room.id}
                className="animate-reveal-up"
                style={{ animationDelay: `${200 + index * 100}ms` }}
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
        ) : !loading ? (
          <div className="max-w-2xl mx-auto py-24 text-center space-y-8 animate-reveal-up">
            <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-8 border border-stone-200">
              <Zap className="h-8 w-8 text-stone-300" />
            </div>
            <h3 className="font-display text-3xl font-bold text-stone-900 tracking-tighter">"Awaiting Residence Enrollment"</h3>
            <p className="text-stone-500 font-light leading-relaxed max-w-md mx-auto">
              Our flagship suites in Okitipupa are currently being Provisioned in the registry.
              Please check back shortly or contact our administrator.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-8 lg:gap-12 mb-24">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[4/5] rounded-[2.5rem] bg-stone-100 animate-pulse" />
            ))}
          </div>
        )}

        {/* Premium CTA Box */}
        <div className="animate-reveal-up delay-300">
          <div className="relative overflow-hidden rounded-[3rem] p-10 md:p-16 text-center bg-stone-900 text-white shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 blur-[100px] rounded-full" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <h3 className="font-display text-4xl md:text-5xl font-bold tracking-tighter mb-4">
                Can't find your <br className="md:hidden" /> ideal space?
              </h3>
              <p className="text-stone-400 text-lg md:text-xl font-light mb-10 max-w-lg mx-auto">
                Explore our full catalog of 50+ suites with virtual 3D tours and detailed layouts.
              </p>
              <Button asChild size="lg" className="h-14 px-10 rounded-full text-base font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 bg-primary text-white border-none">
                <Link to="/okitipupa/rooms">
                  Explore All Suites
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RoomsSection;
