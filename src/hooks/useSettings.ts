import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSettings = () => {
    const { data: settings, isLoading } = useQuery({
        queryKey: ["site-settings"],
        queryFn: async () => {
            const { data, error } = await supabase.from("site_settings").select("*").maybeSingle();
            if (error && error.code !== 'PGRST116') throw error;
            return data || {
                id: 1,
                upi_id: "indhurfarms@upi",
                shop_name: "Indhur Farms",
                qr_code_url: "",
                contact_email: "support@indhurfarms.com",
                promo_text: "Fresh from the farm to your doorstep."
            };
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    return { settings, loading: isLoading };
};
