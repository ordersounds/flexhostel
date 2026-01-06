import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home, ArrowRight, MessageSquare, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const reference = searchParams.get("reference");

    return (
        <div className="min-h-screen bg-stone-50">
            <Header />

            <main className="pt-32 pb-24">
                <div className="container mx-auto px-6 max-w-4xl text-center">
                    <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-green-50 border border-green-100 mb-12 relative">
                        <CheckCircle2 className="h-12 w-12 text-green-500 relative z-10" />
                        <div className="absolute inset-0 bg-green-500/10 rounded-full animate-ping opacity-20" />
                    </div>

                    <div className="mb-16">
                        <h1 className="font-display text-5xl md:text-7xl font-bold text-stone-900 tracking-tighter mb-6 leading-none animate-in fade-in slide-in-from-bottom-4 duration-700">
                            Payment <br />
                            <span className="text-primary italic font-medium">Confirmed</span>.
                        </h1>
                        <p className="text-stone-500 text-xl md:text-2xl max-w-2xl mx-auto font-medium leading-relaxed">
                            Your transmission has been verified. Welcome to the flagship Flex Hostel residence in Okitipupa.
                        </p>
                        {reference && (
                            <p className="mt-6 text-stone-400 font-mono text-sm uppercase tracking-widest">
                                Ref: {reference}
                            </p>
                        )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 text-left mb-16">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-xl group hover:shadow-2xl transition-all">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                                <MessageSquare className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="font-display text-2xl font-bold text-stone-900 mb-2">Join the Community</h3>
                            <p className="text-stone-500 mb-6 font-medium">The Okitipupa Building House Chat is now active on your dashboard.</p>
                            <Button asChild className="w-full rounded-2xl bg-stone-900 text-white font-bold h-12 uppercase tracking-widest text-[10px]">
                                <Link to="/dashboard">Enter House Chat</Link>
                            </Button>
                        </div>

                        <div className="bg-stone-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden group">
                            <div className="relative z-10">
                                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                                    <Sparkles className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="font-display text-2xl font-bold text-white mb-2">Move-in Ready</h3>
                                <p className="text-white/60 mb-6 font-medium">Your digital key and check-in instructions are being synchronized.</p>
                                <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px]">
                                    <span>Documentation Pending</span>
                                    <ArrowRight className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="absolute bottom-[-20%] right-[-10%] text-white/5 font-display text-7xl font-bold">Flex</div>
                        </div>
                    </div>

                    <Button asChild variant="ghost" className="text-stone-400 hover:text-stone-900 font-bold uppercase tracking-widest text-xs">
                        <Link to="/dashboard" className="flex items-center gap-2">
                            <Home className="h-4 w-4" />
                            Return to Profile
                        </Link>
                    </Button>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default PaymentSuccess;
