import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RoomCard from "@/components/RoomCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Shield, Zap, Wifi, Trash2, Camera, ArrowLeft } from "lucide-react";
import buildingCover from "@/assets/building-cover.jpg";
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

const buildingAmenities = [
  { icon: <Shield className="h-5 w-5" />, name: "24/7 Security Personnel" },
  { icon: <Zap className="h-5 w-5" />, name: "Backup Power Generator" },
  { icon: <Camera className="h-5 w-5" />, name: "CCTV Coverage" },
  { icon: <Wifi className="h-5 w-5" />, name: "WiFi Available" },
  { icon: <Trash2 className="h-5 w-5" />, name: "Waste Management" },
];

const BuildingDetail = () => {
  const { buildingSlug } = useParams();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [building, setBuilding] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const slug = buildingSlug || 'okitipupa';
      setLoading(true);

      try {
        // Fetch Building by slug
        const { data: bData, error: bError } = await supabase
          .from("buildings")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (bError) {
          console.error("Building fetch error:", bError);
          setLoading(false);
          return;
        }

        if (bData) {
          setBuilding(bData);

          // Fetch Rooms for this building
          const { data: rData, error: rError } = await supabase
            .from("rooms")
            .select("id, room_name, price, cover_image_url, amenities, status, gender")
            .eq("building_id", bData.id)
            .limit(8);

          if (rError) {
            console.error("Rooms fetch error:", rError);
          } else if (rData && rData.length > 0) {
            setRooms(rData.map(room => ({
              ...room,
              price: Number(room.price),
              amenities: (room.amenities as string[]) || [],
              status: room.status as RoomStatus,
              gender: room.gender as RoomGender,
            })));
          }
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [buildingSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-stone-400 font-bold uppercase tracking-[0.2em] text-xs">Accessing Residence Records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-20">

        {/* Editorial Hero */}
        <section className="relative h-[60vh] min-h-[500px] flex items-end pb-20 overflow-hidden">
          <img
            src={building?.cover_image_url || buildingCover}
            alt="Flex Hostel Okitipupa"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent" />

          <div className="container mx-auto px-6 relative z-10 animate-reveal-up">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-white/60 hover:text-primary mb-8 transition-colors group font-bold uppercase tracking-widest text-[10px]"
            >
              <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all">
                <ArrowLeft className="h-4 w-4" />
              </div>
              Back to Residence
            </Link>

            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 bg-primary text-white rounded-full px-4 py-1 mb-6 text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-primary/20">
                Featured Building
              </div>
              <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tighter leading-[0.9]">
                {building?.name ? (
                  <>
                    Flex Hostel <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-400">{building.name.split(' ').pop()}.</span>
                  </>
                ) : (
                  <>
                    Flex Hostel <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-400">Okitipupa.</span>
                  </>
                )}
              </h1>
              <p className="flex items-center gap-3 text-white/60 font-medium tracking-wide">
                <MapPin className="h-5 w-5 text-primary" />
                {building?.address || "Broad Street, Okitipupa, Ondo State, Nigeria"}
              </p>
            </div>
          </div>

          {/* Decorative Corner Glow */}
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
        </section>

        {/* Narrative Section */}
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-stone-50 blur-[100px] rounded-full pointer-events-none" />
          <div className="container mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-12 gap-16 items-start">
              <div className="lg:col-span-12">
                <div className="max-w-3xl">
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mb-8">Concept & Vision</h2>
                  <p className="font-display text-3xl md:text-4xl font-bold text-stone-900 leading-tight tracking-tight mb-8">
                    Redefining student residence through <br className="hidden md:block" />
                    <span className="text-stone-400">modernity, safety, and community.</span>
                  </p>
                  <div className="grid md:grid-cols-2 gap-12">
                    <p className="text-stone-500 text-lg leading-relaxed font-light italic border-l-2 border-primary/20 pl-8">
                      "Flex Hostel Okitipupa is our flagship building, designed specifically for students
                      seeking comfortable, secure, and modern accommodation."
                    </p>
                    <p className="text-stone-500 text-lg leading-relaxed font-light">
                      Each room features modern furnishings, private bathrooms, and 24/7 security
                      surveillance. Our building is equipped with backup power, ensuring uninterrupted
                      electricity for your comfort and academic focus.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Building Amenities */}
        <section className="py-24 bg-stone-50">
          <div className="container mx-auto px-6">
            <div className="mb-16">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400 mb-4">Architecture & Safety</h2>
              <h3 className="font-display text-4xl font-bold text-stone-900 tracking-tighter">Building Highlights</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Large Highlight Card */}
              <div className="md:col-span-8 bg-stone-900 rounded-[2.5rem] p-12 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full group-hover:bg-primary/20 transition-all pointer-events-none" />
                <div className="relative z-10 max-w-md">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-10 border border-white/10 group-hover:scale-110 transition-transform">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="text-3xl font-bold tracking-tight mb-4">Unmatched Security</h4>
                  <p className="text-stone-400 leading-relaxed font-light">
                    24/7 armed security personnel, comprehensive CCTV coverage, and biometric access control
                    integrated with your student app. Your safety is our ultimate priority.
                  </p>
                </div>
              </div>

              {/* Tall Power Card */}
              <div className="md:col-span-4 bg-primary rounded-[2.5rem] p-12 text-white flex flex-col justify-between group">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center border border-white/20 group-hover:rotate-12 transition-transform">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h4 className="text-3xl font-bold tracking-tight mb-4">Zero Downtime</h4>
                  <p className="text-white/80 font-light">
                    Industrial-grade backup power generators ensure you never lose light or connectivity.
                  </p>
                </div>
              </div>

              {/* Smaller Bento Items */}
              <div className="md:col-span-4 bg-white rounded-[2rem] p-8 border border-stone-100 shadow-sm transition-all hover:shadow-xl group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    <Wifi className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-stone-900">Campus WiFi</span>
                </div>
                <p className="text-stone-500 text-sm font-light">Enterprise-grade internet for academic excellence.</p>
              </div>

              <div className="md:col-span-4 bg-white rounded-[2rem] p-8 border border-stone-100 shadow-sm transition-all hover:shadow-xl group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-stone-900">Clean Living</span>
                </div>
                <p className="text-stone-500 text-sm font-light">Daily waste management and professional facility maintenance.</p>
              </div>

              <div className="md:col-span-4 bg-white rounded-[2rem] p-8 border border-stone-100 shadow-sm transition-all hover:shadow-xl group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    <Camera className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-stone-900">Smart Monitoring</span>
                  <Badge className="ml-auto bg-primary/10 text-primary border-none text-[8px] tracking-widest font-bold">24/7</Badge>
                </div>
                <p className="text-stone-500 text-sm font-light">Complete oversight of common areas for peace of mind.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Rooms Preview Selection */}
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
              <div>
                <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400 mb-4">Suite Selection</h2>
                <h3 className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-stone-900 tracking-tighter">
                  Choose Your <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-400">Perfect Suite.</span>
                </h3>
              </div>
              <Button asChild size="lg" className="rounded-full h-14 px-10 font-bold bg-stone-950 hover:bg-primary transition-all shadow-xl">
                <Link to="/okitipupa/rooms">Explore All Suites</Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {rooms.slice(0, 4).map((room, index) => (
                <div key={room.id} className="animate-reveal-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <RoomCard
                    id={room.id}
                    roomName={room.room_name}
                    buildingName="Okitipupa"
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
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default BuildingDetail;
