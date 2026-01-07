import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Send, User, Building2, ShieldCheck, Image as ImageIcon, Sparkles, MessageSquare, Crown } from "lucide-react";
import { toast } from "sonner";

interface MessageCenterProps {
    userId: string;
    buildingId?: string | null;
    agentId?: string | null;
    landlordId?: string | null;
}

type ChannelType = "building" | "agent" | "landlord";

const MessageCenter = ({ userId, buildingId, agentId, landlordId }: MessageCenterProps) => {
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [activeChannel, setActiveChannel] = useState<ChannelType>("building");
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Determine available channels
    const channels: { id: ChannelType; label: string; icon: any; available: boolean }[] = [
        { id: "building", label: "House Chat", icon: Building2, available: !!buildingId },
        { id: "agent", label: "Agent", icon: User, available: !!agentId },
        { id: "landlord", label: "Landlord", icon: Crown, available: !!landlordId && landlordId !== userId },
    ];

    const availableChannels = channels.filter(c => c.available);

    // Set first available channel if current is not available
    useEffect(() => {
        const currentAvailable = channels.find(c => c.id === activeChannel)?.available;
        if (!currentAvailable && availableChannels.length > 0) {
            setActiveChannel(availableChannels[0].id);
        }
    }, [buildingId, agentId, landlordId]);

    useEffect(() => {
        const fetchMessages = async () => {
            setLoading(true);
            let query = supabase
                .from("messages")
                .select(`
                    *,
                    sender:profiles!messages_sender_id_fkey (
                        name,
                        photo_url,
                        role
                    )
                `)
                .order("created_at", { ascending: true });

            if (activeChannel === "building" && buildingId) {
                query = query.eq("building_id", buildingId).is("receiver_id", null);
            } else if (activeChannel === "agent" && agentId) {
                query = query.or(`and(sender_id.eq.${userId},receiver_id.eq.${agentId}),and(sender_id.eq.${agentId},receiver_id.eq.${userId})`);
            } else if (activeChannel === "landlord" && landlordId) {
                query = query.or(`and(sender_id.eq.${userId},receiver_id.eq.${landlordId}),and(sender_id.eq.${landlordId},receiver_id.eq.${userId})`);
            } else {
                setMessages([]);
                setLoading(false);
                return;
            }

            const { data, error } = await query;
            if (error) {
                toast.error("Failed to load messages");
            } else {
                setMessages(data || []);
            }
            setLoading(false);
            scrollToBottom();
        };

        fetchMessages();

        // Realtime subscription
        const channel = supabase
            .channel("realtime-messages")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                },
                async (payload) => {
                    // Verify if message belongs to current channel
                    const isRelevant =
                        (activeChannel === "building" && payload.new.building_id === buildingId && !payload.new.receiver_id) ||
                        (activeChannel === "agent" && (
                            (payload.new.sender_id === userId && payload.new.receiver_id === agentId) ||
                            (payload.new.sender_id === agentId && payload.new.receiver_id === userId)
                        )) ||
                        (activeChannel === "landlord" && (
                            (payload.new.sender_id === userId && payload.new.receiver_id === landlordId) ||
                            (payload.new.sender_id === landlordId && payload.new.receiver_id === userId)
                        ));

                    if (isRelevant) {
                        // Fetch sender profile for the new message
                        const { data: senderData } = await supabase
                            .from("profiles")
                            .select("name, photo_url, role")
                            .eq("id", payload.new.sender_id)
                            .single();

                        setMessages((prev) => [...prev, { ...payload.new, sender: senderData }]);
                        scrollToBottom();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, buildingId, agentId, landlordId, activeChannel]);

    const scrollToBottom = () => {
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }, 100);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        let receiverId: string | null = null;
        let buildingIdForMessage: string | null = null;

        if (activeChannel === "building") {
            buildingIdForMessage = buildingId || null;
        } else if (activeChannel === "agent") {
            receiverId = agentId || null;
        } else if (activeChannel === "landlord") {
            receiverId = landlordId || null;
        }

        const messageData = {
            sender_id: userId,
            content: newMessage,
            building_id: buildingIdForMessage,
            receiver_id: receiverId,
        };

        const { error } = await supabase.from("messages").insert(messageData);

        if (error) {
            toast.error("Failed to send message");
        } else {
            setNewMessage("");
        }
    };

    if (availableChannels.length === 0) {
        return (
            <div className="bg-stone-900 rounded-[2.5rem] p-12 text-white relative overflow-hidden flex flex-col items-center text-center min-h-[500px] justify-center">
                <div className="relative z-10">
                    <div className="h-20 w-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
                        <ShieldCheck className="h-8 w-8 text-white/50" />
                    </div>
                    <h3 className="font-display text-4xl font-bold text-white mb-4 tracking-tight">Access Restricted.</h3>
                    <p className="text-white/40 text-lg max-w-sm mx-auto leading-relaxed font-medium">
                        Channels unlock once your tenancy is finalized. Contact support if you have an approved application.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl overflow-hidden flex flex-col h-[700px]">
            {/* Header */}
            <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                <div className="flex gap-2 flex-wrap">
                    {availableChannels.map((channel) => (
                        <button
                            key={channel.id}
                            onClick={() => setActiveChannel(channel.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                                activeChannel === channel.id 
                                    ? "bg-stone-900 text-white shadow-lg" 
                                    : "text-stone-400 hover:text-stone-600"
                            }`}
                        >
                            <channel.icon className="h-4 w-4" />
                            {channel.label}
                        </button>
                    ))}
                </div>
                <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-stone-300 uppercase tracking-widest">
                    <Sparkles className="h-3 w-3" />
                    <span>Real-time Secure Channel</span>
                </div>
            </div>

            {/* Message List */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-8 space-y-8 bg-stone-50/30 scroll-smooth no-scrollbar"
            >
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="h-8 w-8 border-2 border-stone-200 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                        <MessageSquare className="h-12 w-12 mb-4" />
                        <p className="font-display text-xl font-bold tracking-tight">No transmissions yet.</p>
                        <p className="text-sm font-medium mt-1">Start the conversation below.</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex gap-4 ${msg.sender_id === userId ? "flex-row-reverse" : ""}`}
                        >
                            <div className="h-10 w-10 rounded-xl bg-stone-200 flex-shrink-0 overflow-hidden border border-white ring-2 ring-stone-50 shadow-sm">
                                {msg.sender?.photo_url ? (
                                    <img src={msg.sender.photo_url} alt={msg.sender.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-stone-100 uppercase font-bold text-stone-400 text-xs">
                                        {msg.sender?.name?.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className={`max-w-[70%] space-y-2 ${msg.sender_id === userId ? "text-right" : ""}`}>
                                <div className={`flex items-center gap-2 px-1 ${msg.sender_id === userId ? "justify-end" : ""}`}>
                                    <span className="text-[10px] font-bold text-stone-900 uppercase tracking-widest">{msg.sender?.name}</span>
                                    {msg.sender?.role === "landlord" && (
                                        <Crown className="h-3 w-3 text-amber-500" />
                                    )}
                                    {msg.sender?.role === "agent" && (
                                        <ShieldCheck className="h-3 w-3 text-primary" />
                                    )}
                                    <span className="text-[8px] font-bold text-stone-300 uppercase tracking-widest">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className={`p-4 rounded-[1.5rem] text-sm leading-relaxed shadow-sm ${msg.sender_id === userId
                                    ? "bg-primary text-white rounded-tr-none"
                                    : "bg-white text-stone-700 rounded-tl-none border border-stone-100"
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-stone-100">
                <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                    <button type="button" className="h-12 w-12 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-all">
                        <ImageIcon className="h-5 w-5" />
                    </button>
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your transmission..."
                            className="w-full h-12 pl-6 pr-6 bg-stone-50 border-none rounded-2xl text-stone-900 placeholder:text-stone-300 focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                        />
                    </div>
                    <Button
                        type="submit"
                        className="h-12 w-12 rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:translate-y-[-2px] flex items-center justify-center p-0"
                        disabled={!newMessage.trim()}
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default MessageCenter;
