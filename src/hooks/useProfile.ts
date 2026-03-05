import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserProfile {
    id?: string;
    user_id: string;
    avatar_url?: string;
    instagram_handles: string[];
    whatsapp_numbers: string[];
    gmail_addresses: string[];
}

const defaultProfile = (userId: string): UserProfile => ({
    user_id: userId,
    avatar_url: "",
    instagram_handles: [],
    whatsapp_numbers: [],
    gmail_addresses: [],
});

export const useProfile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchProfile = useCallback(async () => {
        if (!user?.id) { setLoading(false); return; }
        setLoading(true);
        const { data } = await supabase
            .from("user_profiles" as any)
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();
        if (data) {
            setProfile(data as unknown as UserProfile);
        } else {
            setProfile(defaultProfile(user.id));
        }
        setLoading(false);
    }, [user?.id]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    const saveProfile = async (updated: UserProfile) => {
        if (!user?.id) return false;
        setSaving(true);
        const { error } = await supabase
            .from("user_profiles" as any)
            .upsert({ ...updated, user_id: user.id }, { onConflict: "user_id" });
        setSaving(false);
        if (!error) {
            setProfile(updated);
            return true;
        }
        return false;
    };

    return { profile, loading, saving, saveProfile, refetch: fetchProfile };
};
