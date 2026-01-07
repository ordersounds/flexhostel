import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, User, Shield, Camera } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const LandlordSettings = () => {
    const isMobile = useIsMobile();
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        phone_number: "",
        photo_url: ""
    });

    // Password change state
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profileData } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (profileData) {
                setProfile({
                    name: profileData.name || "",
                    email: profileData.email || "",
                    phone_number: profileData.phone_number || "",
                    photo_url: profileData.photo_url || ""
                });
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            toast.error("Failed to load profile");
        }
    };

    const updateProfile = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from("profiles")
                .update({
                    name: profile.name,
                    phone_number: profile.phone_number || null,
                    photo_url: profile.photo_url || null
                })
                .eq("id", user.id);

            if (error) throw error;

            toast.success("Profile updated successfully");
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const changePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("New passwords don't match");
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setChangingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            });

            if (error) throw error;

            toast.success("Password changed successfully");
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });
        } catch (error) {
            console.error("Error changing password:", error);
            toast.error("Failed to change password");
        } finally {
            setChangingPassword(false);
        }
    };

    return (
        <div className={cn("animate-reveal-up", isMobile ? "space-y-6" : "space-y-8")}>
            {/* Header */}
            <div>
                <h2 className={cn("font-display font-bold text-stone-900 tracking-tighter", isMobile ? "text-3xl" : "text-5xl")}>
                    Settings<span className="text-primary">.</span>
                </h2>
                <p className="text-stone-500 mt-1 font-medium" style={{fontSize: isMobile ? '14px' : '18px'}}>
                    Manage your account and preferences.
                </p>
            </div>

            <div className={cn("grid lg:grid-cols-2", isMobile ? "gap-6" : "gap-8")}>
                {/* Profile Settings */}
                <Card className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm">
                    <CardHeader className="pb-6">
                        <CardTitle className="flex items-center gap-3 text-lg font-bold text-stone-900 uppercase tracking-widest text-sm">
                            <User className="h-5 w-5" />
                            Profile Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-bold text-stone-700 uppercase tracking-widest">
                                Full Name
                            </Label>
                            <Input
                                id="name"
                                type="text"
                                value={profile.name}
                                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                                className="rounded-xl border-stone-200 focus:border-primary"
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-bold text-stone-700 uppercase tracking-widest">
                                Email Address
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={profile.email}
                                disabled
                                className="rounded-xl border-stone-200 bg-stone-50 text-stone-500"
                            />
                            <p className="text-xs text-stone-500">Email cannot be changed</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-bold text-stone-700 uppercase tracking-widest">
                                Phone Number
                            </Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={profile.phone_number}
                                onChange={(e) => setProfile(prev => ({ ...prev, phone_number: e.target.value }))}
                                className="rounded-xl border-stone-200 focus:border-primary"
                                placeholder="Enter your phone number"
                            />
                        </div>

                        <Button
                            onClick={updateProfile}
                            disabled={loading}
                            className="w-full rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold uppercase tracking-widest text-sm"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Update Profile"
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Password Settings */}
                <Card className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm">
                    <CardHeader className="pb-6">
                        <CardTitle className="flex items-center gap-3 text-lg font-bold text-stone-900 uppercase tracking-widest text-sm">
                            <Shield className="h-5 w-5" />
                            Change Password
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword" className="text-sm font-bold text-stone-700 uppercase tracking-widest">
                                Current Password
                            </Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                className="rounded-xl border-stone-200 focus:border-primary"
                                placeholder="Enter current password"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newPassword" className="text-sm font-bold text-stone-700 uppercase tracking-widest">
                                New Password
                            </Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                className="rounded-xl border-stone-200 focus:border-primary"
                                placeholder="Enter new password"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-sm font-bold text-stone-700 uppercase tracking-widest">
                                Confirm New Password
                            </Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                className="rounded-xl border-stone-200 focus:border-primary"
                                placeholder="Confirm new password"
                            />
                        </div>

                        <Button
                            onClick={changePassword}
                            disabled={changingPassword}
                            className="w-full rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold uppercase tracking-widest text-sm"
                        >
                            {changingPassword ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Changing...
                                </>
                            ) : (
                                "Change Password"
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default LandlordSettings;