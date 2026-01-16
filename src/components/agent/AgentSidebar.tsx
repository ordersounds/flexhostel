import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
    LayoutDashboard,
    Users,
    Megaphone,
    LogOut,
    ChevronRight,
    Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface AgentSidebarProps {
    onLogout?: () => void;
    isOpen?: boolean;
    onClose?: () => void;
}

const AgentSidebar = ({ onLogout, isOpen, onClose }: AgentSidebarProps) => {
    const isMobile = useIsMobile();
    const location = useLocation();

    const navItems = [
        { label: "My Rooms", icon: Home, path: "/agent" },
        { label: "Announcements", icon: Megaphone, path: "/agent/announcements" },
    ];

    const SidebarContent = () => (
        <>
            <div className="p-8">
                <Link to="/" onClick={isMobile ? onClose : undefined} className="group flex items-center gap-3 mb-10 cursor-pointer">
                    <div className="h-10 w-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-shadow">
                        <Users className="text-white h-6 w-6" />
                    </div>
                    <span className="font-display text-xl font-bold tracking-tighter text-stone-900 group-hover:text-primary transition-colors">
                        Flex<span className="text-primary">Agent</span>
                    </span>
                </Link>

                <nav className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={isMobile ? onClose : undefined}
                                className={cn(
                                    "group flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300",
                                    isActive
                                        ? "bg-stone-900 text-white shadow-xl shadow-stone-900/10"
                                        : "text-stone-400 hover:bg-stone-50 hover:text-stone-900"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-stone-300 group-hover:text-stone-600")} />
                                    <span className="text-sm font-bold tracking-tight uppercase tracking-widest text-[10px]">{item.label}</span>
                                </div>
                                <ChevronRight className={cn("h-4 w-4 opacity-0 transition-opacity", !isActive && "group-hover:opacity-100")} />
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-8 border-t border-stone-50">
                <button
                    onClick={() => {
                        if (isMobile && onClose) onClose();
                        onLogout?.();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors group"
                >
                    <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Logout</span>
                </button>
            </div>
        </>
    );

    if (isMobile) {
        return (
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent side="left" className="w-80 p-0 bg-white border-r border-stone-100">
                    <div className="h-full flex flex-col">
                        <SidebarContent />
                    </div>
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <aside className="w-80 h-screen bg-white border-r border-stone-100 flex flex-col fixed left-0 top-0 z-50">
            <SidebarContent />
        </aside>
    );
};

export default AgentSidebar;
