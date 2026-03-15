import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function update() {
  const { data, error } = await supabase.from('products').update({
    variants: [
      { id: 'v1', unit: '250g', price: 150, stock: 100 },
      { id: 'v2', unit: '500g', price: 280, stock: 50 },
      { id: 'v3', unit: '1kg', price: 540, stock: 20 }
    ]
  }).eq('name', 'Pure Turmeric Powder');

  if (error) {
    console.error('Error updating:', error);
  } else {
    console.log('Successfully updated Turmeric Powder with variants');
  }
}

update();
