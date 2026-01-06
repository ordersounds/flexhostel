import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Upload, User, School, Users } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Back Link */}
          <Link 
            to={`/okitipupa/rooms/${roomName}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Room Details
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              Apply for Room {displayRoomName}
            </h1>
            <p className="text-muted-foreground">
              Complete the form below to submit your application
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div 
                    className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      currentStep >= step.id 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${
                    currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 md:w-20 h-0.5 mx-2 ${
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
            {/* Step 1: Personal */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-semibold text-foreground mb-4">
                  Personal Information
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.personal.name}
                      onChange={(e) => setFormData({
                        ...formData,
                        personal: { ...formData.personal, name: e.target.value }
                      })}
                      className="w-full h-11 px-4 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.personal.email}
                      readOnly
                      className="w-full h-11 px-4 rounded-lg border border-input bg-muted text-sm text-muted-foreground"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.personal.phone}
                      onChange={(e) => setFormData({
                        ...formData,
                        personal: { ...formData.personal, phone: e.target.value }
                      })}
                      className="w-full h-11 px-4 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="+234 800 000 0000"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: School */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-semibold text-foreground mb-4">
                  School Details
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Institution Name *
                    </label>
                    <input
                      type="text"
                      value={formData.school.institution}
                      onChange={(e) => setFormData({
                        ...formData,
                        school: { ...formData.school, institution: e.target.value }
                      })}
                      className="w-full h-11 px-4 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="e.g., University of Lagos"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Faculty
                    </label>
                    <input
                      type="text"
                      value={formData.school.faculty}
                      onChange={(e) => setFormData({
                        ...formData,
                        school: { ...formData.school, faculty: e.target.value }
                      })}
                      className="w-full h-11 px-4 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="e.g., Sciences"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.school.department}
                      onChange={(e) => setFormData({
                        ...formData,
                        school: { ...formData.school, department: e.target.value }
                      })}
                      className="w-full h-11 px-4 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Matric/Student ID Number *
                    </label>
                    <input
                      type="text"
                      value={formData.school.matricNumber}
                      onChange={(e) => setFormData({
                        ...formData,
                        school: { ...formData.school, matricNumber: e.target.value }
                      })}
                      className="w-full h-11 px-4 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="e.g., 170101001"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Roommate */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-semibold text-foreground mb-4">
                  Roommate Information (Optional)
                </h2>
                
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <input
                    type="checkbox"
                    id="hasRoommate"
                    checked={formData.roommate.hasRoommate}
                    onChange={(e) => setFormData({
                      ...formData,
                      roommate: { ...formData.roommate, hasRoommate: e.target.checked }
                    })}
                    className="h-4 w-4 rounded border-input"
                  />
                  <label htmlFor="hasRoommate" className="text-sm font-medium text-foreground">
                    I will have a roommate (maximum 1 per room)
                  </label>
                </div>

                {formData.roommate.hasRoommate && (
                  <div className="grid md:grid-cols-2 gap-4 pt-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Roommate's Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.roommate.name}
                        onChange={(e) => setFormData({
                          ...formData,
                          roommate: { ...formData.roommate, name: e.target.value }
                        })}
                        className="w-full h-11 px-4 rounded-lg border border-input bg-background text-sm"
                        placeholder="Enter roommate's name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Roommate's Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.roommate.phone}
                        onChange={(e) => setFormData({
                          ...formData,
                          roommate: { ...formData.roommate, phone: e.target.value }
                        })}
                        className="w-full h-11 px-4 rounded-lg border border-input bg-background text-sm"
                        placeholder="+234 800 000 0000"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-border">
                  <h3 className="font-medium text-foreground mb-4">Additional Information</h3>
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg mb-4">
                    <input
                      type="checkbox"
                      id="hasPets"
                      checked={formData.additional.hasPets}
                      onChange={(e) => setFormData({
                        ...formData,
                        additional: { ...formData.additional, hasPets: e.target.checked }
                      })}
                      className="h-4 w-4 rounded border-input"
                    />
                    <label htmlFor="hasPets" className="text-sm font-medium text-foreground">
                      I have pets
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Additional Notes (optional)
                    </label>
                    <textarea
                      value={formData.additional.notes}
                      onChange={(e) => setFormData({
                        ...formData,
                        additional: { ...formData.additional, notes: e.target.value }
                      })}
                      className="w-full h-24 px-4 py-3 rounded-lg border border-input bg-background text-sm resize-none"
                      placeholder="Any special requests or requirements..."
                      maxLength={500}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="font-display text-lg font-semibold text-foreground mb-4">
                  Review Your Application
                </h2>

                {/* Room Info */}
                <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <img
                    src={roomInterior}
                    alt="Room"
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium text-foreground">Room {displayRoomName}</p>
                    <p className="text-sm text-muted-foreground">Flex Hostel Okitipupa</p>
                  </div>
                </div>

                {/* Personal Info */}
                <div>
                  <h3 className="font-medium text-foreground mb-2">Personal Information</h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> {formData.personal.name}</p>
                    <p><span className="text-muted-foreground">Email:</span> {formData.personal.email}</p>
                    <p><span className="text-muted-foreground">Phone:</span> {formData.personal.phone || "-"}</p>
                  </div>
                </div>

                {/* School Info */}
                <div>
                  <h3 className="font-medium text-foreground mb-2">School Details</h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Institution:</span> {formData.school.institution || "-"}</p>
                    <p><span className="text-muted-foreground">Matric Number:</span> {formData.school.matricNumber || "-"}</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  By submitting this application, you confirm that all information provided is accurate.
                </p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              {currentStep < 4 ? (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? "Submitting..." : "Submit Application"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ApplicationForm;
