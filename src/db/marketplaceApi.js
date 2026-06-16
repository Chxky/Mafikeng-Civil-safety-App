import { supabase, isLive } from './supabase';
import { uuid, delay } from '../utils/helpers';

let businessListings = [];
let classifiedListings = [];

export async function getBusinessListings(filters = {}) {
  if (isLive) {
    let query = supabase.from('business_listings').select('*').eq('is_active', true);
    if (filters.category) query = query.eq('category', filters.category);
    query = query.order('is_verified', { ascending: false }).order('created_at', { ascending: false });
    const { data, error } = await query;
    return { data: data || [], error: error?.message };
  }
  await delay(200);
  let result = businessListings.filter(b => b.is_active);
  if (filters.category) result = result.filter(b => b.category === filters.category);
  return { data: result, error: null };
}

export async function createBusinessListing(listing) {
  if (isLive) {
    const { data, error } = await supabase.from('business_listings').insert(listing).select().single();
    return { data, error: error?.message };
  }
  await delay(400);
  const newListing = { id: uuid(), ...listing, is_verified: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  businessListings.push(newListing);
  return { data: newListing, error: null };
}

export async function getClassifiedListings(filters = {}) {
  if (isLive) {
    let query = supabase.from('classified_listings').select('*').eq('is_active', true);
    if (filters.type) query = query.eq('listing_type', filters.type);
    query = query.order('created_at', { ascending: false });
    const { data, error } = await query;
    return { data: data || [], error: error?.message };
  }
  await delay(200);
  let result = classifiedListings.filter(c => c.is_active);
  if (filters.type) result = result.filter(c => c.listing_type === filters.type);
  return { data: result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), error: null };
}

