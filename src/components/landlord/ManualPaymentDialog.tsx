import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

interface ManualPaymentDialogProps {
  onPaymentCreated: () => void;
}

const ManualPaymentDialog = ({ onPaymentCreated }: ManualPaymentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);

  const [selectedPaymentId, setSelectedPaymentId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      fetchPendingPayments();
    }
  }, [open]);

  const fetchPendingPayments = async () => {
    // Fetch approved applications that don't have successful rent payments
    const { data, error } = await supabase
      .from("applications")
      .select(`
        *,
        applicant:profiles!applications_user_id_fkey(name, email, photo_url),
        room:rooms(room_name, price, building:buildings(name))
      `)
      .eq("status", "approved")
      .filter("user_id", "not.in", `(${await getUsersWithSuccessfulRentPayments()})`)
      .order("approved_at", { ascending: false });

    if (error) {
      toast.error("Failed to load approved applications");
    } else {
      setPendingPayments(data || []);
    }
  };

  const getUsersWithSuccessfulRentPayments = async (): Promise<string> => {
    const { data } = await supabase
      .from("payments")
      .select("user_id")
      .eq("payment_type", "rent")
      .eq("status", "success");

    return data?.map(p => p.user_id).join(",") || "";
  };

  const handleSubmit = async () => {
    if (!selectedPaymentId) {
      toast.error("Please select an application to mark as paid");
      return;
    }

    setLoading(true);

    try {
      const response = await supabase.functions.invoke("confirm-manual-payment", {
        body: {
          application_id: selectedPaymentId,
          notes,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.success) {
        toast.success("Rent payment recorded successfully");
        setOpen(false);
        resetForm();
        onPaymentCreated();
      } else {
        throw new Error(response.data?.error || "Failed to record payment");
      }
    } catch (error: any) {
      console.error("Payment confirmation error:", error);
      toast.error(error.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedPaymentId("");
    setNotes("");
  };

  const getPaymentDescription = (payment: any) => {
    if (payment.payment_type === "rent") {
      return `Rent for ${payment.application?.room?.room_name} at ${payment.application?.room?.building?.name}`;
    } else if (payment.payment_type === "charge") {
      return `${payment.charge?.name} charge`;
    } else {
      return "Manual payment";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-2xl bg-stone-900 text-white font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-stone-900/20 h-12 px-6">
          <Plus className="h-4 w-4 mr-2" />
          Mark Payment as Received
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Mark Payment as Received</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {pendingPayments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-stone-500">No pending payments to mark as received.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Select Payment</Label>
                <RadioGroup value={selectedPaymentId} onValueChange={setSelectedPaymentId}>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {pendingPayments.map(application => (
                      <div key={application.id} className="flex items-center space-x-3 p-3 rounded-xl border border-stone-100 hover:bg-stone-50">
                        <RadioGroupItem value={application.id} id={application.id} />
                        <label htmlFor={application.id} className="flex-1 cursor-pointer">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full ring-2 ring-white shadow-sm overflow-hidden bg-stone-100">
                                {application.applicant?.photo_url ? (
                                  <img src={application.applicant.photo_url} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center font-bold text-xs text-stone-400">
                                    {application.applicant?.name?.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-stone-900 text-sm">{application.applicant?.name}</p>
                                <p className="text-[10px] text-stone-500 uppercase tracking-widest">
                                  Rent for Room {application.room?.room_name} at {application.room?.building?.name}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-stone-900">₦{Number(application.room?.price).toLocaleString()}</p>
                              <p className="text-[9px] text-stone-400 uppercase tracking-widest">Rent Payment</p>
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
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
            </>
          )}
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
            disabled={loading || pendingPayments.length === 0}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Mark as Received"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualPaymentDialog;
