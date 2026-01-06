import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Snowflake, Bath, Lamp, Eye } from "lucide-react";

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

const statusLabels = {
  available: "Available",
  pending: "Pending",
  occupied: "Occupied",
};

const amenityIcons: Record<string, React.ReactNode> = {
  "Air Conditioning": <Snowflake className="h-3 w-3" />,
  "Private Bathroom": <Bath className="h-3 w-3" />,
  "Reading Lamp": <Lamp className="h-3 w-3" />,
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
}: RoomCardProps) => {
  const formattedPrice = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(price);

  const shortPrice = `₦${(price / 1000).toFixed(0)}k/yr`;

  return (
    <div className="group bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 card-hover border border-border/50">
      {/* Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={coverImage || "/placeholder.svg"}
          alt={`Room ${roomName}`}
          className="w-full h-full object-cover img-zoom"
        />
        
        {/* Building Badge */}
        <Badge 
          variant="building" 
          className="absolute top-3 left-3 text-[10px]"
        >
          {buildingName}
        </Badge>

        {/* Price Badge */}
        <Badge 
          variant="price" 
          className="absolute top-3 right-3"
        >
          {shortPrice}
        </Badge>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-bold text-foreground">
            {roomName}
          </h3>
          <Badge variant={status}>
            {statusLabels[status]}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          {formattedPrice}/year
        </p>

        {/* Amenities Preview */}
        <div className="flex items-center gap-2 flex-wrap">
          {amenities.slice(0, 3).map((amenity) => (
            <span 
              key={amenity}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded-full px-2 py-1"
            >
              {amenityIcons[amenity] || null}
              {amenity}
            </span>
          ))}
          {amenities.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{amenities.length - 3} more
            </span>
          )}
        </div>

        {/* CTA */}
        <Button asChild className="w-full" size="sm">
          <Link to={`/${buildingSlug}/rooms/${roomName.toLowerCase().replace(" ", "-")}`}>
            <Eye className="h-4 w-4" />
            View Details
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default RoomCard;
