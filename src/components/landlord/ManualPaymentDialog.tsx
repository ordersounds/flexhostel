import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

interface ManualPaymentDialogProps {
  onPaymentCreated: () => void;
}

const ManualPaymentDialog = ({ onPaymentCreated }: ManualPaymentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const [charges, setCharges] = useState<any[]>([]);
  
  const [tenantId, setTenantId] = useState("");
  const [paymentType, setPaymentType] = useState<"rent" | "charge" | "manual">("manual");
  const [chargeId, setChargeId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      fetchTenantsAndCharges();
    }
  }, [open]);

  const fetchTenantsAndCharges = async () => {
    // Fetch tenants (profiles with active tenancies or approved applications)
    const { data: tenancyData } = await supabase
      .from("tenancies")
      .select("tenant_id")
      .eq("status", "active");

    const { data: applicationData } = await supabase
      .from("applications")
      .select("user_id")
      .eq("status", "approved");

    // Get unique user IDs
    const userIds = new Set<string>();
    tenancyData?.forEach(t => userIds.add(t.tenant_id));
    applicationData?.forEach(a => userIds.add(a.user_id));

    // Fetch profiles for these users
    if (userIds.size > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", Array.from(userIds));
      
      setTenants(profilesData || []);
    } else {
      setTenants([]);
    }

    // Fetch charges
    const { data: chargeData } = await supabase
      .from("charges")
      .select("*")
      .eq("status", "active");
    
    setCharges(chargeData || []);
  };

  const handleChargeSelect = (chargeIdValue: string) => {
    setChargeId(chargeIdValue);
    const charge = charges.find(c => c.id === chargeIdValue);
    if (charge) {
      setAmount(charge.amount.toString());
    }
  };

  const handleSubmit = async () => {
    if (!tenantId || !amount) {
      toast.error("Please select a tenant and enter an amount");
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("confirm-manual-payment", {
        body: {
          tenant_id: tenantId,
          payment_type: paymentType,
          amount: parseFloat(amount),
          charge_id: paymentType === "charge" ? chargeId : null,
          notes,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.success) {
        toast.success("Manual payment recorded successfully");
        setOpen(false);
        resetForm();
        onPaymentCreated();
      } else {
        throw new Error(response.data?.error || "Failed to create payment");
      }
    } catch (error: any) {
      console.error("Manual payment error:", error);
      toast.error(error.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTenantId("");
    setPaymentType("manual");
    setChargeId("");
    setAmount("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-2xl bg-primary text-white font-bold uppercase tracking-widest text-[10px] h-12 px-6">
          <Plus className="h-4 w-4 mr-2" />
          Record Manual Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Record Manual Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Tenant</Label>
            <Select value={tenantId} onValueChange={setTenantId}>
              <SelectTrigger className="rounded-xl h-12">
                <SelectValue placeholder="Select tenant" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map(tenant => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name} ({tenant.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Payment Type</Label>
            <Select value={paymentType} onValueChange={(v: "rent" | "charge" | "manual") => setPaymentType(v)}>
              <SelectTrigger className="rounded-xl h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rent">Rent Payment</SelectItem>
                <SelectItem value="charge">Charge Payment</SelectItem>
                <SelectItem value="manual">Other Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentType === "charge" && (
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Select Charge</Label>
              <Select value={chargeId} onValueChange={handleChargeSelect}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Select charge" />
                </SelectTrigger>
                <SelectContent>
                  {charges.map(charge => (
                    <SelectItem key={charge.id} value={charge.id}>
                      {charge.name} (₦{Number(charge.amount).toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Amount (₦)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="rounded-xl h-12"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Paid via bank transfer, reference #12345"
              className="rounded-xl min-h-[80px]"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="flex-1 rounded-xl h-12"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 rounded-xl h-12 bg-stone-900"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Record Payment"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualPaymentDialog;
