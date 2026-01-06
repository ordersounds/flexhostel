import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Home, 
  CreditCard, 
  MessageSquare, 
  Bell, 
  LogOut,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight
} from "lucide-react";
import roomInterior from "@/assets/room-interior.jpg";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "applications" | "messages">("overview");

  // Sample application data
  const applications = [
    {
      id: "1",
      roomName: "Alabama",
      status: "pending",
      submittedAt: "2024-01-15",
      price: 450000,
    },
    {
      id: "2",
      roomName: "California",
      status: "approved",
      submittedAt: "2024-01-10",
      price: 480000,
    },
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                Welcome, {user?.user_metadata?.name || user?.email?.split("@")[0] || "Student"}
              </h1>
              <p className="text-muted-foreground">
                Manage your applications and tenancy
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "overview"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <Home className="h-4 w-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("applications")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "applications"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <CreditCard className="h-4 w-4" />
              Applications
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "messages"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              Messages
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Quick Stats */}
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Applications</p>
                    <p className="font-display text-2xl font-bold">{applications.length}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to="/okitipupa/rooms">
                    Apply for a Room
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* Recent Application */}
              {applications.length > 0 && (
                <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50 md:col-span-2">
                  <h3 className="font-display font-semibold text-foreground mb-4">
                    Recent Application
                  </h3>
                  <div className="flex items-center gap-4">
                    <img
                      src={roomInterior}
                      alt="Room"
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        Room {applications[0].roomName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Submitted on {applications[0].submittedAt}
                      </p>
                    </div>
                    <Badge variant={applications[0].status === "approved" ? "success" : "pending"}>
                      {applications[0].status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                      {applications[0].status === "approved" && <CheckCircle className="h-3 w-3 mr-1" />}
                      {applications[0].status.charAt(0).toUpperCase() + applications[0].status.slice(1)}
                    </Badge>
                  </div>
                </div>
              )}

              {/* No Applications */}
              {applications.length === 0 && (
                <div className="bg-card rounded-xl p-8 shadow-sm border border-border/50 md:col-span-2 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <Home className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-2">
                    No Applications Yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Browse our rooms and submit your first application
                  </p>
                  <Button asChild>
                    <Link to="/okitipupa/rooms">Explore Rooms</Link>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Applications Tab */}
          {activeTab === "applications" && (
            <div className="space-y-4">
              {applications.map((app) => (
                <div 
                  key={app.id}
                  className="bg-card rounded-xl p-6 shadow-sm border border-border/50"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <img
                      src={roomInterior}
                      alt="Room"
                      className="h-20 w-32 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-display font-semibold text-foreground">
                          Room {app.roomName}
                        </h3>
                        <Badge variant={app.status === "approved" ? "success" : app.status === "pending" ? "pending" : "destructive"}>
                          {app.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                          {app.status === "approved" && <CheckCircle className="h-3 w-3 mr-1" />}
                          {app.status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Flex Hostel Okitipupa
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Submitted: {app.submittedAt}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xl font-bold text-foreground">
                        ₦{(app.price / 1000).toFixed(0)}k
                      </p>
                      <p className="text-xs text-muted-foreground">/year</p>
                      {app.status === "approved" && (
                        <Button size="sm" className="mt-2">
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === "messages" && (
            <div className="bg-card rounded-xl p-8 shadow-sm border border-border/50 text-center">
              <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">
                No Messages Yet
              </h3>
              <p className="text-muted-foreground">
                Messages with your agent and landlord will appear here once you become a tenant
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
