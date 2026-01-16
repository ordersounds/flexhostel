import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export const useUnreadMessages = () => {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchUnreadCount = async () => {
        if (!user) {
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        try {
            // Count unread direct messages where user is the receiver
            const { count, error } = await supabase
                .from("messages")
                .select("*", { count: "exact", head: true })
                .eq("receiver_id", user.id)
                .is("read_at", null);

            if (error) {
                console.error("Error fetching unread count:", error);
                return;
            }

            setUnreadCount(count || 0);
        } catch (error) {
            console.error("Error fetching unread messages:", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (messageIds: string[]) => {
        if (!user || messageIds.length === 0) return;

        try {
            const { error } = await supabase
                .from("messages")
                .update({ read_at: new Date().toISOString() })
                .in("id", messageIds)
                .eq("receiver_id", user.id)
                .is("read_at", null);

            if (error) {
                console.error("Error marking messages as read:", error);
                return;
            }

            // Refresh count
            fetchUnreadCount();
        } catch (error) {
            console.error("Error marking messages as read:", error);
        }
    };

    const markConversationAsRead = async (senderId: string) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from("messages")
                .update({ read_at: new Date().toISOString() })
                .eq("sender_id", senderId)
                .eq("receiver_id", user.id)
                .is("read_at", null);

            if (error) {
                console.error("Error marking conversation as read:", error);
                return;
            }

            // Refresh count
            fetchUnreadCount();
        } catch (error) {
            console.error("Error marking conversation as read:", error);
        }
    };

    useEffect(() => {
        fetchUnreadCount();

        // Set up realtime subscription for new messages
        const channel = supabase
            .channel("unread-messages")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                },
                (payload) => {
                    // If the new message is for this user, refresh count
                    if (payload.new.receiver_id === user?.id) {
                        fetchUnreadCount();
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "messages",
                },
                () => {
                    // Refresh count when messages are updated (marked as read)
                    fetchUnreadCount();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    return {
        unreadCount,
        loading,
        markAsRead,
        markConversationAsRead,
        refetch: fetchUnreadCount,
    };
};
