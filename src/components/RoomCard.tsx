import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RoomCardProps {
  id: string;
  roomName: string;
  buildingName: string;
  buildingSlug: string;
  price: number;
  coverImage?: string;
  amenities: string[];
  status: "available" | "pending" | "occupied";
  gender: "male" | "female" | "any";
}

const statusConfig = {
  available: { label: "Available", className: "bg-primary text-primary-foreground" },
  pending: { label: "Reserved", className: "bg-stone-200 text-stone-600" },
  occupied: { label: "Full", className: "bg-stone-100 text-stone-400" },
};

const RoomCard = ({
  id,
  roomName,
  buildingName,
  buildingSlug,
  price,
  coverImage,
  amenities,
  status,
  gender,
}: RoomCardProps) => {
  const formattedPrice = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(price);

  return (
    <Link
      to={`/${buildingSlug}/rooms/${id}`}
      className="group block relative space-y-4"
    >
      {/* Image Container with Apple-style deep rounded corners */}
      <div className="relative aspect-[4/5] md:aspect-[4/3] w-full overflow-hidden rounded-[2.5rem] bg-stone-100 border border-black/5 shadow-sm transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:shadow-2xl group-hover:-translate-y-2">
        <img
          src={coverImage || "/placeholder.svg"}
          alt={`Room ${roomName}`}
          className="h-full w-full object-cover transition-transform duration-1000 ease-out will-change-transform group-hover:scale-110"
        />

        {/* Dynamic Glass Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Floating Badges */}
        <div className="absolute top-5 left-5 flex gap-2 flex-wrap max-w-[80%]">
          <Badge variant="secondary" className="bg-white/90 backdrop-blur-md text-stone-900 border-none px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
            {buildingName}
          </Badge>
          {gender !== 'any' && (
            <Badge variant="outline" className="bg-black/20 backdrop-blur-md text-white border-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider capitalize">
              {gender}
            </Badge>
          )}
        </div>

        <div className="absolute top-5 right-5">
          <Badge className={cn("backdrop-blur-md shadow-lg border-none px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300", statusConfig[status].className)}>
            {statusConfig[status].label}
          </Badge>
        </div>

        {/* Price Tag (Mobile Visible, Desktop Hover) */}
        <div className="absolute bottom-6 left-6 z-20">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-2xl opacity-100 md:opacity-0 md:translate-y-4 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-500 delay-100">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-widest block leading-none mb-1">Annual Rent</span>
            <span className="text-xl font-black text-stone-900 tracking-tighter">{formattedPrice}</span>
          </div>
        </div>
      </div>

      {/* Clean Minimal Info */}
      <div className="space-y-2 px-2">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="font-display text-2xl font-bold tracking-tighter text-stone-900 group-hover:text-primary transition-colors duration-300">
              {roomName}
            </h3>
            {/* Subtitle / Amenities Summary */}
            <div className="flex flex-wrap gap-x-2 text-xs text-stone-500 font-medium leading-relaxed mt-1">
              {amenities.slice(0, 2).map((amenity, i) => (
                <span key={amenity} className="flex items-center">
                  {i > 0 && <span className="mr-2 text-stone-300">•</span>}
                  {amenity}
                </span>
              ))}
              {amenities.length > 2 && (
                <span className="text-stone-300">
                  +{amenities.length - 2} more
                </span>
              )}
            </div>
          </div>

          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest leading-none">Price / Year</span>
            <span className="text-xl font-black text-stone-900 tracking-tighter mt-1">{formattedPrice}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RoomCard;
