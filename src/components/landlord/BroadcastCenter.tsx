import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
    MessageSquare,
    Users,
    Megaphone,
    Send,
    Search,
    Building2,
    ArrowLeft,
    User,
    Crown,
    ShieldCheck
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
    created_at: string;
    sender?: {
        id: string;
        name: string;
        email: string;
        photo_url: string | null;
        role: string;
    };
}

interface Conversation {
    id: string;
    type: 'direct' | 'building';
    name: string;
    participantId?: string;
    participantName: string;
    participantRole?: string;
    participantPhoto?: string | null;
    participantEmail?: string;
    buildingId?: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
}

interface Recipient {
    id: string;
    name: string;
    email: string;
    role: string;
    photo_url: string | null;
    type: 'tenant' | 'agent';
}

interface Building {
    id: string;
    name: string;
    address: string;
}

interface Announcement {
    id: string;
    title: string;
    content: string;
    building_id: string | null;
    created_by: string;
    created_at: string;
    building?: {
        name: string;
    };
}

const BroadcastCenter = () => {
    const isMobile = useIsMobile();
    const [currentUser, setCurrentUser] = useState<{
        id: string;
        name: string;
        email: string;
        photo_url: string | null;
        role: string;
    } | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingRecipients, setLoadingRecipients] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'chat'>('list');
    const [newMessage, setNewMessage] = useState('');
    const [newAnnouncement, setNewAnnouncement] = useState({
        title: '',
        content: '',
        building_id: ''
    });
    const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [recipientSearch, setRecipientSearch] = useState('');
    const [recipientCache, setRecipientCache] = useState<Record<string, Recipient>>({});

    // Initialize current user
    useEffect(() => {
        const initUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: profile } = await supabase
                    .from("profiles")
                    .select("id, name, email, photo_url, role")
                    .eq("id", user.id)
                    .single();

                if (profile) {
                    setCurrentUser({
                        id: user.id,
                        name: profile.name,
                        email: profile.email,
                        photo_url: profile.photo_url,
                        role: profile.role
                    });
                }
            } catch (error) {
                console.error("Failed to initialize user:", error);
                toast.error("Failed to load user information");
            }
        };

        initUser();
    }, []);

    // Fetch buildings when current user is available
    useEffect(() => {
        if (currentUser) {
            fetchBuildings();
            fetchAnnouncements();
            setupRealtimeSubscriptions();
        }
    }, [currentUser]);

    // Fetch conversations and messages when current user or buildings change
    useEffect(() => {
        if (currentUser && buildings.length > 0) {
            fetchConversations();
        }
    }, [currentUser, buildings]);

    const setupRealtimeSubscriptions = () => {
        if (!currentUser) return;

        // Messages subscription
        const messagesChannel = supabase
            .channel('messages-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'messages' },
                () => {
                    fetchConversations();
                }
            )
            .subscribe();

        // Announcements subscription
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
    };

    const fetchBuildings = async () => {
        if (!currentUser) return;

        try {
            // First try to fetch buildings by landlord_id
            let { data, error } = await supabase
                .from("buildings")
                .select("id, name, address")
                .eq("landlord_id", currentUser.id);

            if (error) throw error;

            // Fallback: if no buildings found and user is landlord role, fetch all buildings
            // This handles the case where landlord_id might not be set on buildings
            if ((!data || data.length === 0) && currentUser.role === 'landlord') {
                const allBuildings = await supabase
                    .from("buildings")
                    .select("id, name, address");
                data = allBuildings.data;
            }

            setBuildings(data || []);
            if (data && data.length > 0 && !selectedBuilding) {
                setSelectedBuilding(data[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch buildings:", error);
            toast.error("Failed to load buildings");
        }
    };

    const fetchAnnouncements = async () => {
        if (!currentUser) return;

        try {
            // For landlords, fetch all announcements they created or for their buildings
            if (currentUser.role === 'landlord') {
                const { data, error } = await supabase
                    .from("announcements")
                    .select(`
                        *,
                        building:buildings(name)
                    `)
                    .eq("created_by", currentUser.id)
                    .order("created_at", { ascending: false });

                if (error) throw error;
                setAnnouncements(data || []);
            } else {
                // Get all building IDs owned by the landlord
                const { data: landlordBuildings } = await supabase
                    .from("buildings")
                    .select("id")
                    .eq("landlord_id", currentUser.id);

                if (!landlordBuildings || landlordBuildings.length === 0) {
                    setAnnouncements([]);
                    return;
                }

                const buildingIds = landlordBuildings.map(b => b.id);

                // Fetch announcements for all landlord's buildings
                const { data, error } = await supabase
                    .from("announcements")
                    .select(`
                        *,
                        building:buildings(name)
                    `)
                    .or(`building_id.in.(${buildingIds.join(',')}),building_id.is.null`)
                    .order("created_at", { ascending: false });

                if (error) throw error;
                setAnnouncements(data || []);
            }
        } catch (error) {
            console.error("Failed to fetch announcements:", error);
            toast.error("Failed to load announcements");
        }
    };

    const fetchConversations = async () => {
        if (!currentUser) return;

        try {
            setLoading(true);

            // Fetch all relevant messages
            const { data: messagesData, error: messagesError } = await supabase
                .from("messages")
                .select(`
                    *,
                    sender:profiles!messages_sender_id_fkey(id, name, email, photo_url, role)
                `)
                .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id},building_id.not.is.null`)
                .order("created_at", { ascending: false });

            if (messagesError) throw messagesError;

            // Build conversations from messages
            const conversationsMap = new Map<string, Conversation>();

            messagesData.forEach(message => {
                if (message.building_id) {
                    // Group chat conversation
                    const conversationId = `building-${message.building_id}`;
                    const building = buildings.find(b => b.id === message.building_id);

                    if (!conversationsMap.has(conversationId)) {
                        conversationsMap.set(conversationId, {
                            id: conversationId,
                            type: 'building',
                            name: building?.name || 'Building Chat',
                            buildingId: message.building_id,
                            lastMessage: message.content,
                            lastMessageTime: message.created_at,
                            unreadCount: 0,
                            participantName: building?.name || 'Building Chat'
                        });
                    } else {
                        const existing = conversationsMap.get(conversationId);
                        if (existing && new Date(message.created_at) > new Date(existing.lastMessageTime)) {
                            conversationsMap.set(conversationId, {
                                ...existing,
                                lastMessage: message.content,
                                lastMessageTime: message.created_at
                            });
                        }
                    }
                } else if (message.receiver_id) {
                    // Direct message conversation
                    const otherUserId = message.sender_id === currentUser.id
                        ? message.receiver_id
                        : message.sender_id;

                    const conversationId = otherUserId;

                    // Get participant info from message sender or cache
                    let participantName = 'Unknown User';
                    let participantRole: string | undefined = undefined;
                    let participantPhoto: string | null = null;
                    let participantEmail = '';

                    if (message.sender_id !== currentUser.id && message.sender) {
                        participantName = message.sender.name || 'Unknown User';
                        participantRole = message.sender.role;
                        participantPhoto = message.sender.photo_url;
                        participantEmail = message.sender.email;
                    } else if (recipientCache[otherUserId]) {
                        const cached = recipientCache[otherUserId];
                        participantName = cached.name;
                        participantRole = cached.role;
                        participantPhoto = cached.photo_url;
                        participantEmail = cached.email;
                    }

                    if (!conversationsMap.has(conversationId)) {
                        conversationsMap.set(conversationId, {
                            id: conversationId,
                            type: 'direct',
                            name: participantName,
                            participantId: otherUserId,
                            participantName,
                            participantRole,
                            participantPhoto,
                            participantEmail,
                            lastMessage: message.content,
                            lastMessageTime: message.created_at,
                            unreadCount: 0
                        });
                    } else {
                        const existing = conversationsMap.get(conversationId);
                        if (existing && new Date(message.created_at) > new Date(existing.lastMessageTime)) {
                            conversationsMap.set(conversationId, {
                                ...existing,
                                lastMessage: message.content,
                                lastMessageTime: message.created_at,
                                // Keep the original participant name - THIS IS THE KEY FIX
                                participantName: existing.participantName,
                                participantRole: existing.participantRole,
                                participantPhoto: existing.participantPhoto
                            });
                        }
                    }
                }
            });

            // Convert to array and sort by last message time (newest first)
            const conversations = Array.from(conversationsMap.values());
            const sortedConversations = conversations.sort((a, b) =>
                new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
            );

            setConversations(sortedConversations);
            setMessages(messagesData || []);
        } catch (error) {
            console.error("Failed to fetch conversations:", error);
            toast.error("Failed to load conversations");
        } finally {
            setLoading(false);
        }
    };

    const fetchRecipients = async () => {
        if (!currentUser) return;

        try {
            setLoadingRecipients(true);
            setRecipients([]);

            // Get all building IDs owned by the landlord
            const { data: landlordBuildings, error: buildingsError } = await supabase
                .from("buildings")
                .select("id")
                .eq("landlord_id", currentUser.id);

            if (buildingsError) throw buildingsError;

            if (!landlordBuildings || landlordBuildings.length === 0) {
                toast.info("No buildings found. Add buildings to message tenants.");
                return;
            }

            const buildingIds = landlordBuildings.map(b => b.id);

            // Get all rooms in landlord's buildings
            const { data: rooms, error: roomsError } = await supabase
                .from("rooms")
                .select("id")
                .in("building_id", buildingIds);

            if (roomsError) throw roomsError;

            const roomIds = rooms?.map(r => r.id) || [];

            // Fetch tenants with active tenancies
            const tenantsQuery = supabase
                .from("profiles")
                .select("id, name, email, role, photo_url")
                .eq("role", "tenant")
                .eq("status", "active");

            // Fetch agents assigned to landlord's buildings
            const agentsQuery = supabase
                .from("profiles")
                .select("id, name, email, role, photo_url")
                .eq("role", "agent")
                .in("id", (await supabase.from("buildings").select("agent_id").in("id", buildingIds)).data?.map(b => b.agent_id).filter(Boolean) || []);

            const [tenantsResult, agentsResult] = await Promise.all([
                tenantsQuery,
                agentsQuery
            ]);

            let filteredTenants: Recipient[] = [];

            // Filter tenants who have active tenancies in landlord's rooms
            if (tenantsResult.data && tenantsResult.data.length > 0 && roomIds.length > 0) {
                const tenantIds = tenantsResult.data.map(t => t.id);
                const { data: tenancies } = await supabase
                    .from("tenancies")
                    .select("tenant_id")
                    .in("tenant_id", tenantIds)
                    .in("room_id", roomIds)
                    .eq("status", "active");

                if (tenancies) {
                    const tenantIdsWithActiveTenancies = tenancies.map(t => t.tenant_id);
                    filteredTenants = tenantsResult.data
                        .filter(t => tenantIdsWithActiveTenancies.includes(t.id))
                        .map(t => ({ ...t, type: 'tenant' as const }));
                }
            }

            // Combine tenants and agents
            const allRecipients: Recipient[] = [
                ...filteredTenants,
                ...(agentsResult.data || []).map(a => ({ ...a, type: 'agent' as const }))
            ];

            // Cache recipients for quick lookup
            const newCache: Record<string, Recipient> = {};
            allRecipients.forEach(recipient => {
                newCache[recipient.id] = recipient;
            });
            setRecipientCache(prev => ({ ...prev, ...newCache }));

            setRecipients(allRecipients);
            console.log("Fetched recipients:", allRecipients);
        } catch (error) {
            console.error("Failed to fetch recipients:", error);
            toast.error("Failed to load recipients. Please try again.");
        } finally {
            setLoadingRecipients(false);
        }
    };

    const sendMessage = async (receiverId?: string, buildingId?: string) => {
        if (!newMessage.trim() || !currentUser) return;

        try {
            const { error } = await supabase
                .from("messages")
                .insert({
                    sender_id: currentUser.id,
                    receiver_id: receiverId || null,
                    building_id: buildingId || null,
                    content: newMessage.trim()
                });

            if (error) throw error;

            setNewMessage("");
            toast.success("Message sent successfully");
            fetchConversations(); // Refresh conversations
        } catch (error) {
            console.error("Failed to send message:", error);
            toast.error("Failed to send message. Please try again.");
        }
    };

    const sendAnnouncement = async () => {
        if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim() || !currentUser) return;

        try {
            const { error } = await supabase
                .from("announcements")
                .insert({
                    title: newAnnouncement.title.trim(),
                    content: newAnnouncement.content.trim(),
                    building_id: newAnnouncement.building_id || null,
                    created_by: currentUser.id
                });

            if (error) throw error;

            setNewAnnouncement({ title: "", content: "", building_id: "" });
            toast.success("Announcement sent successfully");
            fetchAnnouncements();
        } catch (error) {
            console.error("Failed to send announcement:", error);
            toast.error("Failed to send announcement. Please try again.");
        }
    };

    const getConversationMessages = useCallback((conversationId: string) => {
        if (conversationId.startsWith('building-')) {
            const buildingId = conversationId.replace('building-', '');
            return messages.filter(m => m.building_id === buildingId);
        } else {
            return messages.filter(m =>
                (m.sender_id === conversationId && m.receiver_id === currentUser?.id) ||
                (m.receiver_id === conversationId && m.sender_id === currentUser?.id)
            );
        }
    }, [messages, currentUser]);

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

    const getParticipantName = (conversationId: string) => {
        if (conversationId.startsWith('building-')) {
            const buildingId = conversationId.replace('building-', '');
            const building = buildings.find(b => b.id === buildingId);
            return building?.name || 'Building Chat';
        } else {
            const conversation = conversations.find(c => c.id === conversationId);
            return conversation?.participantName || 'Unknown User';
        }
    };

    const filteredRecipients = recipients.filter(recipient =>
        recipient.name.toLowerCase().includes(recipientSearch.toLowerCase()) ||
        recipient.email.toLowerCase().includes(recipientSearch.toLowerCase())
    );

    return (
        <div className={cn("animate-reveal-up", isMobile ? "space-y-8" : "space-y-12")}>
            <div className="flex justify-between items-end">
                <div>
                    <h2 className={cn("font-display font-bold text-stone-900 tracking-tighter", isMobile ? "text-3xl" : "text-5xl")}>
                        Communication Hub<span className="text-primary">.</span>
                    </h2>
                    <p className="text-stone-500 mt-2 font-medium" style={{fontSize: isMobile ? '14px' : '18px'}}>
                        Connect with residents, manage announcements, and oversee building discussions.
                    </p>
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
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="h-8 w-8 border-2 border-stone-200 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : isMobile ? (
                        viewMode === 'list' ? (
                            // Mobile: Conversations List
                            <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-stone-100 flex justify-between items-center">
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

                                {conversations.length === 0 ? (
                                    <div className="text-center py-8">
                                        <MessageSquare className="h-8 w-8 text-stone-300 mx-auto mb-3" />
                                        <p className="text-stone-500 text-sm">No conversations yet</p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="mt-4 text-primary"
                                            onClick={async () => {
                                                await fetchRecipients();
                                                setShowNewMessageDialog(true);
                                            }}
                                        >
                                            Start a new conversation
                                        </Button>
                                    </div>
                                ) : (
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
                                                            {conversation.type === 'building' ? (
                                                                <AvatarFallback className="text-xs bg-primary text-white">
                                                                    <Building2 className="h-4 w-4" />
                                                                </AvatarFallback>
                                                            ) : (
                                                                <>
                                                                    <AvatarImage src={conversation.participantPhoto || undefined} />
                                                                    <AvatarFallback className="text-xs">
                                                                        {conversation.participantName.charAt(0)}
                                                                    </AvatarFallback>
                                                                </>
                                                            )}
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-sm font-bold text-stone-900 truncate">
                                                                    {conversation.participantName}
                                                                </p>
                                                                <span className="text-[10px] text-stone-400">
                                                                    {formatTime(conversation.lastMessageTime)}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-stone-500 truncate mt-1">
                                                                {conversation.lastMessage}
                                                            </p>
                                                            {conversation.type === 'direct' && conversation.participantRole && (
                                                                <Badge className="mt-1 text-[8px] px-1.5 py-0.5" variant="outline">
                                                                    {conversation.participantRole}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                )}
                            </div>
                        ) : (
                            // Mobile: Chat View
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
                                            {getParticipantName(selectedConversation || '')}
                                        </h3>
                                    </div>
                                </div>

                                <ScrollArea className="flex-1">
                                    <div className="p-4 space-y-4">
                                        {getConversationMessages(selectedConversation || '')
                                            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                            .map((message) => {
                                                const isCurrentUser = message.sender_id === currentUser?.id;
                                                const conversation = conversations.find(c => c.id === selectedConversation);
                                                const participantName = conversation?.participantName || 'Unknown';

                                                return (
                                                    <div key={message.id} className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                                                        {!isCurrentUser && (
                                                            <Avatar className="h-6 w-6">
                                                                {conversation?.type === 'building' ? (
                                                                    <AvatarFallback className="text-xs bg-primary text-white">
                                                                        <Building2 className="h-4 w-4" />
                                                                    </AvatarFallback>
                                                                ) : (
                                                                    <>
                                                                        <AvatarImage src={message.sender?.photo_url || undefined} />
                                                                        <AvatarFallback className="text-xs">
                                                                            {participantName.charAt(0)}
                                                                        </AvatarFallback>
                                                                    </>
                                                                )}
                                                            </Avatar>
                                                        )}
                                                        <div className={`flex-1 ${isCurrentUser ? 'text-right' : ''}`}>
                                                            {!isCurrentUser && conversation?.type === 'direct' && (
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-sm font-bold text-stone-900">
                                                                        {participantName}
                                                                    </span>
                                                                    {message.sender?.role === 'landlord' && (
                                                                        <Crown className="h-3 w-3 text-amber-500" />
                                                                    )}
                                                                    {message.sender?.role === 'agent' && (
                                                                        <ShieldCheck className="h-3 w-3 text-primary" />
                                                                    )}
                                                                    <span className="text-[10px] text-stone-400">
                                                                        {formatTime(message.created_at)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className={`inline-block max-w-[80%] p-3 rounded-2xl text-sm ${isCurrentUser ? 'bg-primary text-white rounded-tr-none' : 'bg-stone-100 text-stone-900 rounded-tl-none'}`}>
                                                                {message.content}
                                                            </div>
                                                            {isCurrentUser && (
                                                                <div className="text-[10px] text-stone-400 mt-1">
                                                                    {formatTime(message.created_at)}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {isCurrentUser && (
                                                            <Avatar className="h-6 w-6">
                                                                <AvatarImage src={currentUser?.photo_url || undefined} />
                                                                <AvatarFallback className="text-xs">
                                                                    {currentUser?.name.charAt(0)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        )}
                                                    </div>
                                                );
                                            })}
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
                                                    if (selectedConversation?.startsWith('building-')) {
                                                        sendMessage(undefined, selectedConversation.replace('building-', ''));
                                                    } else {
                                                        sendMessage(selectedConversation);
                                                    }
                                                }
                                            }}
                                        />
                                        <Button
                                            onClick={() => {
                                                if (selectedConversation?.startsWith('building-')) {
                                                    sendMessage(undefined, selectedConversation.replace('building-', ''));
                                                } else {
                                                    sendMessage(selectedConversation);
                                                }
                                            }}
                                            className="rounded-2xl px-6"
                                            disabled={!newMessage.trim()}
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    ) : (
                        // Desktop: Side-by-side layout
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

                                {conversations.length === 0 ? (
                                    <div className="text-center py-8 h-[500px]">
                                        <MessageSquare className="h-8 w-8 text-stone-300 mx-auto mb-3" />
                                        <p className="text-stone-500 text-sm">No conversations yet</p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="mt-4 text-primary"
                                            onClick={async () => {
                                                await fetchRecipients();
                                                setShowNewMessageDialog(true);
                                            }}
                                        >
                                            Start a new conversation
                                        </Button>
                                    </div>
                                ) : (
                                    <ScrollArea className="h-[500px]">
                                        <div className="p-4 space-y-2">
                                            {conversations.map((conversation) => (
                                                <button
                                                    key={conversation.id}
                                                    onClick={() => setSelectedConversation(conversation.id)}
                                                    className={cn(
                                                        "w-full rounded-2xl text-left transition-all hover:bg-stone-50 p-4",
                                                        selectedConversation === conversation.id && "bg-stone-100"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10">
                                                            {conversation.type === 'building' ? (
                                                                <AvatarFallback className="text-xs bg-primary text-white">
                                                                    <Building2 className="h-5 w-5" />
                                                                </AvatarFallback>
                                                            ) : (
                                                                <>
                                                                    <AvatarImage src={conversation.participantPhoto || undefined} />
                                                                    <AvatarFallback className="text-xs">
                                                                        {conversation.participantName.charAt(0)}
                                                                    </AvatarFallback>
                                                                </>
                                                            )}
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-sm font-bold text-stone-900 truncate">
                                                                    {conversation.participantName}
                                                                </p>
                                                                <span className="text-[10px] text-stone-400">
                                                                    {formatTime(conversation.lastMessageTime)}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-stone-500 truncate mt-1">
                                                                {conversation.lastMessage}
                                                            </p>
                                                            {conversation.type === 'direct' && conversation.participantRole && (
                                                                <Badge className="mt-1 text-[8px] px-1.5 py-0.5" variant="outline">
                                                                    {conversation.participantRole}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                )}
                            </div>

                            {/* Chat Area */}
                            <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden flex flex-col lg:col-span-2">
                                {selectedConversation ? (
                                    <>
                                        <div className="p-6 border-b border-stone-100">
                                            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest">
                                                {getParticipantName(selectedConversation)}
                                            </h3>
                                        </div>

                                        <ScrollArea className="flex-1">
                                            <div className="p-6 space-y-4">
                                                {getConversationMessages(selectedConversation)
                                                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                                    .map((message) => {
                                                        const isCurrentUser = message.sender_id === currentUser?.id;
                                                        const conversation = conversations.find(c => c.id === selectedConversation);
                                                        const participantName = conversation?.participantName || 'Unknown';

                                                        return (
                                                            <div key={message.id} className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                                                                {!isCurrentUser && (
                                                                    <Avatar className="h-8 w-8">
                                                                        {conversation?.type === 'building' ? (
                                                                            <AvatarFallback className="text-xs bg-primary text-white">
                                                                                <Building2 className="h-5 w-5" />
                                                                            </AvatarFallback>
                                                                        ) : (
                                                                            <>
                                                                                <AvatarImage src={message.sender?.photo_url || undefined} />
                                                                                <AvatarFallback className="text-xs">
                                                                                    {participantName.charAt(0)}
                                                                                </AvatarFallback>
                                                                            </>
                                                                        )}
                                                                    </Avatar>
                                                                )}
                                                                <div className={`flex-1 ${isCurrentUser ? 'text-right' : ''}`}>
                                                                    {!isCurrentUser && conversation?.type === 'direct' && (
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="text-sm font-bold text-stone-900">
                                                                                {participantName} {/* FIXED: Always shows the correct participant name */}
                                                                            </span>
                                                                            {message.sender?.role === 'landlord' && (
                                                                                <Crown className="h-3 w-3 text-amber-500" />
                                                                            )}
                                                                            {message.sender?.role === 'agent' && (
                                                                                <ShieldCheck className="h-3 w-3 text-primary" />
                                                                            )}
                                                                            <span className="text-[10px] text-stone-400">
                                                                                {formatTime(message.created_at)}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    <div className={`inline-block max-w-[80%] p-4 rounded-2xl text-sm ${isCurrentUser ? 'bg-primary text-white rounded-tr-none' : 'bg-stone-100 text-stone-900 rounded-tl-none'}`}>
                                                                        {message.content}
                                                                    </div>
                                                                    {isCurrentUser && (
                                                                        <div className="text-[10px] text-stone-400 mt-1">
                                                                            {formatTime(message.created_at)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {isCurrentUser && (
                                                                    <Avatar className="h-8 w-8">
                                                                        <AvatarImage src={currentUser?.photo_url || undefined} />
                                                                        <AvatarFallback className="text-xs">
                                                                            {currentUser?.name.charAt(0)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
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
                                                    disabled={!newMessage.trim()}
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
                        viewMode === 'list' ? (
                            // Mobile: Buildings List
                            <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-stone-100">
                                    <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest">Buildings</h3>
                                </div>
                                {buildings.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Building2 className="h-8 w-8 text-stone-300 mx-auto mb-3" />
                                        <p className="text-stone-500 text-sm">No buildings found</p>
                                    </div>
                                ) : (
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
                                )}
                            </div>
                        ) : (
                            // Mobile: Group Chat View
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
                                            .map((message) => {
                                                const isCurrentUser = message.sender_id === currentUser?.id;
                                                return (
                                                    <div key={message.id} className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                                                        {!isCurrentUser && (
                                                            <Avatar className="h-6 w-6">
                                                                <AvatarImage src={message.sender?.photo_url || undefined} />
                                                                <AvatarFallback className="text-xs">
                                                                    {message.sender?.name?.charAt(0) || '?'}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        )}
                                                        <div className={`flex-1 ${isCurrentUser ? 'text-right' : ''}`}>
                                                            {!isCurrentUser && (
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-sm font-bold text-stone-900">
                                                                        {message.sender?.name || 'Unknown'}
                                                                    </span>
                                                                    <Badge className="text-[8px] px-1.5 py-0.5" variant="outline">
                                                                        {message.sender?.role || 'user'}
                                                                    </Badge>
                                                                    <span className="text-[10px] text-stone-400">
                                                                        {formatTime(message.created_at)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className={`inline-block max-w-[80%] p-3 rounded-2xl text-sm ${isCurrentUser ? 'bg-primary text-white rounded-tr-none' : 'bg-stone-100 text-stone-900 rounded-tl-none'}`}>
                                                                {message.content}
                                                            </div>
                                                            {isCurrentUser && (
                                                                <div className="text-[10px] text-stone-400 mt-1">
                                                                    {formatTime(message.created_at)}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {isCurrentUser && (
                                                            <Avatar className="h-6 w-6">
                                                                <AvatarImage src={currentUser?.photo_url || undefined} />
                                                                <AvatarFallback className="text-xs">
                                                                    {currentUser?.name.charAt(0)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        )}
                                                    </div>
                                                );
                                            })}
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
                                            disabled={!newMessage.trim()}
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    ) : (
                        // Desktop: Group Chat Layout
                        <div className="grid lg:grid-cols-4 gap-8 h-[600px]">
                            {/* Buildings List */}
                            <div className="lg:col-span-1 bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-stone-100">
                                    <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest">Buildings</h3>
                                </div>
                                {buildings.length === 0 ? (
                                    <div className="text-center py-8 h-[500px]">
                                        <Building2 className="h-8 w-8 text-stone-300 mx-auto mb-3" />
                                        <p className="text-stone-500 text-sm">No buildings found</p>
                                    </div>
                                ) : (
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
                                )}
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
                                                    .map((message) => {
                                                        const isCurrentUser = message.sender_id === currentUser?.id;
                                                        return (
                                                            <div key={message.id} className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                                                                {!isCurrentUser && (
                                                                    <Avatar className="h-8 w-8">
                                                                        <AvatarImage src={message.sender?.photo_url || undefined} />
                                                                        <AvatarFallback className="text-xs">
                                                                            {message.sender?.name?.charAt(0) || '?'}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                )}
                                                                <div className={`flex-1 ${isCurrentUser ? 'text-right' : ''}`}>
                                                                    {!isCurrentUser && (
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="text-sm font-bold text-stone-900">
                                                                                {message.sender?.name || 'Unknown'}
                                                                            </span>
                                                                            <Badge className="text-[8px] px-1.5 py-0.5" variant="outline">
                                                                                {message.sender?.role || 'user'}
                                                                            </Badge>
                                                                            <span className="text-[10px] text-stone-400">
                                                                                {formatTime(message.created_at)}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    <div className={`inline-block max-w-[80%] p-4 rounded-2xl text-sm ${isCurrentUser ? 'bg-primary text-white rounded-tr-none' : 'bg-stone-100 text-stone-900 rounded-tl-none'}`}>
                                                                        {message.content}
                                                                    </div>
                                                                    {isCurrentUser && (
                                                                        <div className="text-[10px] text-stone-400 mt-1">
                                                                            {formatTime(message.created_at)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {isCurrentUser && (
                                                                    <Avatar className="h-8 w-8">
                                                                        <AvatarImage src={currentUser?.photo_url || undefined} />
                                                                        <AvatarFallback className="text-xs">
                                                                            {currentUser?.name.charAt(0)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
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
                                                    disabled={!newMessage.trim()}
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
                                            {announcement.building ? (
                                                <Badge className="text-[8px] px-2 py-1" variant="outline">
                                                    {announcement.building.name}
                                                </Badge>
                                            ) : (
                                                <Badge className="text-[8px] px-2 py-1" variant="outline">
                                                    All Buildings
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

                            {loadingRecipients ? (
                                <div className="text-center py-8">
                                    <div className="h-8 w-8 border-2 border-stone-200 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                                    <p className="text-stone-500 text-sm">Loading recipients...</p>
                                </div>
                            ) : filteredRecipients.length === 0 ? (
                                <div className="text-center py-8">
                                    <User className="h-8 w-8 text-stone-300 mx-auto mb-3" />
                                    <p className="text-stone-500 text-sm">No recipients found</p>
                                    <p className="text-xs text-stone-400 mt-2">Try adjusting your search or check if you have any tenants/agents</p>
                                </div>
                            ) : (
                                <ScrollArea className="h-64">
                                    <div className="space-y-2">
                                        {filteredRecipients.map((recipient) => (
                                            <button
                                                key={recipient.id}
                                                onClick={() => {
                                                    setSelectedConversation(recipient.id);
                                                    setShowNewMessageDialog(false);
                                                    if (isMobile) setViewMode('chat');
                                                }}
                                                className="w-full rounded-2xl p-3 text-left transition-all hover:bg-stone-50 flex items-center gap-3"
                                            >
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={recipient.photo_url || undefined} />
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
                                    </div>
                                </ScrollArea>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BroadcastCenter;
