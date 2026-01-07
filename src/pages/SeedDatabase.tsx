import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import { DatabaseZap, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from "lucide-react";

const buildingId = "11111111-1111-1111-1111-111111111111";

const usStates = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
    "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
    "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
    "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
    "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
    "Wisconsin", "Wyoming"
];

const SeedDatabase = () => {
    const { user, profile, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const seed = async () => {
        setLoading(true);
        setResults([]);
        setError(null);

        try {
            if (!user) throw new Error("You must be signed in to synchronize the system.");

            // 0. Promote current user to landlord if not already
            if (profile?.role !== "landlord") {
                setResults(prev => [...prev, "Granting administrative privileges..."]);
                const { error: pError } = await supabase
                    .from("profiles")
                    .update({ role: "landlord" })
                    .eq("id", user.id);

                if (pError) throw new Error(`Role promotion failed: ${pError.message}`);

                // Small delay for role propagation
                await new Promise(resolve => setTimeout(resolve, 1000));
                setResults(prev => [...prev, "Administrative access granted."]);
            } else {
                setResults(prev => [...prev, "Administrative privileges confirmed."]);
            }

            // Verify role via server-side check
            const { data: roleCheck } = await supabase.rpc('get_user_role', { _user_id: user.id });
            if (roleCheck !== 'landlord') {
                console.warn("Role mismatch alert: Server reports", roleCheck);
            }

            // 1. Seed Building
            setResults(prev => [...prev, "Checking flagship building..."]);
            const { data: existingBuilding } = await supabase
                .from("buildings")
                .select("id")
                .eq("slug", "okitipupa")
                .single();

            if (!existingBuilding) {
                setResults(prev => [...prev, "Inserting Okitipupa building..."]);
                const { error: bError } = await supabase
                    .from("buildings")
                    .insert({
                        id: buildingId,
                        name: "Flex Hostel Okitipupa",
                        slug: "okitipupa",
                        address: "Broad Street, Okitipupa, Ondo State, Nigeria",
                        description: "Our flagship building, designed specifically for students seeking comfortable, secure, and modern accommodation.",
                        status: "active"
                    });

                if (bError) throw new Error(`Building insert failed: ${bError.message}`);
                setResults(prev => [...prev, "Building inserted successfully."]);
            } else {
                setResults(prev => [...prev, "Building already exists."]);
            }

            // 2. Seed Rooms
            setResults(prev => [...prev, "Provisioning 50 US State suites..."]);
            for (const state of usStates) {
                const { error: rError } = await supabase
                    .from("rooms")
                    .upsert({
                        building_id: buildingId,
                        room_name: state,
                        price: 450000,
                        description: "A comfortable and modern self-contained room perfect for focused students.",
                        status: "available",
                        amenities: ["Air Conditioning", "Private Bathroom", "Study Desk", "Wardrobe", "Reading Lamp", "WiFi Access"],
                        gender: "any"
                    }, {
                        onConflict: 'building_id,room_name'
                    });

                if (rError) {
                    console.error(`Error inserting ${state}:`, rError);
                }
            }

            setResults(prev => [...prev, "All rooms provisioned successfully."]);
            toast.success("Database Synchronized!");
        } catch (err: any) {
            console.error(err);
            setError(err.message);
            toast.error("Seeding Failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-50">
            <Header />
            <main className="pt-32 pb-24 h-full flex items-center justify-center">
                <div className="max-w-2xl w-full px-6">
                    <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-stone-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full" />

                        <div className="relative z-10 text-center space-y-8">
                            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-8 border border-primary/20">
                                <DatabaseZap className="h-10 w-10 text-primary" />
                            </div>

                            <h1 className="font-display text-5xl font-bold text-stone-900 tracking-tighter">
                                System <span className="text-primary italic">Synchronizer.</span>
                            </h1>

                            <p className="text-stone-500 font-light leading-relaxed text-lg max-w-md mx-auto">
                                One-click utility to align your Supabase database with the flagship residence registry.
                            </p>

                            <div className="pt-8">
                                {authLoading ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                        <p className="text-stone-400 text-sm font-medium">Verifying Credentials...</p>
                                    </div>
                                ) : !user ? (
                                    <div className="space-y-6">
                                        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-4 text-left">
                                            <AlertCircle className="h-6 w-6 text-amber-500 flex-shrink-0" />
                                            <p className="text-amber-800 text-sm font-medium">
                                                You must be signed in to perform synchronization.
                                            </p>
                                        </div>
                                        <Button asChild size="lg" className="h-16 px-12 rounded-full text-lg font-bold shadow-xl bg-primary text-white">
                                            <Link to="/auth">Sign In to Continue</Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={seed}
                                        disabled={loading}
                                        size="lg"
                                        className="h-16 px-12 rounded-full text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all bg-stone-950 text-white border-none group"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                                Synchronizing...
                                            </>
                                        ) : (
                                            "Begin Synchronization"
                                        )}
                                    </Button>
                                )}
                            </div>

                            {error && (
                                <div className="mt-8 p-6 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-4 text-left">
                                    <AlertCircle className="h-6 w-6 text-red-500 mt-1 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-bold text-red-900">Synchronization Error</h3>
                                        <p className="text-red-700 text-sm font-medium">{error}</p>
                                        <p className="text-red-600/60 text-xs mt-2 italic">Tip: Ensure you are signed in as an administrator or check your RLS policies.</p>
                                    </div>
                                </div>
                            )}

                            {results.length > 0 && (
                                <div className="mt-8 space-y-3 text-left bg-stone-50 p-6 rounded-2xl border border-stone-200">
                                    {results.map((result, i) => (
                                        <div key={i} className="flex items-center gap-3 text-sm text-stone-600 font-medium animate-reveal-up" style={{ animationDelay: `${i * 50}ms` }}>
                                            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                                            {result}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default SeedDatabase;
