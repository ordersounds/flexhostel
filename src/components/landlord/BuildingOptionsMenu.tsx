import { useState } from "react";
import { MoreHorizontal, Edit, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditBuildingDialog from "./EditBuildingDialog";
import BlockManagementDialog from "./BlockManagementDialog";

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
    const [editBuildingOpen, setEditBuildingOpen] = useState(false);
    const [manageBlocksOpen, setManageBlocksOpen] = useState(false);

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
                    <DropdownMenuItem onClick={() => setManageBlocksOpen(true)}>
                        <Layers className="h-4 w-4 mr-2" />
                        Manage Blocks
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditBuildingOpen(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Details
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <BlockManagementDialog
                open={manageBlocksOpen}
                onOpenChange={setManageBlocksOpen}
                buildingId={buildingId}
                buildingName={buildingName}
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