export async function createClassifiedListing(listing) {
  if (isLive) {
    const { data, error } = await supabase.from('classified_listings').insert(listing).select().single();
    return { data, error: error?.message };
  }
  await delay(400);
  const newListing = { id: uuid(), ...listing, is_anonymous: false, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  classifiedListings.push(newListing);
  return { data: newListing, error: null };
}

export function seedMarketplaceData() {
  businessListings = [
    { id: uuid(), user_token: uuid(), business_name: 'Mmabatho Spaza Shop', category: 'retail', phone: '072 345 6789', address: '12 Unit 5, Mmabatho', latitude: -25.8490, longitude: 25.6370, description: 'Neighbourhood spaza shop with groceries, toiletries, and airtime.', hours: '06:00-21:00 daily', is_verified: true, is_active: true, created_at: new Date(Date.now() - 90 * 86400000).toISOString(), updated_at: new Date().toISOString() },
    { id: uuid(), user_token: uuid(), business_name: 'Mahikeng Fresh Market', category: 'food_dining', phone: '073 456 7890', address: '45 Station Road, Mahikeng', latitude: -25.8640, longitude: 25.6440, description: 'Fresh produce, meat, and dairy. Local suppliers. Weekly specials.', hours: '07:00-18:00 weekdays, 07:00-15:00 Sat', is_verified: true, is_active: true, created_at: new Date(Date.now() - 60 * 86400000).toISOString(), updated_at: new Date().toISOString() },
    { id: uuid(), user_token: uuid(), business_name: 'Riviera Guest House', category: 'accommodation', phone: '074 567 8901', address: '8 Buffalo Road, Riviera Park', latitude: -25.8690, longitude: 25.6330, description: 'Comfortable B&B accommodation. 8 en-suite rooms, free WiFi, breakfast included.', hours: 'Check-in 14:00, Check-out 10:00', is_verified: true, is_active: true, created_at: new Date(Date.now() - 45 * 86400000).toISOString(), updated_at: new Date().toISOString() },
    { id: uuid(), user_token: uuid(), business_name: 'CBD Fashion Boutique', category: 'retail', phone: '075 678 9012', address: '22 Church Street, Mahikeng CBD', latitude: -25.8615, longitude: 25.6435, description: 'Women\'s and men\'s fashion, traditional wear, and accessories.', hours: '09:00-17:30 weekdays, 09:00-14:00 Sat', is_verified: false, is_active: true, created_at: new Date(Date.now() - 30 * 86400000).toISOString(), updated_at: new Date().toISOString() },
    { id: uuid(), user_token: uuid(), business_name: 'Montshiwa Butchery', category: 'food_dining', phone: '076 789 0123', address: '88 Montshiwa Township', latitude: -25.8560, longitude: 25.6510, description: 'Fresh beef, chicken, and goat meat. Free range and affordable.', hours: '06:00-17:30 weekdays, 06:00-14:00 Sat', is_verified: true, is_active: true, created_at: new Date(Date.now() - 120 * 86400000).toISOString(), updated_at: new Date().toISOString() },
    { id: uuid(), user_token: uuid(), business_name: 'Precious Hair & Beauty', category: 'health_beauty', phone: '077 890 1234', address: '5 First Avenue, Riviera Park', latitude: -25.8730, longitude: 25.6360, description: 'Hair styling, braiding, makeup, and beauty treatments.', hours: '08:00-19:00 Tue-Sat', is_verified: false, is_active: true, created_at: new Date(Date.now() - 20 * 86400000).toISOString(), updated_at: new Date().toISOString() },
    { id: uuid(), user_token: uuid(), business_name: 'Tlhabano Transport Services', category: 'transport', phone: '078 901 2345', address: '99 Nelson Mandela Drive, Mahikeng', latitude: -25.8590, longitude: 25.6420, description: 'Local and intercity transport. Minibus hires, courier services, and school transport.', hours: '05:00-20:00 daily', is_verified: true, is_active: true, created_at: new Date(Date.now() - 180 * 86400000).toISOString(), updated_at: new Date().toISOString() },
  ];

  classifiedListings = [
    { id: uuid(), user_token: uuid(), listing_type: 'for_sale', title: 'Samsung 55" Smart TV', description: 'Excellent condition, 2 years old. Includes wall mount and all cables.', price: 6500, category: 'electronics', phone: '072 111 2222', latitude: -25.8640, longitude: 25.6440, is_anonymous: false, is_active: true, created_at: new Date(Date.now() - 2 * 86400000).toISOString(), updated_at: new Date().toISOString() },
    { id: uuid(), user_token: uuid(), listing_type: 'for_sale', title: 'Toyota Corolla 2019', description: 'Well maintained, 60,000km. Service history available. Cash only.', price: 185000, category: 'vehicles', phone: '073 333 4444', latitude: -25.8620, longitude: 25.6410, is_anonymous: false, is_active: true, created_at: new Date(Date.now() - 5 * 86400000).toISOString(), updated_at: new Date().toISOString() },
    { id: uuid(), user_token: uuid(), listing_type: 'wanted', title: 'Looking for 2-bedroom house to rent', description: 'House or flat in Riviera Park or CBD. Max R4,500/month. Long term.', price: 4500, category: 'housing', phone: '074 555 6666', is_anonymous: true, is_active: true, created_at: new Date(Date.now() - 1 * 86400000).toISOString(), updated_at: new Date().toISOString() },
    { id: uuid(), user_token: uuid(), listing_type: 'services', title: 'Professional Plumber Available', description: '20 years experience. Leaks, burst pipes, geyser installation. Call or WhatsApp.', price: null, category: 'home_services', phone: '076 777 8888', latitude: -25.8650, longitude: 25.6450, is_anonymous: false, is_active: true, created_at: new Date(Date.now() - 3 * 86400000).toISOString(), updated_at: new Date().toISOString() },
    { id: uuid(), user_token: uuid(), listing_type: 'services', title: 'Mathematics Tutor — Grades 10-12', description: 'Experienced teacher. Maths and Science. R100/hr. Group discounts available.', price: 100, category: 'education', phone: '079 999 0000', is_anonymous: false, is_active: true, created_at: new Date(Date.now() - 7 * 86400000).toISOString(), updated_at: new Date().toISOString() },
    { id: uuid(), user_token: uuid(), listing_type: 'for_sale', title: 'Double Bed + Mattress', description: 'Good condition. Wooden frame with storage drawers underneath.', price: 2500, category: 'furniture', phone: '071 222 3333', latitude: -25.8600, longitude: 25.6400, is_anonymous: false, is_active: true, created_at: new Date(Date.now() - 4 * 86400000).toISOString(), updated_at: new Date().toISOString() },
  ];
}

seedMarketplaceData();
