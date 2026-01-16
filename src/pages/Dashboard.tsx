import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MessageCenter from "@/components/MessageCenter";
import ChargePaymentDialog from "@/components/tenant/ChargePaymentDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import {
  getChargePaymentStatus,
  type ChargePaymentStatus
} from "@/lib/charge-status";
import {
  Home,
  CreditCard,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  LogOut,
  User,
  MapPin,
  Calendar,
  Building2,
  ShieldCheck,
  DoorOpen,
  Send,
  Image as ImageIcon,
  Sparkles,
  ArrowUpRight,
  AlertCircle
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") as any || "overview";

  const { user, profile, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [tenancy, setTenancy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "applications" | "payments" | "messages" | "announcements">(initialTab);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [charges, setCharges] = useState<any[]>([]);
  const [chargeStatuses, setChargeStatuses] = useState<Map<string, ChargePaymentStatus>>(new Map());
  const [landlordId, setLandlordId] = useState<string | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [payingItem, setPayingItem] = useState<string | null>(null);
  const [selectedCharge, setSelectedCharge] = useState<any>(null);
  const [isChargeDialogOpen, setIsChargeDialogOpen] = useState(false);

  // Derived user stage for accurate Product Owner logic
  const userStage = tenancy
    ? "tenant"
    : applications?.some(a => a.status === "approved")
      ? "approved"
      : applications?.some(a => a.status === "pending")
        ? "pending"
        : "none";

  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as any);
    setSearchParams({ tab });
  };

  // Sync tab with URL if it changes externally
  useEffect(() => {
    const tab = (searchParams.get("tab") as any);
    if (tab && tab !== activeTab) {
      const validTabs = ["overview", "applications", "payments", "messages", "announcements"];
      if (validTabs.includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!user || authLoading) {
        // Wait for user to be loaded by AuthProvider
        setLoading(true);
        return;
      }

      setLoading(true);

      try {
        // Check user role for correct portal access
        if (profile?.role === "landlord") {
          navigate("/landlord");
          return;
        }

        if (profile?.role === "agent") {
          navigate("/agent");
          return;
        }

        if (!isMounted) return;

        setLoading(false);

        // Fetch remaining data in background (non-blocking)
        const [appResult, tenancyResult] = await Promise.all([
          supabase
            .from("applications")
            .select(`
              *,
              rooms (
                id,
                room_name,
                price,
                cover_image_url,
                agent_id,
                buildings (
                  id,
                  name,
                  address
                )
              )
            `)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("tenancies")
            .select(`
              *,
              rooms (
                room_name,
                price,
                cover_image_url,
                buildings (
                  id,
                  name,
                  address
                ),
                agent:profiles!rooms_agent_id_fkey (
                  name,
                  phone_number,
                  photo_url
                )
              )
            `)
            .eq("tenant_id", user.id)
            .eq("status", "active")
            .maybeSingle()
        ]);

        if (!isMounted) return;
        setApplications(appResult.data || []);
        setTenancy(tenancyResult.data);

        // Determine critical building ID for fetching charges/announcements
        // Logic: Resident's building OR the building of an approved application
        const activeBuildingId = tenancyResult.data?.rooms?.buildings?.id ||
          appResult.data?.find(a => a.status === "approved")?.rooms?.buildings?.id;

        if (activeBuildingId) {
          const [annData, chargesData, landlordData, paymentsData] = await Promise.all([
            supabase
              .from("announcements")
              .select("*")
              .or(`building_id.eq.${activeBuildingId},building_id.is.null`)
              .order("created_at", { ascending: false }),
            supabase
              .from("charges")
              .select("*")
              .eq("building_id", activeBuildingId)
              .eq("status", "active"),
            supabase
              .from("profiles")
              .select("id")
              .eq("role", "landlord")
              .limit(1)
              .maybeSingle(),
            supabase
              .from("payments")
              .select("*, charges(name)")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false })
          ]);

          if (isMounted) {
            setAnnouncements(annData.data || []);
            setCharges(chargesData.data || []);
            setLandlordId(landlordData.data?.id || null);
            setPayments(paymentsData.data || []);
          }
        } else {
          // Fetch landlord even without a building context
          const { data: landlordData } = await supabase
            .from("profiles")
            .select("id")
            .eq("role", "landlord")
            .limit(1)
            .maybeSingle();

          if (isMounted) {
            setLandlordId(landlordData?.id || null);
          }
        }
      } catch (error) {
        if (isMounted) {
          toast.error("Something went wrong loading dashboard data.");
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading, profile, navigate]);

  // Fetch comprehensive charge statuses whenever charges or payments update
  useEffect(() => {
    const fetchStatuses = async () => {
      if (!user?.id || !charges.length || !tenancy?.start_date) return;

      const newStatuses = new Map<string, ChargePaymentStatus>();

      for (const charge of charges) {
        try {
          const status = await getChargePaymentStatus(
            user.id,
            charge.id,
            charge.name,
            charge.amount,
            charge.frequency,
            tenancy.start_date
          );
          newStatuses.set(charge.id, status);
        } catch (err) {
          console.error(`Error fetching status for charge ${charge.id}:`, err);
        }
      }

      setChargeStatuses(newStatuses);
    };

    fetchStatuses();
  }, [user?.id, charges, tenancy?.start_date, payments]);

  const { signOut: authSignOut } = useAuth();

  const handleSignOut = async () => {
    await authSignOut();
    toast.success("Identity disconnected");
    navigate("/");
  };

  const handlePayment = async (paymentType: 'rent' | 'charge', application: any, charge?: any) => {
    const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_placeholder";
    const amount = paymentType === 'rent' ? application.rooms.price : charge?.amount;
    const itemId = paymentType === 'rent' ? 'rent' : charge?.id;

    setPayingItem(itemId);

    // Create pending payment record in database first
    const reference = `FLEX_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const paymentData: any = {
      user_id: user.id,
      amount: amount,
      paystack_reference: reference,
      payment_type: paymentType,
      status: 'pending',
    };

    if (paymentType === 'rent') {
      paymentData.application_id = application.id;
    } else if (charge) {
      paymentData.charge_id = charge.id;
    }

    const { error: createError } = await supabase
      .from("payments")
      .insert(paymentData);

    if (createError) {
      console.error("Error creating payment:", createError);
      toast.error("Failed to initiate payment");
      setPayingItem(null);
      return;
    }

    // Check if Paystack script is loaded
    if (!(window as any).PaystackPop) {
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      script.onload = () => initiatePaystack(amount, reference, paystackKey, paymentType);
      document.body.appendChild(script);
    } else {
      initiatePaystack(amount, reference, paystackKey, paymentType);
    }
  };

  const handleChargePayment = (charge: any) => {
    setSelectedCharge(charge);
    setIsChargeDialogOpen(true);
  };

  const handleChargeDialogClose = (open: boolean) => {
    setIsChargeDialogOpen(open);
    if (!open) {
      setSelectedCharge(null);
    }
  };

  const handlePaymentComplete = async () => {
    if (!user?.id) return;

    // Refresh payments data after successful payment to trigger status updates
    const { data } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setPayments(data);
      // The useEffect for chargeStatuses will trigger automatically because payments changed
      toast.success("Payments updated successfully!");
    }
  };

  const initiatePaystack = (amount: number, reference: string, key: string, paymentType: string) => {
    const handler = (window as any).PaystackPop.setup({
      key: key,
      email: user.email,
      amount: amount * 100, // Paystack uses kobo
      currency: "NGN",
      ref: reference,
      callback: (response: any) => {
        toast.success("Payment successful! Verifying...");
        navigate(`/dashboard/success?reference=${response.reference}&type=${paymentType}`);
      },
      onClose: () => {
        toast.info("Payment session closed.");
        setPayingItem(null);
      },
    });
    handler.openIframe();
  };

  // Check if a specific charge is fully up to date (no arrears)
  const isChargeFullyPaid = (chargeId: string) => {
    const status = chargeStatuses.get(chargeId);
    return status?.isUpToDate ?? false;
  };

  // Check if rent has been paid for the approved application
  const isRentPaid = (applicationId: string) => {
    return payments.some(p => p.application_id === applicationId && p.payment_type === 'rent' && p.status === 'success');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="font-display text-stone-400 font-medium uppercase tracking-widest">Synchronizing Identity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />
      <main className="min-h-screen pt-24 pb-20 bg-stone-50">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Refined Header: Senior UX */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 px-2">
            <div>
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px] mb-3">
                {userStage === "tenant" ? (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Resident Portfolio Active</span>
                  </>
                ) : userStage === "approved" ? (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Booking Finalization</span>
                  </>
                ) : (
                  <>
                    <User className="h-3.5 w-3.5" />
                    <span>Applicant Status</span>
                  </>
                )}
              </div>
              <h1 className="font-display text-5xl md:text-7xl font-bold text-stone-900 tracking-tighter leading-none">
                Hello, {profile?.name?.split(" ")[0] || "Student"}<span className="text-primary">.</span>
              </h1>
              <p className="text-stone-500 text-lg md:text-xl mt-4 max-w-lg font-medium">
                {userStage === "tenant"
                  ? "Everything you need to manage your premium residence in Okitipupa."
                  : userStage === "approved"
                    ? "Your application is successful. Complete your booking to secure your suite."
                    : applications.length > 0
                      ? "Track your application and connect with our flagship hostel team."
                      : "Find your perfect room and start your flagship residency."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {tenancy && (
                <Badge variant="outline" className="rounded-full bg-white border-stone-200 px-4 py-1.5 font-bold uppercase tracking-widest text-[9px] text-stone-600 shadow-sm">
                  Suite {tenancy.rooms.room_name}
                </Badge>
              )}
              {userStage === "approved" && (
                <Badge className="rounded-full bg-green-50 text-green-700 border border-green-100 px-4 py-1.5 font-bold uppercase tracking-widest text-[9px] shadow-sm">
                  Approved
                </Badge>
              )}
            </div>
          </div>

          {/* Dynamic Tab Navigation: The "Product Owner" Filter */}
          <div className="relative mb-12 px-2">
            <div className="flex gap-10 border-b border-stone-200 overflow-x-auto no-scrollbar pb-px">
              {[
                {
                  id: "overview",
                  label: userStage === "tenant" ? "Residency" : userStage === "none" ? "Get Started" : "Status",
                  icon: userStage === "tenant" ? Building2 : (userStage === "none" ? Sparkles : Clock)
                },
                ...(userStage === "tenant" ? [
                  { id: "payments", label: "Ledger", icon: CreditCard },
                  { id: "announcements", label: "Announcements", icon: ShieldCheck },
                ] : []),
                ...(userStage !== "none" ? [{ id: "messages", label: "Messages", icon: MessageSquare }] : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as any)}
                  className={`flex items-center gap-2.5 pb-5 text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${activeTab === tab.id
                    ? "text-primary"
                    : "text-stone-400 hover:text-stone-600"
                    }`}
                >
                  <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? "scale-110" : "scale-100"} transition-transform`} />
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-primary rounded-full" />
                  )}
                </button>
              ))}
            </div>
            {/* Mobile Scroll Hint Gradient */}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-stone-50 to-transparent pointer-events-none md:hidden" />
          </div>

          {/* Tab Content */}
          <div className="px-2">
            {activeTab === "overview" && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-500">
                {tenancy ? (
                  <div className="grid lg:grid-cols-12 gap-8 items-start">
                    {/* Primary Residency Context */}
                    <div className="lg:col-span-8 space-y-8">
                      <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-stone-100 shadow-xl shadow-stone-200/40 relative overflow-hidden group">
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px] mb-6">
                            <ShieldCheck className="h-4 w-4" />
                            <span>Verified Residency Active</span>
                          </div>

                          <div className="flex flex-col md:flex-row justify-between gap-8">
                            <div className="flex-1">
                              <h2 className="font-display text-5xl md:text-6xl font-bold text-stone-900 tracking-tighter leading-none mb-4">
                                Suite {tenancy.rooms.room_name}<span className="text-primary">.</span>
                              </h2>
                              <div className="flex items-center gap-3 text-stone-500 font-medium mb-8">
                                <Building2 className="h-4 w-4 text-stone-400" />
                                <span>{tenancy.rooms.buildings.name}</span>
                                <span className="h-1 w-1 rounded-full bg-stone-300" />
                                <span className="text-xs">{tenancy.rooms.buildings.address}</span>
                              </div>

                              <div className="grid grid-cols-2 gap-6 mb-8 pt-6 border-t border-stone-50">
                                <div>
                                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-[0.15em] mb-1.5">Tenancy Period</p>
                                  <p className="text-sm font-bold text-stone-800">
                                    {new Date(tenancy.start_date).getFullYear()} – {new Date(tenancy.end_date).getFullYear()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-[0.15em] mb-1.5">Days Active</p>
                                  <p className="text-sm font-bold text-stone-800">
                                    {Math.ceil((new Date().getTime() - new Date(tenancy.start_date).getTime()) / (1000 * 3600 * 24))} Days
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-4">
                                <Button asChild size="lg" className="rounded-full bg-stone-900 text-white font-bold h-12 px-8 uppercase tracking-widest text-[10px]">
                                  <Link to={`/okitipupa/rooms/${tenancy.rooms.room_name.toLowerCase()}`}>View Room</Link>
                                </Button>
                                <Button size="lg" variant="outline" className="rounded-full border-stone-200 text-stone-900 font-bold h-12 px-8 uppercase tracking-widest text-[10px]" onClick={() => handleTabChange("messages")}>
                                  Support
                                </Button>
                              </div>
                            </div>

                            <div className="w-full md:w-64 aspect-square rounded-3xl overflow-hidden border-8 border-white shadow-xl rotate-1 group-hover:rotate-0 transition-all duration-500">
                              <img src={tenancy.rooms.cover_image_url || "/placeholder.svg"} alt="Your Room" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-[-20%] right-[-10%] text-stone-50 font-display text-9xl font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Home</div>
                      </div>

                      {/* Recent Fees/Ledger Preview */}
                      <div className="bg-stone-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                          <div>
                            <h3 className="font-display text-2xl font-bold mb-1">Financial Standing</h3>
                            <p className="text-white/40 text-sm font-medium">Your yearly rent is fully covered.</p>
                          </div>
                          <Button variant="ghost" className="text-primary font-bold uppercase tracking-widest text-[10px] hover:bg-white/5" onClick={() => handleTabChange("payments")}>
                            Full Ledger <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>

                        {/* Show charges for tenants - Enhanced Design */}
                        {charges.length > 0 && (
                          <div className="mt-8 pt-8 border-t border-white/10">
                            <div className="flex items-center gap-2 mb-6">
                              <CreditCard className="h-4 w-4 text-primary" />
                              <h4 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Current Building Charges</h4>
                            </div>
                            <div className="space-y-3">
                              {charges.map(charge => {
                                const status = chargeStatuses.get(charge.id);
                                const isFullyPaid = status?.isUpToDate ?? false;
                                const hasArrears = (status?.unpaidPeriods.length ?? 0) > 1;

                                return (
                                  <div key={charge.id} className="group">
                                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10 group-hover:border-primary/20 transition-all">
                                      <div className="flex-1 min-w-0 mr-3">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                          <p className="font-bold text-white group-hover:text-primary transition-colors truncate">{charge.name}</p>
                                          {isFullyPaid && (
                                            <Badge className={`text-[6px] font-bold uppercase tracking-widest px-1.5 py-0.5 flex-shrink-0 ${status?.chosenFrequency === 'yearly'
                                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                              }`}>
                                              {status?.chosenFrequency === 'yearly' ? 'Annual' : 'Monthly'}
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-white/60 text-sm mt-0.5 truncate">
                                          ₦{charge.amount.toLocaleString()} • {charge.frequency}
                                        </p>
                                        {status && !isFullyPaid && (
                                          <p className="text-amber-400 text-[10px] mt-1 font-bold uppercase tracking-wider">
                                            {hasArrears ? `${status.unpaidPeriods.length} Periods Due` : 'Pending Current'}
                                          </p>
                                        )}
                                      </div>
                                      {isFullyPaid ? (
                                        <Badge className="bg-green-500/20 text-green-300 border border-green-500/30 text-[8px] tracking-widest font-bold uppercase px-3 py-1 flex flex-col items-start gap-1 h-auto flex-shrink-0">
                                          <span className="flex items-center whitespace-nowrap">
                                            <CheckCircle className="h-3 w-3 mr-1" /> Paid
                                          </span>
                                          {status?.isUpToDate && status.paidPeriods.length > 0 && status.chosenFrequency === 'yearly' && (
                                            <span className="text-[7px] opacity-80 border-t border-green-500/30 pt-1 mt-0.5 w-full whitespace-nowrap">
                                              {status.paidPeriods[status.paidPeriods.length - 1].label}
                                            </span>
                                          )}
                                        </Badge>
                                      ) : (
                                        <Button
                                          onClick={() => handleChargePayment(charge)}
                                          disabled={payingItem === charge.id}
                                          size="sm"
                                          className={cn(
                                            "font-bold text-xs uppercase tracking-widest px-4 py-2 transition-all",
                                            hasArrears ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-primary hover:bg-primary/90 text-white"
                                          )}
                                        >
                                          {payingItem === charge.id ? (
                                            <>
                                              <span className="h-2 w-2 border border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
                                              Processing...
                                            </>
                                          ) : (
                                            <>
                                              <ArrowUpRight className="h-3 w-3 mr-1" />
                                              {hasArrears ? "Pay Arrears" : "Pay Now"}
                                            </>
                                          )}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sidebar: Announcements & Agent */}
                    <div className="lg:col-span-4 space-y-8">
                      <div className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="font-display text-xl font-bold text-stone-900 tracking-tight">Concierge</h3>
                          <Badge className="bg-primary/10 text-primary border-none text-[8px] tracking-widest font-bold uppercase">Official</Badge>
                        </div>

                        <div className="flex items-center gap-4 mb-8">
                          <div className="h-14 w-14 rounded-2xl bg-stone-200 overflow-hidden ring-4 ring-white shadow-sm border border-stone-100">
                            {tenancy.rooms.agent?.photo_url ? (
                              <img src={tenancy.rooms.agent.photo_url} alt={tenancy.rooms.agent.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-stone-100 text-stone-400 font-bold">
                                {tenancy.rooms.agent?.name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-stone-900 leading-tight">{tenancy.rooms.agent?.name || "Assigning Agent..."}</p>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Property Assistant</p>
                          </div>
                        </div>

                        <Button className="w-full rounded-2xl bg-stone-50 border border-stone-100 text-stone-900 hover:bg-stone-100 font-bold h-12 uppercase tracking-widest text-[10px]" onClick={() => {
                          handleTabChange("messages");
                          // Store the intended channel in localStorage so MessageCenter can pick it up
                          localStorage.setItem('flexhostel-intended-channel', 'agent');
                        }}>
                          <MessageSquare className="h-4 w-4 mr-2" /> Open Conversation
                        </Button>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                          <h3 className="font-display text-xl font-bold text-stone-900 tracking-tight">Building Feed</h3>
                        </div>
                        <div className="space-y-4">
                          {announcements.slice(0, 2).map((ann) => (
                            <div key={ann.id} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:border-primary/20 transition-colors">
                              <p className="text-[8px] font-bold text-primary uppercase tracking-widest mb-2">{new Date(ann.created_at).toLocaleDateString()}</p>
                              <h4 className="font-display text-lg font-bold text-stone-900 mb-1 leading-tight">{ann.title}</h4>
                              <p className="text-stone-500 text-xs leading-relaxed line-clamp-2">{ann.content}</p>
                            </div>
                          ))}
                          {announcements.length === 0 && (
                            <div className="p-8 text-center border-2 border-dashed border-stone-100 rounded-3xl opacity-40">
                              <p className="text-[10px] font-bold uppercase tracking-widest">No recent alerts</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Building Vitals: V2 Premium transparency */}
                      <div className="bg-stone-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                        <div className="relative z-10">
                          <h3 className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] mb-6">Building Vitals</h3>
                          <div className="space-y-4">
                            {[
                              { label: "Power Grid", status: "Active", dot: "bg-green-500" },
                              { label: "Water Supply", status: "Optimal", dot: "bg-green-500" },
                              { label: "Security", status: "Standard", dot: "bg-green-500" },
                            ].map((vital, i) => (
                              <div key={i} className="flex justify-between items-center">
                                <span className="text-xs text-white/50 font-medium">{vital.label}</span>
                                <div className="flex items-center gap-2">
                                  <span className={`h-1.5 w-1.5 rounded-full ${vital.dot} shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse`} />
                                  <span className="text-[10px] font-bold uppercase tracking-widest">{vital.status}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="absolute bottom-[-20%] right-[-10%] text-white/5 font-display text-7xl font-bold italic rotate-12 group-hover:rotate-0 transition-transform duration-700">LIVE</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Applicant & Focus Views */}
                    <div className="grid md:grid-cols-2 gap-8 items-stretch">
                      {userStage === "approved" || userStage === "pending" ? (
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-stone-100 shadow-xl overflow-hidden relative">
                          <div className="relative z-10">
                            <h3 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-8">
                              {userStage === "approved" ? "Finalize Your Booking" : "Application Status"}
                            </h3>

                            {/* Focus Room Card */}
                            <div className="flex gap-6 items-center mb-10">
                              <div className="h-20 w-32 rounded-2xl overflow-hidden shadow-lg border-2 border-white">
                                <img src={applications[0]?.rooms.cover_image_url || "/placeholder.svg"} alt="Room" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <h4 className="font-display text-3xl font-bold text-stone-900 tracking-tight leading-none mb-1">
                                  Suite {applications[0]?.rooms.room_name}
                                </h4>
                                <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">{applications[0]?.rooms.buildings.name}</p>
                              </div>
                            </div>

                            {userStage === "approved" && (
                              <div className="mt-8 p-6 bg-amber-50 rounded-2xl border border-amber-100/50 flex items-start gap-4 animate-pulse">
                                <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                                <div>
                                  <p className="text-xs font-bold text-amber-800 uppercase tracking-widest">Limited Guarantee</p>
                                  <p className="text-stone-500 text-[11px] font-medium leading-relaxed mt-1">This suite is reserved for you for the next 48 hours. After this period, it will be released back to the general pool.</p>
                                </div>
                              </div>
                            )}

                            {userStage === "approved" && charges.length > 0 && (
                              <div className="space-y-4 mb-10 pt-8 border-t border-stone-100">
                                {/* Rent Payment Section */}
                                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-stone-900 font-bold">Annual Rent</span>
                                    <span className="text-lg font-bold text-stone-900">₦{applications[0]?.rooms.price?.toLocaleString()}</span>
                                  </div>
                                  {isRentPaid(applications[0]?.id) ? (
                                    <Badge className="bg-green-50 text-green-700 border-none text-[8px] tracking-widest font-bold uppercase">Paid</Badge>
                                  ) : (
                                    <Button
                                      onClick={() => handlePayment('rent', applications[0])}
                                      disabled={payingItem === 'rent'}
                                      className="w-full mt-2 h-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-widest"
                                    >
                                      {payingItem === 'rent' ? "Processing..." : "Pay Rent"}
                                    </Button>
                                  )}
                                </div>

                                {/* Charges Section */}
                                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-6">Building Charges</p>
                                {charges.map(charge => (
                                  <div key={charge.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-stone-500 font-medium">{charge.name}</span>
                                      <span className="text-stone-900 font-bold">₦{charge.amount.toLocaleString()}</span>
                                    </div>
                                    {isChargeFullyPaid(charge.id) ? (
                                      <Badge className="bg-green-50 text-green-700 border-none text-[8px] tracking-widest font-bold uppercase">Paid</Badge>
                                    ) : (
                                      <Button
                                        onClick={() => handlePayment('charge', applications[0], charge)}
                                        disabled={payingItem === charge.id}
                                        variant="outline"
                                        className="w-full mt-2 h-10 rounded-xl border-stone-200 font-bold text-xs uppercase tracking-widest"
                                      >
                                        {payingItem === charge.id ? "Processing..." : `Pay ${charge.name}`}
                                      </Button>
                                    )}
                                  </div>
                                ))}

                                <div className="pt-3 mt-3 border-t border-stone-200/50 flex justify-between items-center">
                                  <span className="text-[10px] font-bold text-stone-900 uppercase">Total Initial Payment</span>
                                  <span className="text-lg font-bold text-primary">
                                    ₦{(applications[0]?.rooms.price + charges.reduce((acc, c) => acc + c.amount, 0)).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            )}

                            {userStage === "approved" && charges.length === 0 && (
                              <div className="space-y-4 mb-10 pt-8 border-t border-stone-100">
                                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-stone-900 font-bold">Annual Rent</span>
                                    <span className="text-lg font-bold text-stone-900">₦{applications[0]?.rooms.price?.toLocaleString()}</span>
                                  </div>
                                  {isRentPaid(applications[0]?.id) ? (
                                    <Badge className="bg-green-50 text-green-700 border-none text-[8px] tracking-widest font-bold uppercase">Paid</Badge>
                                  ) : (
                                    <Button
                                      onClick={() => handlePayment('rent', applications[0])}
                                      disabled={payingItem === 'rent'}
                                      className="w-full mt-2 h-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-widest"
                                    >
                                      {payingItem === 'rent' ? "Processing..." : "Pay Rent"}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}

                            {userStage === "pending" && (
                              <div className="space-y-4">
                                <Button variant="outline" className="w-full h-14 rounded-2xl border-stone-100 text-stone-500 font-bold uppercase tracking-widest text-[10px] cursor-default bg-stone-50/50">
                                  <span>Waiting for Official Approval</span>
                                </Button>
                                <p className="text-center text-[10px] font-bold text-stone-300 uppercase tracking-widest">Verification in progress</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-stone-900 rounded-[2.5rem] p-12 text-white relative overflow-hidden flex flex-col justify-between group min-h-[450px]">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
                          <div className="relative z-10">
                            <h3 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-8">Next Step</h3>
                            <h2 className="font-display text-5xl font-bold tracking-tighter leading-tight mb-6">
                              Choose Your <br />
                              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-400">Flagship Suite.</span>
                            </h2>
                            <p className="text-white/40 text-lg leading-relaxed font-medium mb-8 max-w-sm">
                              Welcome to Flex. You haven't started an application yet. Our flagship suites in Okitipupa are moving fast.
                            </p>
                          </div>
                          <Button asChild size="lg" className="relative z-10 w-full md:w-fit rounded-full bg-primary hover:bg-white hover:text-stone-900 text-white font-bold h-16 px-12 uppercase tracking-widest text-xs transition-all">
                            <Link to="/okitipupa/rooms">Browse Available Rooms</Link>
                          </Button>
                        </div>
                      )}

                      <div className="flex flex-col gap-6">
                        <div className="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-sm flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-display text-2xl font-bold text-stone-900 mb-2 tracking-tight">Need Assistance?</h3>
                            <p className="text-stone-500 text-sm leading-relaxed mb-8">
                              Our support team is here to help you find the perfect room for your academic journey.
                            </p>
                          </div>
                          <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl">
                              <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                              </div>
                              <span className="text-xs font-bold text-stone-600">Secure & Verified</span>
                            </div>
                            <Button variant="outline" className="w-full rounded-2xl border-stone-100 h-14 font-bold uppercase tracking-widest text-[10px]">
                              Visit Help Center
                            </Button>
                          </div>
                        </div>

                        <div className="bg-primary/5 rounded-[2.5rem] p-8 border border-primary/10">
                          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-2">Notice</p>
                          <p className="text-stone-600 text-sm font-medium">All applications undergo a background and status verification check.</p>
                        </div>

                        {/* Building Vitals: Consistency in premium branding */}
                        <div className="bg-stone-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                          <div className="relative z-10">
                            <h3 className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] mb-6">Building Vitals</h3>
                            <div className="space-y-4">
                              {[
                                { label: "Power Grid", status: "Active", dot: "bg-green-500" },
                                { label: "Water Supply", status: "Optimal", dot: "bg-green-500" },
                                { label: "Security", status: "Standard", dot: "bg-green-500" },
                              ].map((vital, i) => (
                                <div key={i} className="flex justify-between items-center">
                                  <span className="text-xs text-white/50 font-medium">{vital.label}</span>
                                  <div className="flex items-center gap-2">
                                    <span className={`h-1.5 w-1.5 rounded-full ${vital.dot} shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse`} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{vital.status}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {userStage !== "none" && (
                      <div className="bg-stone-900 rounded-[2.5rem] p-12 text-white relative overflow-hidden flex flex-col justify-between group">
                        <div className="relative z-10">
                          <Sparkles className="h-10 w-10 text-primary mb-8" />
                          <h3 className="font-display text-4xl font-bold mb-4 tracking-tighter">The Journey.</h3>
                          <p className="text-white/40 text-lg leading-relaxed font-medium">As a verified applicant, you are one step away from joining the most exclusive student community in Okitipupa.</p>
                        </div>
                        <div className="relative z-10 pt-12 flex items-center gap-4">
                          <div className="h-1px flex-1 bg-white/10"></div>
                          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
                            {userStage === "approved" ? "Step 3: Secure Booking" : "Step 2: Verification"}
                          </span>
                        </div>
                        <div className="absolute bottom-[-10%] right-[-10%] text-white/5 font-display text-9xl font-bold italic rotate-12">FLEX</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "announcements" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                <div className="flex items-center justify-between mb-8 px-2">
                  <h2 className="font-display text-4xl font-bold text-stone-900 tracking-tight">Building Transmissions</h2>
                  <Badge className="bg-primary/10 text-primary border-none text-[8px] tracking-[0.2em] font-bold uppercase">Official Feed</Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {announcements.length > 0 ? (
                    announcements.map((ann) => (
                      <div key={ann.id} className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-sm hover:border-primary/20 transition-all hover:shadow-md group">
                        <div className="flex justify-between items-start mb-6">
                          <p className="text-[9px] font-bold text-primary uppercase tracking-[0.2em]">{new Date(ann.created_at).toLocaleDateString()}</p>
                          <ShieldCheck className="h-4 w-4 text-stone-200 group-hover:text-primary transition-colors" />
                        </div>
                        <h4 className="font-display text-2xl font-bold text-stone-900 mb-3 leading-tight tracking-tight">{ann.title}</h4>
                        <p className="text-stone-500 text-sm leading-relaxed mb-6 font-medium">{ann.content}</p>
                        <div className="pt-6 border-t border-stone-50 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Office of the Landlord</span>
                          <Button variant="ghost" size="sm" className="text-primary font-bold uppercase tracking-widest text-[9px]">Acknowledged</Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 p-24 text-center border-2 border-dashed border-stone-100 rounded-[3rem] opacity-40">
                      <Sparkles className="h-16 w-16 text-stone-200 mx-auto mb-6" />
                      <p className="font-display text-2xl font-bold text-stone-900 mb-2 tracking-tight">Quiet Hours.</p>
                      <p className="text-stone-500 font-medium">No active transmissions for your building right now.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "payments" && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-500">
                <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-stone-100 shadow-xl overflow-hidden relative">
                  <div className="relative z-10">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-8 border-b border-stone-100">
                      <div>
                        <h2 className="font-display text-4xl md:text-5xl font-bold text-stone-900 tracking-tighter mb-2">Financial Ledger</h2>
                        <p className="text-stone-500 font-medium">Your complete transaction and billing history.</p>
                      </div>

                    </div>

                    {/* Outstanding Charges Section */}
                    {tenancy ? (
                      <div className="space-y-10">
                        {/* Outstanding Charges */}
                        <div className="space-y-6">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-2 bg-primary rounded-full" />
                            <h3 className="font-display text-2xl font-bold text-stone-900">Outstanding Charges</h3>
                            {charges.length > 0 && (
                              <Badge className="bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-bold uppercase tracking-widest px-2 py-1">
                                {charges.filter(c => !isChargeFullyPaid(c.id)).length} Pending
                              </Badge>
                            )}
                          </div>

                          {charges.length > 0 ? (
                            <div className="space-y-4">
                              {charges.map(charge => {
                                const status = chargeStatuses.get(charge.id);
                                const isFullyPaid = status?.isUpToDate ?? false;
                                const hasArrears = (status?.unpaidPeriods.length ?? 0) > 1;

                                return (
                                  <div key={charge.id} className="group">
                                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-5 bg-stone-50 rounded-2xl border border-stone-100 group-hover:border-primary/20 transition-all">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                          <CreditCard className="h-5 w-5 text-stone-400 group-hover:text-primary transition-colors" />
                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <p className="font-bold text-stone-900 truncate group-hover:text-primary transition-colors">{charge.name}</p>
                                              {isFullyPaid && (
                                                <Badge className={`text-[6px] font-bold uppercase tracking-widest px-1.5 py-0.5 ${status?.chosenFrequency === 'yearly'
                                                  ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                                  : 'bg-purple-50 text-purple-700 border border-purple-100'
                                                  }`}>
                                                  {status?.chosenFrequency === 'yearly' ? 'Annual' : 'Monthly'}
                                                </Badge>
                                              )}
                                            </div>
                                            <p className="text-stone-500 text-sm truncate">₦{charge.amount.toLocaleString()} • {charge.frequency}</p>
                                            {status && !isFullyPaid && (
                                              <p className="text-amber-600 text-[10px] mt-1 font-bold uppercase tracking-wider">
                                                {hasArrears ? `${status.unpaidPeriods.length} Periods Due` : 'Pending Current'}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex-shrink-0">
                                        {isFullyPaid ? (
                                          <Badge className="bg-green-50 text-green-700 border border-green-100 text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 flex flex-col items-start gap-1 h-auto">
                                            <span className="flex items-center">
                                              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Paid
                                            </span>
                                            {status?.isUpToDate && status.paidPeriods.length > 0 && status.chosenFrequency === 'yearly' && (
                                              <span className="text-[7px] opacity-80 border-t border-green-200/50 pt-1 mt-0.5 w-full">
                                                {status.paidPeriods[status.paidPeriods.length - 1].label}
                                              </span>
                                            )}
                                          </Badge>
                                        ) : (
                                          <Button
                                            onClick={() => handleChargePayment(charge)}
                                            disabled={payingItem === charge.id}
                                            className={cn(
                                              "h-10 rounded-xl font-bold text-xs uppercase tracking-widest px-4 transition-all",
                                              hasArrears ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-primary hover:bg-primary/90 text-white"
                                            )}
                                          >
                                            {payingItem === charge.id ? (
                                              <>
                                                <span className="h-2 w-2 border border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
                                                Processing...
                                              </>
                                            ) : (
                                              <>
                                                <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                                                {hasArrears ? "Pay Arrears" : "Pay Now"}
                                              </>
                                            )}
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-8 text-center border-2 border-dashed border-stone-100 rounded-2xl bg-stone-50/50">
                              <CreditCard className="h-8 w-8 text-stone-200 mx-auto mb-3" />
                              <p className="text-stone-500 font-bold uppercase tracking-widest text-[10px] mb-1">No Outstanding Charges</p>
                              <p className="text-stone-400 text-sm">Your next billing cycle starts in {new Date(tenancy.end_date).toLocaleDateString()}.</p>
                            </div>
                          )}
                        </div>

                        {/* Payment History Section */}
                        <div className="space-y-6 pt-8 border-t border-stone-100">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-2 bg-stone-300 rounded-full" />
                            <h3 className="font-display text-2xl font-bold text-stone-900">Payment History</h3>
                          </div>

                          {payments.length > 0 ? (
                            <div className="space-y-4">
                              {payments
                                .filter(p => p.status === 'success')
                                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                .map(payment => {
                                  // Determine payment frequency from period data
                                  // Use the same robust heuristic as charge-status.ts
                                  const isLegacyAnnual = payment.period_label && (
                                    payment.period_label.toLowerCase().includes('annual') ||
                                    payment.period_label.includes(' - ')
                                  );
                                  const isAnnual = payment.period_month === null || payment.period_month_end !== null || isLegacyAnnual;

                                  const frequencyLabel = isAnnual ? 'Annual' : 'Monthly';
                                  const frequencyColor = isAnnual ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100';

                                  return (
                                    <div key={payment.id} className="p-5 bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-all">
                                      <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-3 mb-2">
                                            {payment.payment_type === 'rent' ? (
                                              <Building2 className="h-5 w-5 text-primary" />
                                            ) : (
                                              <CreditCard className="h-5 w-5 text-stone-400" />
                                            )}
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-1">
                                                <p className="font-bold text-stone-900 capitalize">
                                                  {/* Show Charge Name if available, otherwise fallback to Type */}
                                                  {payment.charges?.name || `${payment.payment_type} Payment`}
                                                </p>
                                                <Badge className={`${frequencyColor} text-[7px] font-bold uppercase tracking-widest px-2 py-0.5`}>
                                                  {frequencyLabel}
                                                </Badge>
                                              </div>
                                              <p className="text-stone-500 text-xs">
                                                {new Date(payment.created_at).toLocaleString()} • {payment.paystack_reference}
                                              </p>
                                              {(isAnnual || payment.period_label) && (
                                                <p className="text-stone-400 text-[10px] font-medium mt-1">
                                                  {/* Use the explicit label if available, otherwise heuristic */}
                                                  {payment.period_label || `Covers until Dec 31, ${payment.period_year}`}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-lg font-bold text-stone-900">₦{payment.amount.toLocaleString()}</p>
                                          <Badge className="bg-green-50 text-green-700 border border-green-100 text-[8px] font-bold uppercase tracking-widest px-2 py-1 mt-1">
                                            <CheckCircle className="h-3 w-3 mr-1" /> Success
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          ) : (
                            <div className="p-8 text-center border-2 border-dashed border-stone-100 rounded-2xl bg-stone-50/50">
                              <Clock className="h-8 w-8 text-stone-200 mx-auto mb-3" />
                              <p className="text-stone-500 font-bold uppercase tracking-widest text-[10px] mb-1">No Payment History</p>
                              <p className="text-stone-400 text-sm">Your payment transactions will appear here.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-12 text-center border-2 border-dashed border-stone-100 rounded-[2rem] bg-stone-50/30">
                        <CreditCard className="h-12 w-12 text-stone-200 mx-auto mb-4" />
                        <p className="text-stone-500 font-bold uppercase tracking-widest text-[10px]">Portal Locked</p>
                        <p className="text-stone-400 text-sm mt-2">The financial ledger becomes active once you secure your suite.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "messages" && (
              <MessageCenter
                userId={user?.id || ""}
                buildingId={tenancy?.rooms?.buildings?.id || applications.find(a => a.status === 'approved')?.rooms?.buildings?.id}
                agentId={tenancy?.rooms?.agent_id || applications.find(a => a.status === 'approved')?.rooms?.agent_id}
                landlordId={landlordId}
              />
            )}
          </div>
        </div>
      </main >
      <Footer />

      {/* Charge Payment Dialog */}
      {
        selectedCharge && (
          <ChargePaymentDialog
            open={isChargeDialogOpen}
            onOpenChange={handleChargeDialogClose}
            charge={selectedCharge}
            userId={user.id}
            userEmail={user.email}
            tenancyStartDate={tenancy?.start_date}
            onPaymentComplete={handlePaymentComplete}
          />
        )
      }
    </div >
  );
};

export default Dashboard;
