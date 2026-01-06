import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Upload, User, School, Users, DoorOpen } from "lucide-react";
import roomInterior from "@/assets/room-interior.jpg";

const steps = [
  { id: 1, name: "Personal", icon: User },
  { id: 2, name: "School", icon: School },
  { id: 3, name: "Roommate", icon: Users },
  { id: 4, name: "Review", icon: Check },
];

const ApplicationForm = () => {
  const { roomName } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const displayRoomName = roomName?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Alabama";

  const [formData, setFormData] = useState({
    personal: {
      name: "",
      email: "",
      phone: "",
    },
    school: {
      institution: "",
      faculty: "",
      department: "",
      matricNumber: "",
    },
    roommate: {
      hasRoommate: false,
      name: "",
      email: "",
      phone: "",
      institution: "",
      matricNumber: "",
    },
    additional: {
      hasPets: false,
      petDescription: "",
      notes: "",
    },
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to apply");
        navigate("/auth");
        return;
      }
      setUser(session.user);
      setFormData(prev => ({
        ...prev,
        personal: {
          ...prev.personal,
          name: session.user.user_metadata?.name || "",
          email: session.user.email || "",
        }
      }));
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

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // In a real app, we'd create the application here
      toast.success("Application submitted successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-6 max-w-4xl">

          {/* Editorial Back Button */}
          <div className="mb-12 animate-reveal-up">
            <Link
              to={`/okitipupa/rooms/${roomName}`}
              className="inline-flex items-center gap-2 text-stone-500 hover:text-primary transition-colors group font-bold uppercase tracking-widest text-[10px]"
            >
              <div className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all">
                <ArrowLeft className="h-4 w-4" />
              </div>
              Cancel & Return
            </Link>
          </div>

          <div className="grid lg:grid-cols-12 gap-12">

            {/* Left: Form Content */}
            <div className="lg:col-span-8 space-y-10">

              {/* Header */}
              <div className="animate-reveal-up">
                <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Residence Application</span>
                </div>
                <h1 className="font-display text-4xl md:text-6xl font-black text-stone-900 tracking-tighter leading-[0.9] mb-4">
                  Apply for Suite <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-400">{displayRoomName}.</span>
                </h1>
                <p className="text-lg text-stone-500 font-light max-w-xl leading-relaxed">
                  Complete your residency profile to join the Flex Hostel community in Okitipupa.
                </p>
              </div>

              {/* Minimal Progress Steps */}
              <div className="flex items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-stone-100 animate-reveal-up delay-100 overflow-x-auto">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-3 shrink-0">
                    <div
                      className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all ${currentStep >= step.id
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "bg-stone-50 text-stone-400"
                        }`}
                    >
                      {currentStep > step.id ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <step.icon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${currentStep >= step.id ? "text-stone-900" : "text-stone-400"
                        }`}>
                        Step 0{step.id}
                      </span>
                      <span className={`text-xs font-bold ${currentStep >= step.id ? "text-primary" : "text-stone-300"
                        }`}>
                        {step.name}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="w-4 h-px bg-stone-100 mx-1" />
                    )}
                  </div>
                ))}
              </div>

              {/* Form Card */}
              <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-stone-200/50 border border-stone-100 animate-reveal-up delay-200 min-h-[400px]">

                {/* Step 1: Personal */}
                {currentStep === 1 && (
                  <div className="space-y-8 animate-reveal-up">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Tell us about yourself</h2>
                      <p className="text-stone-500 font-light">Your information is handled with extreme privacy.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-4">Full Legal Name</label>
                        <input
                          type="text"
                          value={formData.personal.name}
                          onChange={(e) => setFormData({
                            ...formData,
                            personal: { ...formData.personal, name: e.target.value }
                          })}
                          className="w-full h-14 px-6 rounded-2xl border border-stone-100 bg-stone-50 text-stone-900 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                          placeholder="Your Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-4">Email Address</label>
                        <input
                          type="email"
                          value={formData.personal.email}
                          readOnly
                          className="w-full h-14 px-6 rounded-2xl border border-stone-50 bg-stone-50 text-stone-400 text-sm font-medium cursor-not-allowed"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-4">Phone Number</label>
                        <input
                          type="tel"
                          value={formData.personal.phone}
                          onChange={(e) => setFormData({
                            ...formData,
                            personal: { ...formData.personal, phone: e.target.value }
                          })}
                          className="w-full h-14 px-6 rounded-2xl border border-stone-100 bg-stone-50 text-stone-900 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                          placeholder="+234 800 000 0000"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: School */}
                {currentStep === 2 && (
                  <div className="space-y-8 animate-reveal-up">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Academic Details</h2>
                      <p className="text-stone-500 font-light">Verify your student status for the residence.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-4">Institution Name</label>
                        <input
                          type="text"
                          value={formData.school.institution}
                          onChange={(e) => setFormData({
                            ...formData,
                            school: { ...formData.school, institution: e.target.value }
                          })}
                          className="w-full h-14 px-6 rounded-2xl border border-stone-100 bg-stone-50 text-stone-900 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                          placeholder="University name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-4">Faculty</label>
                        <input
                          type="text"
                          value={formData.school.faculty}
                          onChange={(e) => setFormData({
                            ...formData,
                            school: { ...formData.school, faculty: e.target.value }
                          })}
                          className="w-full h-14 px-6 rounded-2xl border border-stone-100 bg-stone-50 text-stone-900 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                          placeholder="e.g. Sciences"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-4">Department</label>
                        <input
                          type="text"
                          value={formData.school.department}
                          onChange={(e) => setFormData({
                            ...formData,
                            school: { ...formData.school, department: e.target.value }
                          })}
                          className="w-full h-14 px-6 rounded-2xl border border-stone-100 bg-stone-50 text-stone-900 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                          placeholder="Computer Science"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-4">Matric / Student ID</label>
                        <input
                          type="text"
                          value={formData.school.matricNumber}
                          onChange={(e) => setFormData({
                            ...formData,
                            school: { ...formData.school, matricNumber: e.target.value }
                          })}
                          className="w-full h-14 px-6 rounded-2xl border border-stone-100 bg-stone-50 text-stone-900 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                          placeholder="Official ID"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Roommate */}
                {currentStep === 3 && (
                  <div className="space-y-8 animate-reveal-up">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Living Preferences</h2>
                      <p className="text-stone-500 font-light">Customizing your residence experience.</p>
                    </div>

                    <div className="space-y-6">
                      <div
                        className={`flex items-center gap-4 p-6 rounded-2xl border transition-all cursor-pointer ${formData.roommate.hasRoommate ? "border-primary bg-primary/5 shadow-md" : "border-stone-100 bg-stone-50"
                          }`}
                        onClick={() => setFormData({
                          ...formData,
                          roommate: { ...formData.roommate, hasRoommate: !formData.roommate.hasRoommate }
                        })}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${formData.roommate.hasRoommate ? "bg-primary border-primary" : "border-stone-300 bg-white"
                          }`}>
                          {formData.roommate.hasRoommate && <Check className="h-4 w-4 text-white" />}
                        </div>
                        <span className="text-sm font-bold text-stone-900">I will have a roommate</span>
                      </div>

                      {formData.roommate.hasRoommate && (
                        <div className="grid md:grid-cols-2 gap-6 p-6 bg-stone-50 rounded-[2rem] border border-stone-100 animate-reveal-up">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-4">Partner Name</label>
                            <input
                              type="text"
                              value={formData.roommate.name}
                              onChange={(e) => setFormData({
                                ...formData,
                                roommate: { ...formData.roommate, name: e.target.value }
                              })}
                              className="w-full h-12 px-6 rounded-xl border border-stone-200 bg-white text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-4">Partner Phone</label>
                            <input
                              type="tel"
                              value={formData.roommate.phone}
                              onChange={(e) => setFormData({
                                ...formData,
                                roommate: { ...formData.roommate, phone: e.target.value }
                              })}
                              className="w-full h-12 px-6 rounded-xl border border-stone-200 bg-white text-sm"
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 ml-4">Additional Notes</label>
                        <textarea
                          value={formData.additional.notes}
                          onChange={(e) => setFormData({
                            ...formData,
                            additional: { ...formData.additional, notes: e.target.value }
                          })}
                          className="w-full h-32 px-6 py-4 rounded-2xl border border-stone-100 bg-stone-50 text-stone-900 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium resize-none"
                          placeholder="Pets, dietary needs, or special requirements..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Review */}
                {currentStep === 4 && (
                  <div className="space-y-8 animate-reveal-up">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Final Verification</h2>
                      <p className="text-stone-500 font-light">Confirm your details before submission.</p>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-6 p-6 bg-stone-900 rounded-[2rem] text-white">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                          <DoorOpen className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <p className="text-lg font-bold tracking-tight">Suite {displayRoomName}</p>
                          <p className="text-stone-400 text-sm">Flex Hostel Okitipupa Residency</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Applicant</p>
                          <p className="text-sm font-bold text-stone-900">{formData.personal.name}</p>
                        </div>
                        <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Institution</p>
                          <p className="text-sm font-bold text-stone-900 truncate">{formData.school.institution || "Not specified"}</p>
                        </div>
                      </div>

                      <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100">
                        <p className="text-xs text-stone-500 italic leading-relaxed">
                          "I confirm that all provided information is accurate and I am ready to join the Flex Hostel community."
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons inside card for better mobile flow */}
                <div className="flex justify-between mt-12 pt-10 border-t border-stone-100">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className="h-14 px-8 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-stone-50 transition-all border border-transparent hover:border-stone-200"
                  >
                    Back
                  </Button>

                  {currentStep < 4 ? (
                    <Button
                      onClick={handleNext}
                      className="h-14 px-10 rounded-full font-bold uppercase tracking-widest text-[10px] bg-stone-950 text-white shadow-xl hover:shadow-primary/20 hover:scale-105 transition-all group"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="h-14 px-12 rounded-full font-bold uppercase tracking-widest text-[10px] bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                    >
                      {loading ? "Processing..." : "Submit Application"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Summary Sidebar (Desktop) */}
            <div className="lg:col-span-4 hidden lg:block animate-reveal-up delay-300">
              <div className="bg-white rounded-[2.5rem] p-10 border border-stone-100 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />

                <img src={roomInterior} alt="Suite" className="w-full aspect-square object-cover rounded-[2rem] mb-8" />

                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-stone-900 tracking-tight">Suite Summary</h4>
                    <p className="text-sm text-stone-500 font-light">Your selected accommodation</p>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-stone-50">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary" />
                        Suite
                      </span>
                      <span className="font-bold text-stone-900">{displayRoomName}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary" />
                        Location
                      </span>
                      <span className="font-bold text-stone-900">Okitipupa</span>
                    </div>
                  </div>

                  <div className="p-6 bg-stone-50 rounded-2xl mt-4">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Annual Investment</p>
                    <p className="text-2xl font-black text-stone-900 tracking-tighter">₦450,000</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ApplicationForm;
