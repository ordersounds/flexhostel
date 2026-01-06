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
  ChevronRight,
  ArrowRight
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
    <div className="min-h-screen bg-stone-50">
      <Header />
      <main className="pt-20">
        <div className="container mx-auto px-6 py-8">

          {/* Back Button & Breadcrumb */}
          <div className="mb-8 animate-reveal-up">
            <Link
              to="/okitipupa/rooms"
              className="inline-flex items-center gap-2 text-stone-500 hover:text-primary transition-colors group font-bold uppercase tracking-widest text-[10px]"
            >
              <div className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all">
                <ArrowLeft className="h-4 w-4" />
              </div>
              Back to Collections
            </Link>
          </div>

          <div className="grid lg:grid-cols-12 gap-12">

            {/* Left: Cinematic Gallery & Info */}
            <div className="lg:col-span-8 space-y-12">

              {/* Cinematic Gallery */}
              <section className="relative aspect-[16/10] md:aspect-[21/9] overflow-hidden rounded-[2.5rem] bg-stone-200 shadow-2xl animate-reveal-up group">
                <img
                  src={room.images[currentImageIndex]}
                  alt={`Room ${room.room_name}`}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />

                {/* Navigation Arrows - Glassmorphic */}
                {room.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}

                {/* Progress Indicators */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                  {room.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-1.5 rounded-full transition-all duration-500 ${index === currentImageIndex ? "w-8 bg-white" : "w-1.5 bg-white/40"
                        }`}
                    />
                  ))}
                </div>

                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 pointer-events-none" />
              </section>

              {/* Room Meta & Description */}
              <section className="space-y-8 animate-reveal-up delay-100">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-stone-200">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <Badge className="bg-primary/10 text-primary border-none px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        Luxury Suite
                      </Badge>
                      <span className="text-stone-300">•</span>
                      <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Okitipupa, Ondo</span>
                    </div>
                    <h1 className="font-display text-5xl md:text-7xl font-bold text-stone-900 tracking-tighter leading-none mb-4">
                      {room.room_name}
                    </h1>
                    <p className="text-xl text-stone-500 font-light max-w-2xl leading-relaxed">
                      {room.description}
                    </p>
                  </div>
                </div>

                {/* Amenities Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Premium Features
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {room.amenities.map((amenity) => (
                        <div
                          key={amenity}
                          className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-stone-100 transition-all hover:shadow-md hover:border-primary/10 group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400 group-hover:text-primary transition-colors">
                            {amenityIcons[amenity] || <DoorOpen className="h-5 w-5" />}
                          </div>
                          <span className="text-sm font-bold text-stone-600">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Agent Card */}
                  <div className="space-y-6">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Personal Liaison
                    </h2>
                    <div className="bg-stone-900 rounded-[2rem] p-8 text-white relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full pointer-events-none" />
                      <div className="relative z-10 flex items-center gap-6">
                        <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 overflow-hidden">
                          <User className="h-8 w-8 text-stone-400" />
                        </div>
                        <div>
                          <p className="text-lg font-bold tracking-tight">{room.agent.name}</p>
                          <p className="text-stone-400 text-sm mb-4">Dedicated Residence Agent</p>
                          <a href={`tel:${room.agent.phone}`} className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest hover:text-teal-400 transition-colors">
                            <Phone className="h-4 w-4" />
                            Direct Contact
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right: Booking Sidebar (Sticky) */}
            <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit space-y-6 animate-reveal-up delay-200">
              <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-stone-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />

                <div className="mb-10 text-center">
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-[0.2em] block mb-2">Investment / Year</span>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-black text-stone-900 tracking-tighter">{formattedPrice}</span>
                    <span className="text-stone-400 font-medium">/yr</span>
                  </div>
                </div>

                <div className="space-y-4 mb-10 pb-10 border-b border-stone-100">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-stone-400 uppercase tracking-widest text-[10px]">Contract Term</span>
                    <span className="font-bold text-stone-900">12 Months (Renews)</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-stone-400 uppercase tracking-widest text-[10px]">Eligibility</span>
                    <span className="font-bold text-stone-900 capitalize">{room.gender === 'any' ? 'Gender Neutral' : room.gender}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-stone-400 uppercase tracking-widest text-[10px]">Status</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${room.status === 'available' ? 'bg-primary' : 'bg-stone-300'}`} />
                      <span className="font-bold text-stone-900">{room.status === 'available' ? 'Open for Application' : 'Reserved'}</span>
                    </div>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full h-16 rounded-full text-base font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all bg-stone-950 text-white border-none group"
                  disabled={room.status !== "available"}
                  onClick={() => navigate(`/apply/${room.room_name.toLowerCase().replace(" ", "-")}`)}
                >
                  {room.status === "available" ? (
                    <span className="flex items-center gap-2">
                      Reserve This Suite
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  ) : "Full Occupancy"}
                </Button>

                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest text-center mt-6">
                  Full payment required for confirmation
                </p>
              </div>

              {/* Need Help Card */}
              <div className="bg-primary/5 rounded-[2rem] p-8 border border-primary/10">
                <h4 className="text-stone-900 font-bold mb-2">Need a virtual tour?</h4>
                <p className="text-stone-500 text-sm font-light mb-4 leading-relaxed">Schedule a high-definition video walkthrough with our residence agent today.</p>
                <Button variant="ghost" className="p-0 h-auto text-primary font-bold text-xs uppercase tracking-widest hover:bg-transparent hover:text-teal-600 transition-colors">
                  Request 3D Tour →
                </Button>
              </div>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RoomDetail;
