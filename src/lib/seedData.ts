import { supabase } from "@/integrations/supabase/client";

export const seedSampleData = async () => {
  try {
    // 1. Seed Categories
    const categories = [
      { name: "Turmeric Products 🟡", slug: "turmeric-products", description: "Pasupu kommulu, turmeric powder and extracts from Indhur Farms" },
      { name: "Fruits 🍎", slug: "fruits", description: "Fresh seasonal fruits directly from our orchards" },
      { name: "Vegetables 🥦", slug: "vegetables", description: "Farm-fresh vegetables grown without harmful pesticides" },
      { name: "Paddy & Grains 🌾", slug: "paddy-grains", description: "Premium rice, paddy and other grains" },
      { name: "Sugarcane & Jaggery 🎋", slug: "sugarcane-jaggery", description: "Natural sugarcane products and pure jaggery" },
      { name: "Other Farm Products 🧺", slug: "other-farm-products", description: "All other seasonal and specialty farm produce" },
    ];

    const { data: seededCategories, error: catError } = await supabase
      .from("categories")
      .upsert(categories, { onConflict: "slug" })
      .select();

    if (catError) throw catError;

    const catMap = seededCategories.reduce((acc: any, curr) => {
      acc[curr.slug] = curr.id;
      return acc;
    }, {});

    // 2. Seed Products (no images — admin uploads images via Admin panel)
    // 2. Seed Products (no images — admin uploads images via Admin panel)
    const products = [
      // Dry Turmeric Fingers
      { name: "Dry Turmeric Fingers (పసుపు కొమ్ములు) - 250g", slug: "dry-turmeric-fingers-250g", price: 80, compare_at_price: 100, category_id: catMap["turmeric-products"], unit: "250g", stock: 100, is_featured: true, description: "Premium quality raw turmeric fingers (Pasupu Kommulu)." },
      { name: "Dry Turmeric Fingers (పసుపు కొమ్ములు) - 500g", slug: "dry-turmeric-fingers-500g", price: 140, compare_at_price: 160, category_id: catMap["turmeric-products"], unit: "500g", stock: 100, is_featured: true, description: "Premium quality raw turmeric fingers (Pasupu Kommulu)." },
      { name: "Dry Turmeric Fingers (పసుపు కొమ్ములు) - 1kg", slug: "dry-turmeric-fingers-1kg", price: 270, compare_at_price: 300, category_id: catMap["turmeric-products"], unit: "1kg", stock: 100, is_featured: true, description: "Premium quality raw turmeric fingers (Pasupu Kommulu)." },
      { name: "Dry Turmeric Fingers (పసుపు కొమ్ములు) - 2kg", slug: "dry-turmeric-fingers-2kg", price: 510, compare_at_price: 550, category_id: catMap["turmeric-products"], unit: "2kg", stock: 100, is_featured: false, description: "Premium quality raw turmeric fingers (Pasupu Kommulu)." },
      { name: "Dry Turmeric Fingers (పసుపు కొమ్ములు) - 3kg", slug: "dry-turmeric-fingers-3kg", price: 775, compare_at_price: 850, category_id: catMap["turmeric-products"], unit: "3kg", stock: 100, is_featured: false, description: "Premium quality raw turmeric fingers (Pasupu Kommulu)." },
      { name: "Dry Turmeric Fingers (పసుపు కొమ్ములు) - 4kg", slug: "dry-turmeric-fingers-4kg", price: 999, compare_at_price: 1100, category_id: catMap["turmeric-products"], unit: "4kg", stock: 100, is_featured: false, description: "Premium quality raw turmeric fingers (Pasupu Kommulu)." },
      { name: "Dry Turmeric Fingers (పసుపు కొమ్ములు) - 5kg", slug: "dry-turmeric-fingers-5kg", price: 1250, compare_at_price: 1400, category_id: catMap["turmeric-products"], unit: "5kg", stock: 100, is_featured: false, description: "Premium quality raw turmeric fingers (Pasupu Kommulu)." },

      // Pure Turmeric Powder
      { name: "Pure Turmeric Powder (పసుపు పొడి) - 250g", slug: "pure-turmeric-powder-250g", price: 120, compare_at_price: 150, category_id: catMap["turmeric-products"], unit: "250g", stock: 100, is_featured: true, description: "Pure, stone-ground turmeric powder from Indhur Farms." },
      { name: "Pure Turmeric Powder (పసుపు పొడి) - 500g", slug: "pure-turmeric-powder-500g", price: 150, compare_at_price: 180, category_id: catMap["turmeric-products"], unit: "500g", stock: 100, is_featured: true, description: "Pure, stone-ground turmeric powder from Indhur Farms." },
      { name: "Pure Turmeric Powder (పసుపు పొడి) - 1kg", slug: "pure-turmeric-powder-1kg", price: 290, compare_at_price: 330, category_id: catMap["turmeric-products"], unit: "1kg", stock: 100, is_featured: true, description: "Pure, stone-ground turmeric powder from Indhur Farms." },
      { name: "Pure Turmeric Powder (పసుపు పొడి) - 2kg", slug: "pure-turmeric-powder-2kg", price: 550, compare_at_price: 600, category_id: catMap["turmeric-products"], unit: "2kg", stock: 100, is_featured: false, description: "Pure, stone-ground turmeric powder from Indhur Farms." },
      { name: "Pure Turmeric Powder (పసుపు పొడి) - 3kg", slug: "pure-turmeric-powder-3kg", price: 825, compare_at_price: 900, category_id: catMap["turmeric-products"], unit: "3kg", stock: 100, is_featured: false, description: "Pure, stone-ground turmeric powder from Indhur Farms." },
      { name: "Pure Turmeric Powder (పసుపు పొడి) - 4kg", slug: "pure-turmeric-powder-4kg", price: 1095, compare_at_price: 1200, category_id: catMap["turmeric-products"], unit: "4kg", stock: 100, is_featured: false, description: "Pure, stone-ground turmeric powder from Indhur Farms." },
      { name: "Pure Turmeric Powder (పసుపు పొడి) - 5kg", slug: "pure-turmeric-powder-5kg", price: 1350, compare_at_price: 1500, category_id: catMap["turmeric-products"], unit: "5kg", stock: 100, is_featured: false, description: "Pure, stone-ground turmeric powder from Indhur Farms." },
    ];

    const { error: prodError } = await supabase
      .from("products")
      .upsert(products, { onConflict: "slug" });

    if (prodError) throw prodError;

    return { success: true };
  } catch (error: any) {
    console.error("Seeding error:", error);
    return { success: false, error: error.message };
  }
};
