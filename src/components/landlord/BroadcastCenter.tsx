import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
    MessageSquare,
    Users,
    Megaphone,
    Send,
    Search,
    Phone,
    Mail,
    Building2,
    Clock,
    Check,
    CheckCheck,
    Image as ImageIcon,
    Paperclip,
    MoreVertical,
    Eye,
    ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface Message {
    id: string;
    content: string;
    sender_id: string;
    receiver_id: string | null;
    building_id: string | null;
    image_url: string | null;
    created_at: string;
    sender?: {
        name: string;
        email: string;
        photo_url: string | null;
        role: string;
    };
}

interface Announcement {
    id: string;
    title: string;
    content: string;
    image_url: string | null;
    building_id: string | null;
    created_by: string;
    created_at: string;
    building?: {
        name: string;
    };
}

interface Building {
    id: string;
    name: string;
    address: string;
}

const BroadcastCenter = () => {
    const isMobile = useIsMobile();
    const [messages, setMessages] = useState<Message[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBuilding, setSelectedBuilding] = useState<string>("");
    const [selectedConversation, setSelectedConversation] = useState<string>("");
    const [viewMode, setViewMode] = useState<'list' | 'chat'>('list'); // Mobile navigation state
    const [newMessage, setNewMessage] = useState("");
    const [newAnnouncement, setNewAnnouncement] = useState({
        title: "",
        content: "",
        building_id: ""
    });
    const [unreadCounts, setUnreadCounts] = useState({
        messages: 0,
        groups: 0,
        announcements: 0
    });
    const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
    const [availableRecipients, setAvailableRecipients] = useState<any[]>([]);
    const [recipientSearch, setRecipientSearch] = useState("");
    const [conversations, setConversations] = useState<any[]>([]);

    // Function to calculate unread counts - can be called externally
    const calculateUnreadCounts = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // For now, using a simple heuristic: messages from last 24 hours are considered unread
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const directMessages = messages.filter(m =>
            m.receiver_id === user.id &&
            new Date(m.created_at) > oneDayAgo
        );

        const groupMessages = messages.filter(m =>
            m.building_id &&
            m.sender_id !== user.id &&
            new Date(m.created_at) > oneDayAgo
        );

        const recentAnnouncements = announcements.filter(a =>
            new Date(a.created_at) > oneDayAgo
        );

        setUnreadCounts({
            messages: directMessages.length,
            groups: groupMessages.length,
            announcements: recentAnnouncements.length
        });
    };

    // Load conversations whenever messages change
    useEffect(() => {
        const loadConversations = async () => {
            const convos = await getUniqueConversations();
            setConversations(convos);
        };
        loadConversations();
    }, [messages, buildings]);

    useEffect(() => {
        fetchBuildings();
        fetchMessages();
        fetchAnnouncements();

        // Set up real-time subscriptions
        const messagesChannel = supabase
            .channel('messages-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'messages' },
                () => {
                    fetchMessages();
                }
            )
            .subscribe();

        const announcementsChannel = supabase
            .channel('announcements-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'announcements' },
                () => {
                    fetchAnnouncements();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(messagesChannel);
            supabase.removeChannel(announcementsChannel);
        };
    }, []);

    const fetchBuildings = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from("buildings")
            .select("id, name, address")
            .eq("landlord_id", user.id);

        if (error) {
            console.error("Buildings fetch error:", error);
        } else {
            setBuildings(data || []);
            if (data && data.length > 0 && !selectedBuilding) {
                setSelectedBuilding(data[0].id);
            }
        }
    };

    const fetchMessages = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from("messages")
            .select(`
                *,
                sender:profiles!messages_sender_id_fkey(name, email, photo_url, role)
            `)
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id},building_id.not.is.null`)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Messages fetch error:", error);
        } else {
            setMessages(data || []);
        }
        setLoading(false);
    };

    const fetchAnnouncements = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from("announcements")
            .select(`
                *,
                building:buildings(name)
            `)
            .eq("created_by", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Announcements fetch error:", error);
        } else {
            setAnnouncements(data || []);
        }
    };

    const fetchRecipients = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            // Get building IDs owned by landlord
            const { data: landlordBuildings, error: buildingsError } = await supabase
                .from("buildings")
                .select("id")
                .eq("landlord_id", user.id);

            if (buildingsError) {
                console.error("Buildings fetch error:", buildingsError);
                setAvailableRecipients([]);
                return;
            }

            if (!landlordBuildings || landlordBuildings.length === 0) {
                console.log("No buildings found for landlord");
                setAvailableRecipients([]);
                return;
            }

            const buildingIds = landlordBuildings.map(b => b.id);
            console.log("Landlord building IDs:", buildingIds);

            // Get room IDs in landlord's buildings
            const { data: rooms, error: roomsError } = await supabase
                .from("rooms")
                .select("id")
                .in("building_id", buildingIds);

            if (roomsError) {
                console.error("Rooms fetch error:", roomsError);
                setAvailableRecipients([]);
                return;
            }

            const roomIds = rooms?.map(r => r.id) || [];
            console.log("Room IDs in landlord buildings:", roomIds);

            // Fetch tenants with active tenancies in landlord's rooms
            const { data: tenants, error: tenantsError } = await supabase
                .from("profiles")
                .select(`
                    id, name, email, role, photo_url
                `)
                .eq("role", "tenant")
                .eq("status", "active");

            if (tenantsError) {
                console.error("Tenants fetch error:", tenantsError);
            }

            // Filter tenants who have active tenancies in landlord's rooms
            let filteredTenants = [];
            if (tenants && tenants.length > 0 && roomIds.length > 0) {
                const tenantIds = tenants.map(t => t.id);
                const { data: tenancies, error: tenanciesError } = await supabase
                    .from("tenancies")
                    .select("tenant_id")
                    .in("tenant_id", tenantIds)
                    .in("room_id", roomIds)
                    .eq("status", "active");

                if (!tenanciesError && tenancies) {
                    const tenantIdsWithActiveTenancies = tenancies.map(t => t.tenant_id);
                    filteredTenants = tenants.filter(t => tenantIdsWithActiveTenancies.includes(t.id));
                }
            }

            // Fetch agents assigned to rooms in landlord's buildings
            const { data: agents, error: agentsError } = await supabase
                .from("profiles")
                .select(`
                    id, name, email, role, photo_url
                `)
                .eq("role", "agent")
                .in("id", roomIds.length > 0 ?
                    (await supabase.from("rooms").select("agent_id").in("id", roomIds)).data?.map(r => r.agent_id).filter(Boolean) || []
                    : []
                );

            if (agentsError) {
                console.error("Agents fetch error:", agentsError);
            }

            // Combine recipients
            const recipients = [
                ...(filteredTenants || []).map(t => ({ ...t, type: 'tenant' })),
                ...(agents || []).map(a => ({ ...a, type: 'agent' }))
            ];

            console.log("Final recipients:", recipients);
            setAvailableRecipients(recipients);

        } catch (error) {
            console.error("Error in fetchRecipients:", error);
            setAvailableRecipients([]);
        }
    };

    const sendMessage = async (receiverId?: string, buildingId?: string) => {
        if (!newMessage.trim()) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from("messages")
            .insert({
                sender_id: user.id,
                receiver_id: receiverId || null,
                building_id: buildingId || null,
                content: newMessage.trim()
            });

        if (error) {
            toast.error("Failed to send message");
            console.error("Message send error:", error);
        } else {
            setNewMessage("");
            toast.success("Message sent");
        }
    };

    const sendAnnouncement = async () => {
        if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from("announcements")
            .insert({
                title: newAnnouncement.title.trim(),
                content: newAnnouncement.content.trim(),
                building_id: newAnnouncement.building_id || null,
                created_by: user.id
            });

        if (error) {
            toast.error("Failed to send announcement");
            console.error("Announcement send error:", error);
        } else {
            setNewAnnouncement({ title: "", content: "", building_id: "" });
            toast.success("Announcement sent");
            fetchAnnouncements();
        }
    };

    const getConversationMessages = (conversationId: string) => {
        if (conversationId.startsWith('building-')) {
            const buildingId = conversationId.replace('building-', '');
            return messages.filter(m => m.building_id === buildingId);
        } else {
            return messages.filter(m =>
                (m.sender_id === conversationId && m.receiver_id) ||
                (m.receiver_id === conversationId && m.sender_id)
            );
        }
    };

    const getUniqueConversations = async () => {
        const conversations = new Map();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        messages.forEach(message => {
            if (message.building_id) {
                // Group chat
                const key = `building-${message.building_id}`;
                if (!conversations.has(key)) {
                    const building = buildings.find(b => b.id === message.building_id);
                    conversations.set(key, {
                        id: key,
                        type: 'building',
                        name: building?.name || 'Unknown Building',
                        lastMessage: message,
                        unread: false // TODO: Implement unread logic
                    });
                }
            } else if (message.receiver_id || message.sender_id) {
                // Direct message - find the other participant
                const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
                if (otherUserId && !conversations.has(otherUserId)) {
                    // Determine which profile to use for the conversation details
                    const otherProfile = message.sender_id === user.id ? null : message.sender;
                    conversations.set(otherUserId, {
                        id: otherUserId,
                        type: 'direct',
                        name: otherProfile?.name || 'Unknown User',
                        role: otherProfile?.role,
                        lastMessage: message,
                        unread: false // TODO: Implement unread logic
                    });
                }
            }
        });

        return Array.from(conversations.values());
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <div className={cn("animate-reveal-up", isMobile ? "space-y-8" : "space-y-12")}>
            <div className="flex justify-between items-end">
                <div>
                    <h2 className={cn("font-display font-bold text-stone-900 tracking-tighter", isMobile ? "text-3xl" : "text-5xl")}>
                        Communication Hub<span className="text-primary">.</span>
                    </h2>
                    <p className="text-stone-500 mt-2 font-medium" style={{fontSize: isMobile ? '14px' : '18px'}}>Connect with residents, manage announcements, and oversee building discussions.</p>
                </div>
            </div>

            <Tabs defaultValue="messages" className="w-full">
                <TabsList className={cn("bg-stone-100/50 p-1.5 rounded-[1.5rem] flex", isMobile ? "flex-col h-auto space-y-1 mb-8" : "w-fit mb-12")}>
                    <TabsTrigger value="messages" className={cn("rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg text-xs font-bold uppercase tracking-widest text-stone-400 data-[state=active]:text-stone-900", isMobile ? "py-3 px-6" : "px-8 py-3.5")}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Messages
                    </TabsTrigger>
                    <TabsTrigger value="groups" className={cn("rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg text-xs font-bold uppercase tracking-widest text-stone-400 data-[state=active]:text-stone-900", isMobile ? "py-3 px-6" : "px-8 py-3.5")}>
                        <Users className="h-4 w-4 mr-2" />
                        Group Chats
                    </TabsTrigger>
                    <TabsTrigger value="announcements" className={cn("rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg text-xs font-bold uppercase tracking-widest text-stone-400 data-[state=active]:text-stone-900", isMobile ? "py-3 px-6" : "px-8 py-3.5")}>
                        <Megaphone className="h-4 w-4 mr-2" />
                        Announcements
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="messages" className="space-y-8">
                    {isMobile ? (
                        // Mobile: Show either list or chat based on viewMode
                        viewMode === 'list' ? (
                            // Conversations List - Full screen on mobile
                            <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-stone-100">
                                    <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest">Conversations</h3>
                                </div>
                                <ScrollArea className="h-[500px]">
                                    <div className="p-3 space-y-2">
                                        {conversations.map((conversation) => (
                                            <button
                                                key={conversation.id}
                                                onClick={() => {
                                                    setSelectedConversation(conversation.id);
                                                    setViewMode('chat');
                                                }}
                                                className="w-full rounded-2xl p-3 text-left transition-all hover:bg-stone-50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src="" />
                                                        <AvatarFallback className="text-xs">
                                                            {conversation.name.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-bold text-stone-900 truncate">
                                                                {conversation.name}
                                                            </p>
                                                            <span className="text-[10px] text-stone-400">
                                                                {formatTime(conversation.lastMessage.created_at)}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-stone-500 truncate mt-1">
                                                            {conversation.lastMessage.content}
                                                        </p>
                                                        {conversation.type === 'direct' && (
                                                            <Badge className="mt-1 text-[8px] px-1.5 py-0.5" variant="outline">
                                                                {conversation.role}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        ) : (
                            // Chat View - Full screen on mobile
                            <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-200px)]">
                                <div className="p-4 border-b border-stone-100">
                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setViewMode('list')}
                                            className="p-1 h-8 w-8"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                        </Button>
                                        <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest">
                                            {conversations.find(c => c.id === selectedConversation)?.name || 'Chat'}
                                        </h3>
                                    </div>
                                </div>
                                <ScrollArea className="flex-1">
                                    <div className="p-4 space-y-4">
                                        {getConversationMessages(selectedConversation)
                                            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                            .map((message) => (
                                            <div key={message.id} className="flex gap-3">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={message.sender?.photo_url} />
                                                    <AvatarFallback className="text-xs">
                                                        {message.sender?.name?.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-bold text-stone-900">
                                                            {message.sender?.name}
                                                        </span>
                                                        <span className="text-[10px] text-stone-400">
                                                            {formatTime(message.created_at)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-stone-700 bg-stone-50 rounded-2xl px-3 py-2">
                                                        {message.content}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                                <div className="p-4 border-t border-stone-100">
                                    <div className="flex gap-3">
                                        <Input
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type your message..."
                                            className="flex-1 rounded-2xl"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    if (selectedConversation.startsWith('building-')) {
                                                        sendMessage(undefined, selectedConversation.replace('building-', ''));
                                                    } else {
                                                        sendMessage(selectedConversation);
                                                    }
                                                }
                                            }}
                                        />
                                        <Button
                                            onClick={() => {
                                                if (selectedConversation.startsWith('building-')) {
                                                    sendMessage(undefined, selectedConversation.replace('building-', ''));
                                                } else {
                                                    sendMessage(selectedConversation);
                                                }
                                            }}
                                            className="rounded-2xl px-6"
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    ) : (
                        // Desktop: Keep original side-by-side layout
                        <div className="grid lg:grid-cols-3 gap-8 h-[600px]">
                            {/* Conversations List */}
                            <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden lg:col-span-1">
                                <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest">Conversations</h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-3 text-stone-500 hover:text-stone-900"
                                        onClick={async () => {
                                            await fetchRecipients();
                                            setShowNewMessageDialog(true);
                                        }}
                                    >
                                        <MessageSquare className="h-4 w-4 mr-1" />
                                        New
                                    </Button>
                                </div>
                                <ScrollArea className="h-[500px]">
                                    <div className="p-4 space-y-2">
                                        {conversations.map((conversation) => (
                                            <button
                                                key={conversation.id}
                                                onClick={() => setSelectedConversation(conversation.id)}
                                                className={cn(
                                                    "w-full rounded-2xl text-left transition-all hover:bg-stone-50",
                                                    selectedConversation === conversation.id && "bg-stone-100",
                                                    "p-4"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src="" />
                                                        <AvatarFallback className="text-xs">
                                                            {conversation.name.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-bold text-stone-900 truncate">
                                                                {conversation.name}
                                                            </p>
                                                            <span className="text-[10px] text-stone-400">
                                                                {formatTime(conversation.lastMessage.created_at)}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-stone-500 truncate mt-1">
                                                            {conversation.lastMessage.content}
                                                        </p>
                                                        {conversation.type === 'direct' && (
                                                            <Badge className="mt-1 text-[8px] px-1.5 py-0.5" variant="outline">
                                                                {conversation.role}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Chat Area */}
                            <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden flex flex-col lg:col-span-2">
                                {selectedConversation ? (
                                    <>
                                        <div className="p-6 border-b border-stone-100">
                                            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest">
                                                {conversations.find(c => c.id === selectedConversation)?.name || 'Chat'}
                                            </h3>
                                        </div>
                                        <ScrollArea className="flex-1">
                                            <div className="p-6 space-y-4">
                                                {getConversationMessages(selectedConversation)
                                                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                                    .map((message) => (
                                                    <div key={message.id} className="flex gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={message.sender?.photo_url} />
                                                            <AvatarFallback className="text-xs">
                                                                {message.sender?.name?.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-sm font-bold text-stone-900">
                                                                    {message.sender?.name}
                                                                </span>
                                                                <span className="text-[10px] text-stone-400">
                                                                    {formatTime(message.created_at)}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-stone-700 bg-stone-50 rounded-2xl px-4 py-2">
                                                                {message.content}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                        <div className="p-6 border-t border-stone-100">
                                            <div className="flex gap-3">
                                                <Input
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    placeholder="Type your message..."
                                                    className="flex-1 rounded-2xl"
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            if (selectedConversation.startsWith('building-')) {
                                                                sendMessage(undefined, selectedConversation.replace('building-', ''));
                                                            } else {
                                                                sendMessage(selectedConversation);
                                                            }
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    onClick={() => {
                                                        if (selectedConversation.startsWith('building-')) {
                                                            sendMessage(undefined, selectedConversation.replace('building-', ''));
                                                        } else {
                                                            sendMessage(selectedConversation);
                                                        }
                                                    }}
                                                    className="rounded-2xl px-6"
                                                >
                                                    <Send className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="text-center">
                                            <MessageSquare className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                                            <p className="text-stone-500 font-medium">Select a conversation to start messaging</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="groups" className="space-y-8">
                    {isMobile ? (
                        // Mobile: Show either list or chat based on viewMode
                        viewMode === 'list' ? (
                            // Buildings List - Full screen on mobile
                            <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-stone-100">
                                    <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest">Buildings</h3>
                                </div>
                                <ScrollArea className="h-[500px]">
                                    <div className="p-3 space-y-2">
                                        {buildings.map((building) => (
                                            <button
                                                key={building.id}
                                                onClick={() => {
                                                    setSelectedBuilding(building.id);
                                                    setViewMode('chat');
                                                }}
                                                className="w-full p-4 rounded-2xl text-left transition-all hover:bg-stone-50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Building2 className="h-5 w-5 text-stone-400" />
                                                    <div>
                                                        <p className="text-sm font-bold text-stone-900">{building.name}</p>
                                                        <p className="text-[10px] text-stone-400 truncate">{building.address}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        ) : (
                            // Group Chat View - Full screen on mobile
                            <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
                                <div className="p-4 border-b border-stone-100">
                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setViewMode('list')}
                                            className="p-1 h-8 w-8"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                        </Button>
                                        <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest">
                                            {buildings.find(b => b.id === selectedBuilding)?.name} Group Chat
                                        </h3>
                                    </div>
                                </div>
                                <ScrollArea className="flex-1">
                                    <div className="p-4 space-y-4">
                                        {messages
                                            .filter(m => m.building_id === selectedBuilding)
                                            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                            .map((message) => (
                                            <div key={message.id} className="flex gap-3">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={message.sender?.photo_url} />
                                                    <AvatarFallback className="text-xs">
                                                        {message.sender?.name?.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-bold text-stone-900">
                                                            {message.sender?.name}
                                                        </span>
                                                        <Badge className="text-[8px] px-1.5 py-0.5" variant="outline">
                                                            {message.sender?.role}
                                                        </Badge>
                                                        <span className="text-[10px] text-stone-400">
                                                            {formatTime(message.created_at)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-stone-700 bg-stone-50 rounded-2xl px-3 py-2">
                                                        {message.content}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                                <div className="p-4 border-t border-stone-100">
                                    <div className="flex gap-3">
                                        <Input
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Message the group..."
                                            className="flex-1 rounded-2xl"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    sendMessage(undefined, selectedBuilding);
                                                }
                                            }}
                                        />
                                        <Button
                                            onClick={() => sendMessage(undefined, selectedBuilding)}
                                            className="rounded-2xl px-6"
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    ) : (
                        // Desktop: Keep original side-by-side layout
                        <div className="grid lg:grid-cols-4 gap-8 h-[600px]">
                            {/* Buildings List */}
                            <div className="lg:col-span-1 bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-stone-100">
                                    <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest">Buildings</h3>
                                </div>
                                <ScrollArea className="h-[500px]">
                                    <div className="p-4 space-y-2">
                                        {buildings.map((building) => (
                                            <button
                                                key={building.id}
                                                onClick={() => setSelectedBuilding(building.id)}
                                                className={cn(
                                                    "w-full p-4 rounded-2xl text-left transition-all hover:bg-stone-50",
                                                    selectedBuilding === building.id && "bg-stone-100"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Building2 className="h-5 w-5 text-stone-400" />
                                                    <div>
                                                        <p className="text-sm font-bold text-stone-900">{building.name}</p>
                                                        <p className="text-[10px] text-stone-400 truncate">{building.address}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Group Chat */}
                            <div className="lg:col-span-3 bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden flex flex-col">
                                {selectedBuilding ? (
                                    <>
                                        <div className="p-6 border-b border-stone-100">
                                            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest">
                                                {buildings.find(b => b.id === selectedBuilding)?.name} Group Chat
                                            </h3>
                                        </div>
                                        <ScrollArea className="flex-1 p-6">
                                            <div className="space-y-4">
                                                {messages
                                                    .filter(m => m.building_id === selectedBuilding)
                                                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                                    .map((message) => (
                                                    <div key={message.id} className="flex gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={message.sender?.photo_url} />
                                                            <AvatarFallback className="text-xs">
                                                                {message.sender?.name?.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-sm font-bold text-stone-900">
                                                                    {message.sender?.name}
                                                                </span>
                                                                <Badge className="text-[8px] px-1.5 py-0.5" variant="outline">
                                                                    {message.sender?.role}
                                                                </Badge>
                                                                <span className="text-[10px] text-stone-400">
                                                                    {formatTime(message.created_at)}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-stone-700 bg-stone-50 rounded-2xl px-4 py-2">
                                                                {message.content}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                        <div className="p-6 border-t border-stone-100">
                                            <div className="flex gap-3">
                                                <Input
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    placeholder="Message the group..."
                                                    className="flex-1 rounded-2xl"
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            sendMessage(undefined, selectedBuilding);
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    onClick={() => sendMessage(undefined, selectedBuilding)}
                                                    className="rounded-2xl px-6"
                                                >
                                                    <Send className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="text-center">
                                            <Users className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                                            <p className="text-stone-500 font-medium">Select a building to join the group chat</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="announcements" className="space-y-8">
                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Compose Announcement */}
                        <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm p-8">
                            <h3 className="text-lg font-bold text-stone-900 mb-6 uppercase tracking-widest text-sm">Create Announcement</h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 block">Title</label>
                                    <Input
                                        value={newAnnouncement.title}
                                        onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                                        placeholder="Announcement title..."
                                        className="rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 block">Building</label>
                                    <select
                                        value={newAnnouncement.building_id}
                                        onChange={(e) => setNewAnnouncement({...newAnnouncement, building_id: e.target.value})}
                                        className="w-full h-12 px-4 rounded-xl border border-stone-200 bg-white text-sm"
                                    >
                                        <option value="">All Buildings</option>
                                        {buildings.map(building => (
                                            <option key={building.id} value={building.id}>{building.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 block">Message</label>
                                    <Textarea
                                        value={newAnnouncement.content}
                                        onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                                        placeholder="Write your announcement..."
                                        className="rounded-xl min-h-[120px]"
                                    />
                                </div>
                                <Button
                                    onClick={sendAnnouncement}
                                    className="w-full h-14 rounded-2xl bg-stone-900 text-white font-bold uppercase tracking-widest text-xs"
                                    disabled={!newAnnouncement.title.trim() || !newAnnouncement.content.trim()}
                                >
                                    <Megaphone className="h-4 w-4 mr-2" />
                                    Send Announcement
                                </Button>
                            </div>
                        </div>

                        {/* Announcements History */}
                        <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-stone-100">
                                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest">Announcement History</h3>
                            </div>
                            <ScrollArea className="h-[400px]">
                                <div className="p-6 space-y-6">
                                    {announcements.map((announcement) => (
                                        <div key={announcement.id} className="border-l-4 border-primary pl-6">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="text-sm font-bold text-stone-900">{announcement.title}</h4>
                                                <span className="text-[10px] text-stone-400">
                                                    {formatTime(announcement.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-stone-600 mb-3">{announcement.content}</p>
                                            {announcement.building && (
                                                <Badge className="text-[8px] px-2 py-1" variant="outline">
                                                    {announcement.building.name}
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                    {announcements.length === 0 && (
                                        <div className="text-center py-8">
                                            <Megaphone className="h-8 w-8 text-stone-300 mx-auto mb-3" />
                                            <p className="text-stone-500 text-sm">No announcements sent yet</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* New Message Dialog */}
            {showNewMessageDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-stone-900 uppercase tracking-widest text-sm">New Message</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowNewMessageDialog(false)}
                                className="h-8 w-8 p-0"
                            >
                                ✕
                            </Button>
                        </div>

                        <div className="p-6">
                            <div className="mb-4">
                                <Input
                                    value={recipientSearch}
                                    onChange={(e) => setRecipientSearch(e.target.value)}
                                    placeholder="Search tenants and agents..."
                                    className="rounded-xl"
                                />
                            </div>

                            <ScrollArea className="h-64">
                                <div className="space-y-2">
                                    {availableRecipients
                                        .filter(recipient =>
                                            recipient.name.toLowerCase().includes(recipientSearch.toLowerCase()) ||
                                            recipient.email.toLowerCase().includes(recipientSearch.toLowerCase())
                                        )
                                        .map((recipient) => (
                                        <button
                                            key={recipient.id}
                                            onClick={() => {
                                                setSelectedConversation(recipient.id);
                                                setShowNewMessageDialog(false);
                                                setViewMode('chat'); // For mobile
                                            }}
                                            className="w-full rounded-2xl p-3 text-left transition-all hover:bg-stone-50 flex items-center gap-3"
                                        >
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={recipient.photo_url} />
                                                <AvatarFallback className="text-xs">
                                                    {recipient.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-stone-900 truncate">
                                                    {recipient.name}
                                                </p>
                                                <p className="text-xs text-stone-500 truncate">
                                                    {recipient.email}
                                                </p>
                                                <Badge className="mt-1 text-[8px] px-1.5 py-0.5" variant="outline">
                                                    {recipient.type}
                                                </Badge>
                                            </div>
                                        </button>
                                    ))}
                                    {availableRecipients.length === 0 && (
                                        <div className="text-center py-8">
                                            <Users className="h-8 w-8 text-stone-300 mx-auto mb-3" />
                                            <p className="text-stone-500 text-sm">No recipients found</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BroadcastCenter;
