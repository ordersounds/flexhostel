import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, CheckCircle, XCircle, ChevronRight, User, School, Users, Eye, FileText, Image as ImageIcon, Phone, Mail, GraduationCap } from "lucide-react";
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
import { useIsMobile } from "@/hooks/use-mobile";

const ApplicationCenter = () => {
    const isMobile = useIsMobile();
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("all");

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
        <div className={cn("animate-reveal-up pb-20 w-full max-w-full overflow-hidden", isMobile ? "space-y-8" : "space-y-12")}>
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 w-full">
                <div className="min-w-0 flex-1">
                    <h2 className={cn("font-display font-bold text-stone-900 tracking-tighter transition-all whitespace-nowrap", isMobile ? "text-2xl" : "text-5xl")}>
                        Admissions Queue<span className="text-primary">.</span>
                    </h2>
                    <p className="text-stone-500 mt-2 font-medium opacity-80 break-words" style={{ fontSize: isMobile ? '13px' : '18px' }}>Verify credentials and curate your resident community.</p>
                </div>

                <div className="flex bg-stone-100 p-1 rounded-2xl w-full md:w-auto max-w-full overflow-x-auto no-scrollbar scroll-smooth shrink-0">
                    {["all", "pending", "approved", "rejected"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                                statusFilter === status
                                    ? "bg-white text-stone-900 shadow-sm"
                                    : "text-stone-400 hover:text-stone-600"
                            )}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            <div className={cn("w-full max-w-full bg-white rounded-[2rem] md:rounded-[2.5rem] border border-stone-100 shadow-xl shadow-stone-200/20 overflow-hidden")}>
                {isMobile ? (
                    // Mobile: Card layout
                    <div className="p-4 sm:p-6 space-y-4 w-full">
                        {applications.filter(app => statusFilter === 'all' || app.status === statusFilter).map((app) => (
                            <div key={app.id} className="bg-stone-50/40 rounded-2xl p-4 sm:p-5 border border-stone-100/60 w-full overflow-hidden">
                                <div className="flex items-start justify-between gap-2 mb-4">
                                    <div className="flex items-center gap-3 overflow-hidden min-w-0">
                                        <div className="h-12 w-12 rounded-full ring-4 ring-white shadow-sm overflow-hidden bg-stone-100 flex-shrink-0">
                                            {app.applicant?.photo_url ? (
                                                <img src={app.applicant.photo_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center font-bold text-sm text-stone-400">
                                                    {app.applicant?.name?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-stone-900 leading-tight text-base truncate pr-1">{app.applicant?.name}</p>
                                            <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mt-0.5 truncate max-w-[150px]">{app.applicant?.email}</p>
                                        </div>
                                    </div>
                                    <Badge className={cn(
                                        "px-2.5 py-1 rounded-full font-bold uppercase tracking-widest text-[7px] border-none shadow-sm shrink-0",
                                        app.status === "approved" ? "bg-emerald-50 text-emerald-600" :
                                            app.status === "rejected" ? "bg-red-50 text-red-600" :
                                                "bg-stone-100 text-stone-400"
                                    )}>
                                        {app.status}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-5 bg-stone-50/50 p-3 rounded-xl border border-stone-100/50 w-full">
                                    <div className="space-y-0.5 overflow-hidden min-w-0">
                                        <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">Residence</p>
                                        <p className="text-xs font-bold text-stone-900 truncate">Room {app.room?.room_name}</p>
                                    </div>
                                    <div className="space-y-0.5 overflow-hidden min-w-0">
                                        <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">Building</p>
                                        <p className="text-xs font-bold text-stone-900 truncate">{app.room?.building?.name}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 w-full mt-4">
                                    <div>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" className="w-full rounded-2xl border-stone-200 h-14 font-bold uppercase tracking-widest text-[10px] hover:bg-stone-50 shadow-sm transition-all active:scale-95">
                                                    <Eye className="h-5 w-5 mr-2" /> View Full Details
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="w-[92vw] sm:max-w-md mx-auto bg-white backdrop-blur-3xl rounded-[2rem] border-stone-100 p-0 overflow-hidden shadow-2xl flex flex-col max-h-[90vh] outline-none">
                                                <div className="h-32 bg-stone-900 relative flex-shrink-0">
                                                    <div className="absolute inset-0 opacity-20">
                                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent_70%)]" />
                                                    </div>
                                                    <div className="absolute -bottom-2 left-4 flex items-end gap-3 z-10">
                                                        <div className="h-16 w-16 rounded-xl bg-white p-1 shadow-xl rotate-3 transition-transform hover:rotate-0 duration-500">
                                                            <div className="w-full h-full rounded-lg bg-stone-100 overflow-hidden relative">
                                                                <img src={app.applicant?.photo_url || "/placeholder.svg"} className="w-full h-full object-cover" />
                                                            </div>
                                                        </div>
                                                        <div className="mb-1">
                                                            <h4 className="font-display text-lg font-bold text-white tracking-tight">{app.applicant?.name}</h4>
                                                            <Badge className="bg-white/10 text-white border-none py-0.5 px-2 rounded-full uppercase tracking-widest text-[7px] backdrop-blur-md">Applicant</Badge>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex-1 overflow-y-auto p-6">
                                                    <div className="space-y-6">
                                                        {/* Academic Profile */}
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <div className="h-6 w-6 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                                                                    <School className="h-3 w-3" />
                                                                </div>
                                                                <h5 className="text-sm font-bold text-stone-900">Academic Profile</h5>
                                                            </div>

                                                            <div className="pl-8 space-y-3">
                                                                <div>
                                                                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Institution</p>
                                                                    <p className="text-sm font-medium text-stone-900">{app.submitted_data?.school?.institution || "N/A"}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Faculty / Dept</p>
                                                                    <p className="text-sm font-medium text-stone-900">
                                                                        {app.submitted_data?.school?.faculty ? `${app.submitted_data.school.faculty} • ` : ""}
                                                                        {app.submitted_data?.school?.department || "N/A"}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Level</p>
                                                                    <p className="text-sm font-medium text-stone-900">{app.submitted_data?.school?.level || "N/A"} Level</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Matric Number</p>
                                                                    <p className="text-sm font-mono font-medium text-stone-900">{app.submitted_data?.school?.matricNumber || "N/A"}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Roommate Details */}
                                                        {app.submitted_data?.roommate?.hasRoommate && (
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-4">
                                                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                                        <Users className="h-3 w-3" />
                                                                    </div>
                                                                    <h5 className="text-sm font-bold text-stone-900">Roommate</h5>
                                                                </div>

                                                                <div className="pl-8 p-4 rounded-2xl bg-stone-50 border border-stone-100">
                                                                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Name</p>
                                                                    <p className="text-base font-bold text-stone-900">{app.submitted_data.roommate.name}</p>
                                                                    <div className="mt-2 space-y-1">
                                                                        <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Phone</p>
                                                                        <p className="text-sm font-medium text-stone-900">{app.submitted_data.roommate.phone || "N/A"}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Personal Details */}
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <div className="h-6 w-6 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                                                                    <User className="h-3 w-3" />
                                                                </div>
                                                                <h5 className="text-sm font-bold text-stone-900">Personal Details</h5>
                                                            </div>

                                                            <div className="pl-8 space-y-3">
                                                                <div>
                                                                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Phone Number</p>
                                                                    <p className="text-sm font-medium text-stone-900">{app.applicant?.phone_number || app.submitted_data?.personal?.phone || "N/A"}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Email Address</p>
                                                                    <p className="text-sm font-medium text-stone-900">{app.applicant?.email || "N/A"}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Documents */}
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <div className="h-6 w-6 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                                                                    <FileText className="h-3 w-3" />
                                                                </div>
                                                                <h5 className="text-sm font-bold text-stone-900">Supporting Documents</h5>
                                                            </div>

                                                            <div className="pl-8 space-y-3">
                                                                {app.submitted_data?.school?.studentId && (
                                                                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 cursor-pointer hover:border-primary transition-colors" onClick={() => window.open(app.submitted_data.school.studentId, '_blank')}>
                                                                        <div className="flex items-center gap-2">
                                                                            <FileText className="h-4 w-4 text-primary" />
                                                                            <div>
                                                                                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Student ID</p>
                                                                                <p className="text-xs font-medium text-primary">Click to view document</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {app.submitted_data?.school?.studentAffairsClearance && (
                                                                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 cursor-pointer hover:border-primary transition-colors" onClick={() => window.open(app.submitted_data.school.studentAffairsClearance, '_blank')}>
                                                                        <div className="flex items-center gap-2">
                                                                            <FileText className="h-4 w-4 text-primary" />
                                                                            <div>
                                                                                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Clearance Certificate</p>
                                                                                <p className="text-xs font-medium text-primary">Click to view document</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {!app.submitted_data?.school?.studentId && !app.submitted_data?.school?.studentAffairsClearance && (
                                                                    <p className="text-xs text-stone-400 italic">No documents uploaded</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Additional Notes */}
                                                        {app.submitted_data?.additional?.notes && (
                                                            <div>
                                                                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-2">Additional Notes</p>
                                                                <div className="p-4 rounded-xl bg-stone-50 text-stone-600 text-sm leading-relaxed italic border border-stone-100">
                                                                    "{app.submitted_data.additional.notes}"
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="p-6 border-t border-stone-50 bg-white z-20 flex flex-col gap-3">
                                                    {app.status === "pending" ? (
                                                        <>
                                                            <Button
                                                                onClick={() => handleAction(app.id, "approved")}
                                                                className="w-full bg-stone-900 h-12 rounded-xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-stone-900/20"
                                                            >
                                                                Approve Application
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleAction(app.id, "rejected")}
                                                                variant="outline"
                                                                className="w-full border-stone-200 h-12 rounded-xl font-bold uppercase tracking-widest text-xs text-red-500 hover:bg-red-50 hover:border-red-100"
                                                            >
                                                                Reject Application
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <div className={cn(
                                                            "w-full h-12 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2",
                                                            app.status === "approved" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                                        )}>
                                                            {app.status === "approved" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                                            Application {app.status}
                                                        </div>
                                                    )}
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>

                                    {app.status === "pending" && (
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <Button
                                                onClick={() => handleAction(app.id, "approved")}
                                                className="flex-1 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 font-bold text-[10px] uppercase tracking-widest border-none"
                                            >
                                                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" /> Approve Application
                                            </Button>
                                            <Button
                                                onClick={() => handleAction(app.id, "rejected")}
                                                variant="outline"
                                                className="flex-1 h-14 rounded-2xl bg-white border border-stone-200 text-stone-400 hover:text-red-500 hover:border-red-100 flex items-center justify-center transition-all shadow-sm active:scale-95 font-bold text-[10px] uppercase tracking-widest"
                                            >
                                                <XCircle className="h-5 w-5 mr-2 flex-shrink-0" /> Reject
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Desktop: Table layout
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                            <thead>
                                <tr className="bg-stone-50/50 border-b border-stone-100">
                                    <th className="px-4 py-6 text-[10px] font-bold text-stone-400 uppercase tracking-widest min-w-[200px]">Applicant</th>
                                    <th className="px-4 py-6 text-[10px] font-bold text-stone-400 uppercase tracking-widest min-w-[150px]">Target Residence</th>
                                    <th className="px-4 py-6 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Status</th>
                                    <th className="px-4 py-6 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right min-w-[150px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                                {applications.filter(app => statusFilter === 'all' || app.status === statusFilter).map((app) => (
                                    <tr key={app.id} className="group hover:bg-stone-50/10 transition-colors">
                                        <td className="px-4 sm:px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full ring-4 ring-white shadow-sm flex-shrink-0 overflow-hidden bg-stone-100">
                                                    {app.applicant?.photo_url ? (
                                                        <img src={app.applicant.photo_url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center font-bold text-sm text-stone-400">
                                                            {app.applicant?.name?.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-stone-900 leading-tight text-sm sm:text-base">{app.applicant?.name}</p>
                                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5 truncate max-w-[120px] sm:max-w-none">{app.applicant?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-8 py-6">
                                            <div className="space-y-1">
                                                <p className="font-bold text-stone-900 text-xs sm:text-sm">Room {app.room?.room_name}</p>
                                                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{app.room?.building?.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-8 py-6">
                                            <Badge className={cn(
                                                "px-2 sm:px-3 py-1 rounded-full font-bold uppercase tracking-widest text-[7px] sm:text-[8px] border-none shadow-sm",
                                                app.status === "approved" ? "bg-emerald-50 text-emerald-600" :
                                                    app.status === "rejected" ? "bg-red-50 text-red-600" :
                                                        "bg-stone-100 text-stone-400"
                                            )}>
                                                {app.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 sm:px-8 py-6 text-right">
                                            <div className="flex justify-end gap-1.5 sm:gap-2">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <button className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-white border border-stone-100 text-stone-400 flex items-center justify-center hover:bg-stone-50 transition-colors shadow-sm active:scale-95">
                                                            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
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
                                                                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Level</p>
                                                                            <p className="text-base font-medium text-stone-900">{app.submitted_data?.school?.level || "N/A"} Level</p>
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

                                                                {/* Section 3: Personal Details */}
                                                                <div>
                                                                    <div className="flex items-center gap-3 mb-6">
                                                                        <div className="h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                                                                            <User className="h-4 w-4" />
                                                                        </div>
                                                                        <h5 className="text-sm font-bold text-stone-900 tracking-tight">Personal Details</h5>
                                                                    </div>

                                                                    <div className="grid grid-cols-2 gap-8 pl-11">
                                                                        <div>
                                                                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Phone Number</p>
                                                                            <p className="text-base font-medium text-stone-900">{app.applicant?.phone_number || app.submitted_data?.personal?.phone || "N/A"}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Email Address</p>
                                                                            <p className="text-base font-medium text-stone-900">{app.applicant?.email || "N/A"}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Section 4: Documents */}
                                                                <div>
                                                                    <div className="flex items-center gap-3 mb-6">
                                                                        <div className="h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
                                                                            <FileText className="h-4 w-4" />
                                                                        </div>
                                                                        <h5 className="text-sm font-bold text-stone-900 tracking-tight">Supporting Documents</h5>
                                                                    </div>

                                                                    <div className="pl-11 space-y-4">
                                                                        {app.submitted_data?.school?.studentId && (
                                                                            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 cursor-pointer hover:border-primary transition-colors" onClick={() => window.open(app.submitted_data.school.studentId, '_blank')}>
                                                                                <div className="flex items-center gap-3">
                                                                                    <FileText className="h-5 w-5 text-primary" />
                                                                                    <div>
                                                                                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Student ID</p>
                                                                                        <p className="text-sm font-medium text-primary">Click to view full document</p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {app.submitted_data?.school?.studentAffairsClearance && (
                                                                            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 cursor-pointer hover:border-primary transition-colors" onClick={() => window.open(app.submitted_data.school.studentAffairsClearance, '_blank')}>
                                                                                <div className="flex items-center gap-3">
                                                                                    <FileText className="h-5 w-5 text-primary" />
                                                                                    <div>
                                                                                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Student Affairs Clearance</p>
                                                                                        <p className="text-sm font-medium text-primary">Click to view full document</p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {!app.submitted_data?.school?.studentId && !app.submitted_data?.school?.studentAffairsClearance && (
                                                                            <p className="pl-11 text-sm text-stone-400 italic">No documents uploaded</p>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Section 5: Additional Notes */}
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
                                                            {app.status === "pending" ? (
                                                                <>
                                                                    <Button
                                                                        onClick={() => handleAction(app.id, "approved")}
                                                                        className="flex-1 bg-stone-900 h-16 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-stone-900/20 hover:scale-[1.01] transition-all"
                                                                    >
                                                                        Approve Application
                                                                    </Button>
                                                                    <Button
                                                                        onClick={() => handleAction(app.id, "rejected")}
                                                                        variant="outline"
                                                                        className="flex-1 border-stone-200 h-16 rounded-2xl font-bold uppercase tracking-widest text-xs text-red-500 hover:bg-red-50 hover:border-red-100"
                                                                    >
                                                                        Reject
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <div className={cn(
                                                                    "w-full h-16 rounded-2xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3",
                                                                    app.status === "approved" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                                                )}>
                                                                    {app.status === "approved" ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                                                                    This application has been {app.status}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                                {app.status === "pending" && (
                                                    <div className="flex gap-1.5 sm:gap-2">
                                                        <button
                                                            onClick={() => handleAction(app.id, "approved")}
                                                            className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                                                        >
                                                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(app.id, "rejected")}
                                                            className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-white border border-stone-100 text-stone-400 hover:text-red-500 flex items-center justify-center transition-all shadow-sm active:scale-95"
                                                        >
                                                            <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApplicationCenter;
