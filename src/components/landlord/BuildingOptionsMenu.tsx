import { useState } from "react";
import { MoreHorizontal, Shield, Edit, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AssignAgentDialog from "./AssignAgentDialog";
import EditBuildingDialog from "./EditBuildingDialog";
import BuildingBulkUpdateDialog from "./BuildingBulkUpdateDialog";

interface BuildingOptionsMenuProps {
    buildingId: string;
    buildingName: string;
    currentImageUrl: string;
    currentAgentId?: string;
    currentName: string;
    currentAddress: string;
    onSuccess: () => void;
}

const BuildingOptionsMenu = ({
    buildingId,
    buildingName,
    currentImageUrl,
    currentAgentId,
    currentName,
    currentAddress,
    onSuccess
}: BuildingOptionsMenuProps) => {
    const [assignAgentOpen, setAssignAgentOpen] = useState(false);
    const [editBuildingOpen, setEditBuildingOpen] = useState(false);
    const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 absolute top-6 right-6 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white border border-white/20 shadow-lg z-10"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setBulkUpdateOpen(true)}>
                        <Settings2 className="h-4 w-4 mr-2" />
                        Bulk Update Rooms
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAssignAgentOpen(true)}>
                        <Shield className="h-4 w-4 mr-2" />
                        Assign Agent
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditBuildingOpen(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Details
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <BuildingBulkUpdateDialog
                open={bulkUpdateOpen}
                onOpenChange={setBulkUpdateOpen}
                buildingId={buildingId}
                buildingName={buildingName}
                currentAgentId={currentAgentId}
                onSuccess={onSuccess}
            />

            <AssignAgentDialog
                open={assignAgentOpen}
                onOpenChange={setAssignAgentOpen}
                buildingId={buildingId}
                buildingName={buildingName}
                currentAgentId={currentAgentId}
                onSuccess={onSuccess}
            />

            <EditBuildingDialog
                open={editBuildingOpen}
                onOpenChange={setEditBuildingOpen}
                buildingId={buildingId}
                buildingName={buildingName}
                currentName={currentName}
                currentAddress={currentAddress}
                currentImageUrl={currentImageUrl}
                onSuccess={onSuccess}
            />
        </>
    );
};

export default BuildingOptionsMenu;
