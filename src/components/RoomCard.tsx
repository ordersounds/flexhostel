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
  available: { label: "Available", className: "bg-green-500/90 text-white border-none" },
  pending: { label: "Pending", className: "bg-yellow-500/90 text-black border-none" },
  occupied: { label: "Occupied", className: "bg-red-500/90 text-white border-none" },
};

const RoomCard = ({
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
      to={`/${buildingSlug}/rooms/${roomName.toLowerCase().replace(" ", "-")}`}
      className="group block relative space-y-3 touch-scale"
    >
      {/* Image Container with Apple-style fluid rounded corners */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.25rem] bg-secondary border border-black/5 shadow-sm transition-all duration-300 group-hover:shadow-md">
        <img
          src={coverImage || "/placeholder.svg"}
          alt={`Room ${roomName}`}
          className="h-full w-full object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-105"
        />

        {/* Glassmorphic Overlay Gradient for text readability if needed, kept subtle */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap max-w-[70%]">
          <Badge variant="secondary" className="glass border-white/20 text-black/80 font-medium backdrop-blur-md shadow-sm">
            {buildingName}
          </Badge>
          {gender !== 'any' && (
            <Badge variant="outline" className="glass border-white/20 text-black/80 font-medium backdrop-blur-md shadow-sm capitalize">
              {gender}
            </Badge>
          )}
        </div>

        <div className="absolute top-3 right-3">
          <Badge className={cn("glass backdrop-blur-md shadow-sm px-2.5 py-0.5", statusConfig[status].className)}>
            {statusConfig[status].label}
          </Badge>
        </div>
      </div>

      {/* Clean Minimal Info */}
      <div className="space-y-1 pl-1">
        <div className="flex justify-between items-baseline">
          <h3 className="font-semibold text-lg tracking-tight text-foreground/90 group-hover:text-primary transition-colors">
            {roomName}
          </h3>
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-lg text-foreground tracking-tight">{formattedPrice}</span>
            <span className="text-muted-foreground text-sm font-medium">/yr</span>
          </div>
        </div>

        {/* Subtitle / Amenities Summary */}
        <div className="flex flex-wrap gap-x-2 text-sm text-muted-foreground font-medium leading-relaxed">
          {amenities.slice(0, 3).map((amenity, i) => (
            <span key={amenity} className="flex items-center">
              {i > 0 && <span className="mr-2 text-muted-foreground/40">•</span>}
              {amenity}
            </span>
          ))}
          {amenities.length > 3 && (
            <span className="text-muted-foreground/60">
              +{amenities.length - 3} more
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default RoomCard;
