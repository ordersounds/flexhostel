import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RoomCard from "@/components/RoomCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Shield, Zap, Wifi, Trash2, Camera, ArrowLeft } from "lucide-react";
import heroBuilding from "@/assets/hero-building.jpg";
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

// Sample rooms for demo
const sampleRooms: Room[] = [
  { id: "1", room_name: "Alabama", price: 450000, cover_image_url: null, amenities: ["Air Conditioning", "Private Bathroom"], status: "available", gender: "any" },
  { id: "2", room_name: "Alaska", price: 450000, cover_image_url: null, amenities: ["Air Conditioning", "Private Bathroom"], status: "available", gender: "male" },
  { id: "3", room_name: "Arizona", price: 450000, cover_image_url: null, amenities: ["Air Conditioning", "Private Bathroom"], status: "pending", gender: "female" },
  { id: "4", room_name: "Arkansas", price: 450000, cover_image_url: null, amenities: ["Air Conditioning", "Private Bathroom"], status: "available", gender: "any" },
];

const BuildingDetail = () => {
  const { buildingSlug } = useParams();
  const [rooms, setRooms] = useState<Room[]>(sampleRooms);

  useEffect(() => {
    const fetchRooms = async () => {
      const { data } = await supabase
        .from("rooms")
        .select("id, room_name, price, cover_image_url, amenities, status, gender")
        .limit(8);

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        {/* Hero */}
        <section className="relative h-[50vh] min-h-[400px]">
          <img
            src={heroBuilding}
            alt="Flex Hostel Okitipupa"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-foreground/20" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="container mx-auto">
              <Link 
                to="/" 
                className="inline-flex items-center gap-2 text-sm text-background/80 hover:text-background mb-4 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-background mb-2">
                Flex Hostel Okitipupa
              </h1>
              <p className="flex items-center gap-2 text-background/80">
                <MapPin className="h-4 w-4" />
                Okitipupa, Ondo State, Nigeria
              </p>
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                About This Building
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Flex Hostel Okitipupa is our flagship building, designed specifically for students 
                seeking comfortable, secure, and modern accommodation. Located in the heart of 
                Okitipupa, Ondo State, we offer 50 premium self-contained rooms with all the 
                amenities you need to focus on your studies and thrive.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Each room features modern furnishings, private bathrooms, and 24/7 security 
                surveillance. Our building is equipped with backup power, ensuring uninterrupted 
                electricity for your comfort.
              </p>
            </div>
          </div>
        </section>

        {/* Building Amenities */}
        <section className="py-12 bg-muted/50">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-2xl font-bold text-foreground mb-8">
              Building Amenities
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {buildingAmenities.map((amenity, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 bg-card rounded-lg p-4 shadow-sm border border-border/50"
                >
                  <div className="text-primary">{amenity.icon}</div>
                  <span className="text-sm font-medium text-foreground">{amenity.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Rooms Preview */}
        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                  Available Rooms
                </h2>
                <p className="text-muted-foreground">
                  Choose from our 50 premium self-contained rooms
                </p>
              </div>
              <Button asChild>
                <Link to="/okitipupa/rooms">View All Rooms</Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {rooms.slice(0, 4).map((room) => (
                <RoomCard
                  key={room.id}
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
