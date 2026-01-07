import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string | number;
    subtext?: string;
    icon: LucideIcon;
    trend?: {
        value: string;
        isUp: boolean;
    };
    color?: "primary" | "stone" | "gold";
    className?: string;
}

const StatCard = ({ title, value, subtext, icon: Icon, trend, color = "stone", className }: StatCardProps) => {
    return (
        <div className={cn(
            "bg-white p-8 rounded-[2rem] border border-stone-100 shadow-sm relative group overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-stone-200/50",
            className
        )}>
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                        color === "primary" ? "bg-primary/10 text-primary" : "bg-stone-50 text-stone-400"
                    )}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-1">{title}</p>
                    <h3 className="font-display text-4xl font-bold text-stone-900 tracking-tighter">{value}</h3>
                    {subtext && <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mt-2">{subtext}</p>}
                </div>

                {trend && (
                    <div className={cn(
                        "text-[10px] font-bold uppercase tracking-widest mt-6 flex items-center gap-1.5",
                        trend.isUp ? "text-emerald-500" : "text-red-500"
                    )}>
                        <div className={cn(
                            "h-1.5 w-1.5 rounded-full animate-pulse",
                            trend.isUp ? "bg-emerald-500" : "bg-red-500"
                        )} />
                        {trend.value}
                    </div>
                )}
            </div>
            <div className="absolute bottom-[-10%] right-[-10%] text-stone-50/50 font-display text-9xl font-bold opacity-[0.03] select-none group-hover:scale-110 transition-transform duration-700">
                {title.split(' ')[0]}
            </div>
        </div>
    );
};

export default StatCard;
