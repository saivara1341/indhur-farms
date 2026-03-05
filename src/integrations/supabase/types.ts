export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            categories: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    description: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    description?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    description?: string | null
                    created_at?: string
                }
            }
            products: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    description: string | null
                    price: number
                    compare_at_price: number | null
                    image_url: string | null
                    gallery: string[] | null
                    stock: number
                    unit: string | null
                    category_id: string | null
                    is_active: boolean
                    is_featured: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    description?: string | null
                    price: number
                    compare_at_price?: number | null
                    image_url?: string | null
                    gallery?: string[] | null
                    stock?: number
                    unit?: string | null
                    category_id?: string | null
                    is_active?: boolean
                    is_featured?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    description?: string | null
                    price?: number
                    compare_at_price?: number | null
                    image_url?: string | null
                    gallery?: string[] | null
                    stock?: number
                    unit?: string | null
                    category_id?: string | null
                    is_active?: boolean
                    is_featured?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            user_roles: {
                Row: {
                    id: string
                    user_id: string
                    role: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    role: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    role?: string
                    created_at?: string
                }
            }
            cart_items: {
                Row: {
                    id: string
                    user_id: string
                    product_id: string
                    quantity: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    product_id: string
                    quantity?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    product_id?: string
                    quantity?: number
                    created_at?: string
                }
            }
            orders: {
                Row: {
                    id: string
                    user_id: string | null
                    total: number
                    shipping_address: string | null
                    phone: string | null
                    notes: string | null
                    status: string
                    payment_status: string
                    payment_txn_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    total: number
                    shipping_address?: string | null
                    phone?: string | null
                    notes?: string | null
                    status?: string
                    payment_status?: string
                    payment_txn_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    total?: number
                    shipping_address?: string | null
                    phone?: string | null
                    notes?: string | null
                    status?: string
                    payment_status?: string
                    payment_txn_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            order_items: {
                Row: {
                    id: string
                    order_id: string
                    product_id: string | null
                    quantity: number
                    price: number
                    created_at: string
                    price_at_time?: number // For Profile.tsx line 131
                }
                Insert: {
                    id?: string
                    order_id: string
                    product_id?: string | null
                    quantity: number
                    price: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    order_id?: string
                    product_id?: string | null
                    quantity?: number
                    price?: number
                    created_at?: string
                }
            }
            site_settings: {
                Row: {
                    id: string
                    upi_id: string | null
                    qr_code_url: string | null
                    created_at: string
                    updated_at: string
                    shop_name?: string
                    contact_email?: string
                    promo_text?: string
                }
                Insert: {
                    id?: string
                    upi_id?: string | null
                    qr_code_url?: string | null
                    created_at?: string
                    updated_at?: string
                    shop_name?: string
                    contact_email?: string
                    promo_text?: string
                }
                Update: {
                    id?: string
                    upi_id?: string | null
                    qr_code_url?: string | null
                    created_at?: string
                    updated_at?: string
                    shop_name?: string
                    contact_email?: string
                    promo_text?: string
                }
            }
            profiles: {
                Row: {
                    id: string
                    user_id: string
                    full_name: string | null
                    avatar_url: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    full_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                }
            }
            delivery_receipts: {
                Row: {
                    id: string
                    order_id: string | null
                    delivered_by: string | null
                    notes: string | null
                    photo_url: string | null
                    delivered_at: string | null
                    created_at: string
                    courier_name?: string // For Orders.tsx line 70
                    tracking_number?: string // For Orders.tsx line 71
                    status?: string // For Orders.tsx line 72
                }
                Insert: {
                    id?: string
                    order_id?: string | null
                    delivered_by?: string | null
                    notes?: string | null
                    photo_url?: string | null
                    delivered_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    order_id?: string | null
                    delivered_by?: string | null
                    notes?: string | null
                    photo_url?: string | null
                    delivered_at?: string | null
                    created_at?: string
                }
            }
        }
        Views: {
            revenue_summary: {
                Row: {
                    day: string | null
                    revenue: number | null
                    order_count: number | null
                }
            }
            revenue_forecast: {
                Row: {
                    predicted_weekly_revenue: number | null
                }
            }
            top_products: {
                Row: {
                    id: string | null
                    name: string | null
                    image_url: string | null
                    units_sold: number | null
                    revenue: number | null
                }
            }
        }
        Functions: {
            is_admin: {
                Args: Record<PropertyKey, never>
                Returns: boolean
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}