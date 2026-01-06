import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, Mail, Lock, User, ArrowLeft, Eye, EyeOff, Sparkles } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    try {
      emailSchema.parse(formData.email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(formData.password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    if (!isLogin && !formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        toast.success("Welcome back to Flex Hostel");
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              name: formData.name,
              role: "applicant" as const,
            },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            throw new Error("This email is already registered. Please sign in instead.");
          }
          throw error;
        }

        toast.success("Account created! We've sent a verification email.");
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during authentication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row">
      {/* Editorial Sidebar - Desktop Only */}
      <div className="hidden md:flex md:w-[45%] bg-primary p-12 flex-col justify-between text-white relative overflow-hidden">
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 text-white/80 hover:text-white transition-colors group">
            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
              <ArrowLeft className="h-5 w-5" />
            </div>
            <span className="font-medium tracking-wide">Return Home</span>
          </Link>
        </div>

        <div className="relative z-10">
          <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Experience <br />
            <span className="text-white/60 italic font-medium">Premium</span> <br />
            Living.
          </h1>
          <p className="text-xl text-white/70 max-w-sm leading-relaxed">
            Join the flagship student residence in Okitipupa. Secure, modern, and community-focused.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm text-white/50 font-medium tracking-widest uppercase">
          <Sparkles className="h-4 w-4" />
          <span>Established 2026 — Okitipupa</span>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="p-6 md:p-8 flex justify-between items-center md:hidden">
          <Link to="/" className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary text-white">
            <Building2 className="h-5 w-5" />
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-24">
          <div className="w-full max-w-lg">
            <div className="mb-12">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-stone-900 mb-4 tracking-tight">
                {isLogin ? "Identity" : "Join Flex"}
              </h2>
              <p className="text-stone-500 text-lg">
                {isLogin
                  ? "Access your dashboard to manage your tenancy."
                  : "Start your application for the Okitipupa residence today."
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-900 uppercase tracking-widest ml-1">
                    Full Name
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400 group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Kolawole Segun"
                      className="w-full h-14 pl-12 pr-4 bg-white border-2 border-stone-100 rounded-2xl text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all text-lg"
                      required
                    />
                  </div>
                  {errors.name && <p className="text-sm text-red-500 font-medium ml-1">{errors.name}</p>}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-900 uppercase tracking-widest ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="student@university.edu"
                    className="w-full h-14 pl-12 pr-4 bg-white border-2 border-stone-100 rounded-2xl text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all text-lg"
                    required
                  />
                </div>
                {errors.email && <p className="text-sm text-red-500 font-medium ml-1">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-bold text-stone-900 uppercase tracking-widest">
                    Password
                  </label>
                  {isLogin && (
                    <button type="button" className="text-xs font-bold text-primary/60 hover:text-primary uppercase tracking-tighter">
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full h-14 pl-12 pr-12 bg-white border-2 border-stone-100 rounded-2xl text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all text-lg"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-500 font-medium ml-1">{errors.password}</p>}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-2xl text-lg font-bold shadow-xl shadow-primary/10 transition-all hover:translate-y-[-2px] active:translate-y-[0px] disabled:opacity-70"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Synchronizing...</span>
                  </div>
                ) : (
                  <span>{isLogin ? "Sign In to Dashboard" : "Create Your Account"}</span>
                )}
              </Button>
            </form>

            <div className="mt-10 pt-10 border-t border-stone-100 text-center">
              <p className="text-stone-500 font-medium">
                {isLogin ? "New to Flex Hostel?" : "Already Have an Account?"}{" "}
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setErrors({}); }}
                  className="text-primary font-bold hover:underline underline-offset-4 decoration-2"
                >
                  {isLogin ? "Start Your Journey" : "Sign In Here"}
                </button>
              </p>
            </div>
          </div>
        </div>

        <footer className="p-8 text-center md:text-left">
          <p className="text-xs text-stone-400 font-medium uppercase tracking-[0.2em]">
            &copy; 2026 Flex Hostel Platform — All Rights Reserved
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Auth;
