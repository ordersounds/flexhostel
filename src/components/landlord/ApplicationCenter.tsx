import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, CheckCircle, XCircle, ChevronRight, User, School, Users, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const ApplicationCenter = () => {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        const { data, error } = await supabase
            .from("applications")
            .select(`
        *,
        applicant:profiles!applications_user_id_fkey (name, email, photo_url, phone_number),
        room:rooms (room_name, price, building:buildings(name))
      `)
            .order("created_at", { ascending: false });

        if (error) {
            toast.error("Failed to load applications");
        } else {
            setApplications(data || []);
        }
        setLoading(false);
    };

    const handleAction = async (id: string, status: "approved" | "rejected") => {
        const { error } = await supabase
            .from("applications")
            .update({ status, approved_at: status === "approved" ? new Date().toISOString() : null })
            .eq("id", id);

        if (error) {
            toast.error(`Decision failed for application`);
        } else {
            toast.success(`Application ${status} successfully`);
            fetchApplications();
        }
    };

    return (
        <div className="space-y-12 animate-reveal-up">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="font-display text-5xl font-bold text-stone-900 tracking-tighter">
                        Admissions Queue<span className="text-primary">.</span>
                    </h2>
                    <p className="text-stone-500 text-lg mt-2 font-medium">Verify credentials and curate your resident community.</p>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl shadow-stone-200/20 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-stone-50/50 border-b border-stone-100">
                            <th className="px-8 py-6 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Applicant</th>
                            <th className="px-8 py-6 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Target Residence</th>
                            <th className="px-8 py-6 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-6 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                        {applications.map((app) => (
                            <tr key={app.id} className="group hover:bg-stone-50/10 transition-colors">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full ring-4 ring-white shadow-sm overflow-hidden bg-stone-100">
                                            {app.applicant?.photo_url ? (
                                                <img src={app.applicant.photo_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center font-bold text-sm text-stone-400">
                                                    {app.applicant?.name?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-stone-900 leading-tight">{app.applicant?.name}</p>
                                            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">{app.applicant?.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="space-y-1">
                                        <p className="font-bold text-stone-900 text-sm">Room {app.room?.room_name}</p>
                                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{app.room?.building?.name}</p>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <Badge className={cn(
                                        "px-3 py-1 rounded-full font-bold uppercase tracking-widest text-[8px] border-none shadow-sm",
                                        app.status === "approved" ? "bg-emerald-50 text-emerald-600" :
                                            app.status === "rejected" ? "bg-red-50 text-red-600" :
                                                "bg-stone-100 text-stone-400"
                                    )}>
                                        {app.status}
                                    </Badge>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <button className="h-11 w-11 rounded-2xl bg-white border border-stone-100 text-stone-400 flex items-center justify-center hover:bg-stone-50 transition-colors shadow-sm">
                                                    <Eye className="h-5 w-5" />
                                                </button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-4xl bg-white backdrop-blur-3xl rounded-[2.5rem] border-stone-100 p-0 overflow-hidden shadow-2xl flex flex-col max-h-[95vh] outline-none sm:max-w-[95vw]">
                                                <div className="h-48 bg-stone-900 relative flex-shrink-0">
                                                    <div className="absolute inset-0 opacity-20">
                                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent_70%)]" />
                                                    </div>
                                                    <div className="absolute -bottom-4 left-4 sm:left-12 flex items-end gap-4 sm:gap-6 z-10">
                                                        <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-[2rem] bg-white p-2 shadow-2xl rotate-3 transition-transform hover:rotate-0 duration-500">
                                                            <div className="w-full h-full rounded-[1.5rem] bg-stone-100 overflow-hidden relative">
                                                                <img src={app.applicant?.photo_url || "/placeholder.svg"} className="w-full h-full object-cover" />
                                                            </div>
                                                        </div>
                                                        <div className="mb-2 sm:mb-4">
                                                            <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                                                <h4 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight">{app.applicant?.name}</h4>
                                                                <Badge className="bg-white/10 text-white border-none py-1 px-2 sm:px-3 rounded-full uppercase tracking-widest text-[8px] sm:text-[9px] backdrop-blur-md">Applicant</Badge>
                                                            </div>
                                                            <div className="flex items-center gap-4 sm:gap-6 text-white/60">
                                                                <p className="font-bold uppercase tracking-widest text-[9px] sm:text-[10px] flex items-center gap-2">
                                                                    <User className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> {app.submitted_data?.personal?.gender || "Gender N/A"} • {app.submitted_data?.personal?.dob ? new Date().getFullYear() - new Date(app.submitted_data.personal.dob).getFullYear() : "Age N/A"} YRS
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex-1 overflow-y-auto px-12 pt-12 pb-12">
                                                    <div className="space-y-12">
                                                        {/* Section 1: Academic Profile - Clean Layout */}
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-6">
                                                                <div className="h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                                                                    <School className="h-4 w-4" />
                                                                </div>
                                                                <h5 className="text-sm font-bold text-stone-900 tracking-tight">Academic Profile</h5>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-8 pl-11">
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Institution</p>
                                                                    <p className="text-base font-medium text-stone-900">{app.submitted_data?.school?.institution || "N/A"}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Faculty / Dept</p>
                                                                    <p className="text-base font-medium text-stone-900">
                                                                        {app.submitted_data?.school?.faculty ? `${app.submitted_data.school.faculty} • ` : ""}
                                                                        {app.submitted_data?.school?.department || "N/A"}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Matric Number</p>
                                                                    <p className="text-base font-mono font-medium text-stone-900">{app.submitted_data?.school?.matricNumber || "N/A"}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Section 2: Roommate Configuration - Conditional */}
                                                        {app.submitted_data?.roommate?.hasRoommate ? (
                                                            <div>
                                                                <div className="flex items-center gap-3 mb-6">
                                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                                        <Users className="h-4 w-4" />
                                                                    </div>
                                                                    <h5 className="text-sm font-bold text-stone-900 tracking-tight">Co-Habitation Details</h5>
                                                                </div>

                                                                <div className="pl-11 p-6 rounded-3xl bg-stone-50 border border-stone-100 grid grid-cols-2 gap-6 relative overflow-hidden">
                                                                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                                                        <Users className="h-24 w-24" />
                                                                    </div>

                                                                    <div className="col-span-2">
                                                                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Roommate Name</p>
                                                                        <p className="text-lg font-bold text-stone-900">{app.submitted_data.roommate.name}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Contact Phone</p>
                                                                        <p className="text-sm font-medium text-stone-900">{app.submitted_data.roommate.phone || "N/A"}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Email Address</p>
                                                                        <p className="text-sm font-medium text-stone-900">{app.submitted_data.roommate.email || "N/A"}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <div className="flex items-center gap-3 mb-4 opacity-50">
                                                                    <div className="h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                                                                        <User className="h-4 w-4" />
                                                                    </div>
                                                                    <h5 className="text-sm font-bold text-stone-900 tracking-tight">Co-Habitation Details</h5>
                                                                </div>
                                                                <p className="pl-11 text-sm text-stone-400 italic">Applicant has requested sole occupancy of the suite.</p>
                                                            </div>
                                                        )}

                                                        {/* Section 3: Additional Notes */}
                                                        {app.submitted_data?.additional?.notes && (
                                                            <div>
                                                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Additional Notes / Requests</p>
                                                                <div className="p-6 rounded-2xl bg-stone-50 text-stone-600 text-sm leading-relaxed italic border border-stone-100">
                                                                    "{app.submitted_data.additional.notes}"
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="p-8 border-t border-stone-50 bg-white z-20 flex gap-4">
                                                    <Button
                                                        onClick={() => handleAction(app.id, "approved")}
                                                        className="flex-1 bg-stone-900 h-16 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-stone-900/20 hover:scale-[1.01] transition-all"
                                                    >
                                                        Confirm & Create Tenancy
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleAction(app.id, "rejected")}
                                                        variant="outline"
                                                        className="flex-1 border-stone-200 h-16 rounded-2xl font-bold uppercase tracking-widest text-xs text-red-500 hover:bg-red-50 hover:border-red-100"
                                                    >
                                                        Reject Application
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                        {app.status === "pending" && (
                                            <>
                                                <button
                                                    onClick={() => handleAction(app.id, "approved")}
                                                    className="h-11 w-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                                                >
                                                    <CheckCircle className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleAction(app.id, "rejected")}
                                                    className="h-11 w-11 rounded-2xl bg-white border border-stone-100 text-stone-400 hover:text-red-500 flex items-center justify-center transition-all shadow-sm"
                                                >
                                                    <XCircle className="h-5 w-5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ApplicationCenter;
