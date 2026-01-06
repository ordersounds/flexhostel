import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MessageCenter from "@/components/MessageCenter";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  ArrowUpRight
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [tenancy, setTenancy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "applications" | "payments" | "messages">("overview");
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // Fetch Profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileData?.role === "landlord") {
        navigate("/landlord");
        return;
      }

      setProfile(profileData);

      // Fetch Applications with Room & Building info
      const { data: appData } = await supabase
        .from("applications")
        .select(`
          *,
          rooms (
            room_name,
            price,
            cover_image_url,
            buildings (
              name,
              address
            )
          )
        `)
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      setApplications(appData || []);

      // Fetch Active Tenancy with Room & Building info
      const { data: tenancyData } = await supabase
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
        .eq("tenant_id", session.user.id)
        .eq("status", "active")
        .maybeSingle();

      setTenancy(tenancyData);

      // Fetch Announcements
      if (tenancyData?.rooms?.buildings?.id) {
        const { data: annData } = await supabase
          .from("announcements")
          .select("*")
          .eq("building_id", tenancyData.rooms.buildings.id)
          .order("created_at", { ascending: false });
        setAnnouncements(annData || []);
      }

      setLoading(false);
    };

    fetchData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Identity disconnected");
    navigate("/");
  };

  const handlePayment = (application: any) => {
    const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_placeholder";

    // Check if Paystack script is loaded
    if (!(window as any).PaystackPop) {
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      script.onload = () => initiatePaystack(application, paystackKey);
      document.body.appendChild(script);
    } else {
      initiatePaystack(application, paystackKey);
    }
  };

  const initiatePaystack = (application: any, key: string) => {
    const handler = (window as any).PaystackPop.setup({
      key: key,
      email: user.email,
      amount: application.rooms.price * 100, // Paystack uses kobo
      currency: "NGN",
      ref: `FLEX_${Math.floor(Math.random() * 1000000000 + 1)}`,
      callback: (response: any) => {
        toast.success("Payment successful! Synchronizing tenancy...");
        navigate(`/dashboard/success?reference=${response.reference}`);
      },
      onClose: () => {
        toast.info("Payment session adjourned.");
      },
    });
    handler.openIframe();
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

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-7xl">

          {/* Editorial Dashboard Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16 px-2">
            <div>
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-xs mb-4">
                <ShieldCheck className="h-4 w-4" />
                <span>Verified Resident Dashboard</span>
              </div>
              <h1 className="font-display text-5xl md:text-7xl font-bold text-stone-900 tracking-tighter leading-none">
                {profile?.name?.split(" ")[0] || "Student"}<span className="text-primary">.</span>
              </h1>
              <p className="text-stone-500 text-lg md:text-xl mt-4 max-w-md font-medium">
                Manage your flagship residence in Okitipupa and track your applications.
              </p>
            </div>

            <div className="flex flex-col items-end gap-4 min-w-[200px]">
              <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-full border border-stone-100 shadow-sm">
                <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center overflow-hidden border-2 border-white ring-2 ring-stone-50">
                  {profile?.photo_url ? (
                    <img src={profile.photo_url} alt={profile.name} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-stone-400" />
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-stone-900 uppercase tracking-widest">{profile?.role || "Visitor"}</p>
                  <p className="text-sm text-stone-500 font-medium">{profile?.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="text-stone-400 hover:text-red-500 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Navigation Tabs - Editorial Style */}
          <div className="flex gap-12 border-b border-stone-200 mb-12 overflow-x-auto no-scrollbar px-2">
            {[
              { id: "overview", label: "Overview", icon: Home },
              { id: "applications", label: "Applications", icon: CreditCard },
              { id: "payments", label: "Payments", icon: CheckCircle },
              { id: "messages", label: "Messages", icon: MessageSquare },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-6 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === tab.id
                  ? "text-primary"
                  : "text-stone-400 hover:text-stone-600"
                  }`}
              >
                <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? "scale-110" : "scale-100"} transition-transform`} />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-primary rounded-full transition-all" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="px-2">
            {activeTab === "overview" && (
              <div className="space-y-12">
                {tenancy ? (
                  <div className="grid md:grid-cols-3 gap-12">
                    {/* Main Tenancy Card */}
                    <div className="md:col-span-2">
                      <div className="bg-white rounded-[2.5rem] p-12 border border-stone-100 shadow-xl relative overflow-hidden group">
                        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8 h-full">
                          <div>
                            <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.2em] text-[10px] mb-6">
                              <ShieldCheck className="h-4 w-4" />
                              <span>Flagship Residency Active</span>
                            </div>
                            <h2 className="font-display text-5xl md:text-7xl font-bold text-stone-900 tracking-tighter leading-none mb-4">
                              Suite {tenancy.rooms.room_name}<span className="text-primary">.</span>
                            </h2>
                            <div className="flex items-center gap-3 text-stone-500 font-medium mb-12">
                              <Building2 className="h-4 w-4 text-stone-400" />
                              <span>{tenancy.rooms.buildings.name}</span>
                              <span className="h-1 w-1 rounded-full bg-stone-300" />
                              <span className="text-xs">{tenancy.rooms.buildings.address}</span>
                            </div>

                            <div className="flex gap-4">
                              <Button asChild size="lg" className="rounded-full bg-stone-900 text-white font-bold h-14 px-8 uppercase tracking-widest text-xs">
                                <Link to={`/okitipupa/rooms/${tenancy.rooms.room_name.toLowerCase()}`}>View Details</Link>
                              </Button>
                              <Button size="lg" variant="outline" className="rounded-full border-stone-200 text-stone-900 font-bold h-14 px-8 uppercase tracking-widest text-xs" onClick={() => setActiveTab("payments")}>
                                Ledger
                              </Button>
                            </div>
                          </div>

                          <div className="bg-stone-50 rounded-[2rem] p-8 border border-stone-200/50 min-w-[280px] flex flex-col justify-between">
                            <div>
                              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-6">Concierge</p>
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-stone-200 overflow-hidden ring-4 ring-white shadow-sm">
                                  {tenancy.rooms.agent?.photo_url ? (
                                    <img src={tenancy.rooms.agent.photo_url} alt={tenancy.rooms.agent.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-stone-100 text-stone-400 font-bold">
                                      {tenancy.rooms.agent?.name?.charAt(0)}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-stone-900 leading-tight">{tenancy.rooms.agent?.name}</p>
                                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">Official Agent</p>
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" className="w-full mt-6 rounded-xl bg-white border border-stone-100 text-stone-900 font-bold h-12 uppercase tracking-widest text-[10px]" onClick={() => setActiveTab("messages")}>
                              Direct Line
                            </Button>
                          </div>
                        </div>
                        <div className="absolute top-[-20%] right-[-10%] text-stone-50 font-display text-9xl font-bold opacity-0 group-hover:opacity-100 transition-opacity">Flex</div>
                      </div>
                    </div>

                    {/* Announcements Sidebar */}
                    <div className="space-y-8">
                      <div className="flex items-center justify-between px-2">
                        <h3 className="font-display text-2xl font-bold text-stone-900 tracking-tight">Feed</h3>
                        <Badge variant="outline" className="rounded-full border-stone-200 font-bold uppercase tracking-widest text-[8px] text-stone-400">Updates</Badge>
                      </div>

                      <div className="space-y-4">
                        {announcements.length > 0 ? (
                          announcements.map((ann) => (
                            <div key={ann.id} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
                              <p className="text-[8px] font-bold text-primary uppercase tracking-widest mb-2">{new Date(ann.created_at).toLocaleDateString()}</p>
                              <h4 className="font-display text-lg font-bold text-stone-900 mb-1 leading-tight">{ann.title}</h4>
                              <p className="text-stone-500 text-xs leading-relaxed line-clamp-2">{ann.content}</p>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center border-2 border-dashed border-stone-100 rounded-3xl opacity-40">
                            <p className="text-[10px] font-bold uppercase tracking-widest">No transmissions</p>
                          </div>
                        )}
                      </div>

                      <div className="bg-stone-900 p-8 rounded-[2rem] text-white relative overflow-hidden">
                        <div className="relative z-10">
                          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                            <Sparkles className="h-5 w-5 text-white/50" />
                          </div>
                          <h4 className="font-display text-xl font-bold mb-2">Member Perks</h4>
                          <p className="text-white/40 text-xs leading-relaxed mb-6 font-medium">Flagship tenants get 10% off at our partner cafe.</p>
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1 cursor-pointer hover:translate-x-1 transition-transform">
                            Claim Reward <ArrowUpRight className="h-3 w-3" />
                          </span>
                        </div>
                        <div className="absolute bottom-[-20%] right-[-10%] text-white/5 font-display text-7xl font-bold italic">VIP</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                          <CreditCard className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-display text-2xl font-bold text-stone-900 mb-2">Applications</h3>
                        <p className="text-stone-500 font-medium">You have {applications.length} active threads.</p>
                      </div>
                      <div className="mt-8 pt-8 border-t border-stone-50 flex items-end justify-between">
                        <span className="text-4xl font-bold text-stone-900 tracking-tighter">{applications.length}</span>
                        <Button variant="ghost" className="text-primary font-bold uppercase tracking-widest text-[10px] p-0" onClick={() => setActiveTab("applications")}>
                          View All <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="h-12 w-12 rounded-2xl bg-stone-50 flex items-center justify-center mb-6">
                          <Building2 className="h-6 w-6 text-stone-400" />
                        </div>
                        <h3 className="font-display text-2xl font-bold text-stone-900 mb-2">Suites</h3>
                        <p className="text-stone-500 font-medium">Browse our flagship Okitipupa residence.</p>
                      </div>
                      <Button asChild className="w-full mt-8 rounded-2xl bg-stone-900 text-white font-bold h-14 uppercase tracking-widest text-xs">
                        <Link to="/okitipupa/rooms">Explore Rooms</Link>
                      </Button>
                    </div>

                    <div className="bg-stone-900 rounded-3xl p-8 text-white relative overflow-hidden group h-full h-[280px]">
                      <div className="relative z-10 flex flex-col justify-between h-full">
                        <div>
                          <Sparkles className="h-8 w-8 text-white mb-6" />
                          <h3 className="font-display text-2xl font-bold text-white mb-2">Status</h3>
                          <p className="text-white/40 font-medium">Verified Applicant</p>
                        </div>
                        <div className="text-primary font-bold uppercase tracking-widest text-[10px]">Active Session</div>
                      </div>
                      <div className="absolute top-[20%] right-[-10%] text-white/5 font-display text-9xl font-bold italic">VIP</div>
                    </div>
                  </div>
                )}

                {!tenancy && applications.length > 0 && (
                  <div className="bg-stone-50/50 p-8 rounded-[2.5rem] border border-stone-100">
                    <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-6">Recent Application</h3>
                    <div className="flex flex-col md:flex-row items-center gap-8">
                      <div className="h-32 w-56 rounded-2xl overflow-hidden shadow-xl border-4 border-white">
                        <img src={applications[0].rooms.cover_image_url} alt="Room" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-display text-3xl font-bold text-stone-900">Room {applications[0].rooms.room_name}</h4>
                        <p className="text-stone-500 font-medium">{applications[0].rooms.buildings.name}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className="bg-stone-900 text-white uppercase tracking-widest text-[10px] py-2 px-6">{applications[0].status}</Badge>
                        {applications[0].status === "approved" && (
                          <Button className="bg-primary text-white font-bold h-12 uppercase" onClick={() => handlePayment(applications[0])}>Pay Now</Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "applications" && (
              <div className="space-y-8">
                {applications.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-8">
                    {applications.map((app) => (
                      <div key={app.id} className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm relative group overflow-hidden">
                        <div className="flex justify-between items-start mb-8">
                          <div>
                            <h3 className="font-display text-3xl font-bold text-stone-900 tracking-tight mb-2">Room {app.rooms.room_name}</h3>
                            <p className="text-stone-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                              <Building2 className="h-3 w-3" />
                              {app.rooms.buildings.name}
                            </p>
                          </div>
                          <Badge className={`px-4 py-1.5 rounded-full font-bold uppercase tracking-widest text-[10px] ${app.status === "approved" ? "bg-green-50 text-green-600" :
                            app.status === "rejected" ? "bg-red-50 text-red-600" :
                              "bg-stone-100 text-stone-500"
                            }`}>
                            {app.status}
                          </Badge>
                        </div>

                        <div className="aspect-video rounded-2xl overflow-hidden mb-8 shadow-inner">
                          <img
                            src={app.rooms.cover_image_url || "/placeholder.svg"}
                            alt="Room"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-stone-50">
                          <div>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Yearly Rent</p>
                            <p className="text-2xl font-bold text-stone-900">₦{(app.rooms.price / 1000).toLocaleString()}k</p>
                          </div>
                          {app.status === "approved" ? (
                            <Button
                              onClick={() => handlePayment(app)}
                              className="rounded-full bg-primary hover:bg-primary/90 text-white font-bold h-12 px-6 uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
                            >
                              Complete Payment
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2 text-stone-400 font-bold uppercase tracking-widest text-[10px]">
                              <Clock className="h-4 w-4" />
                              <span>{app.status === "pending" ? "Awaiting Approval" : "Closed"}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-24 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-stone-100">
                    <DoorOpen className="h-16 w-16 text-stone-200 mx-auto mb-6" />
                    <h3 className="font-display text-4xl font-bold text-stone-300 mb-4 tracking-tight">No active searches.</h3>
                    <p className="text-stone-400 text-lg mb-8">Start your application for the flagship residency in Okitipupa.</p>
                    <Button asChild size="lg" className="rounded-full bg-stone-900 text-white font-bold h-16 px-12 uppercase tracking-widest text-xs">
                      <Link to="/okitipupa/rooms">Explore Rooms</Link>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "payments" && (
              <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-stone-100 shadow-sm text-center">
                <div className="max-w-md mx-auto py-12">
                  <div className="h-20 w-20 rounded-full bg-stone-50 flex items-center justify-center mx-auto mb-8 border border-stone-100">
                    <CreditCard className="h-8 w-8 text-stone-300" />
                  </div>
                  <h3 className="font-display text-3xl font-bold text-stone-900 mb-4 tracking-tight">Financial Records.</h3>
                  <p className="text-stone-500 text-lg mb-8 leading-relaxed">
                    Once you've made a payment for your room, your receipts and upcoming charges will appear in this ledger.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "messages" && (
              <MessageCenter
                userId={user?.id}
                buildingId={tenancy?.rooms?.buildings?.id}
                agentId={tenancy?.rooms?.agent_id}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
