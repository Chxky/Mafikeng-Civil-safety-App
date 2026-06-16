import { describe, it, expect, beforeEach } from 'vitest';
import {
  getBusinessListings,
  createBusinessListing,
  getClassifiedListings,
  createClassifiedListing,
  seedMarketplaceData,
} from '../db/marketplaceApi';

beforeEach(() => {
  seedMarketplaceData();
});

describe('getBusinessListings', () => {
  it('returns all active business listings', async () => {
    const { data, error } = await getBusinessListings();
    expect(error).toBeNull();
    expect(data.length).toBe(7);
  });

  it('filters by category', async () => {
    const { data } = await getBusinessListings({ category: 'retail' });
    expect(data.length).toBe(2);
    data.forEach(b => expect(b.category).toBe('retail'));
  });

  it('filters by food_dining category', async () => {
    const { data } = await getBusinessListings({ category: 'food_dining' });
    expect(data.length).toBe(2);
    data.forEach(b => expect(b.category).toBe('food_dining'));
  });

  it('verified businesses appear first', async () => {
    const { data } = await getBusinessListings();
    const firstVerifiedIdx = data.findIndex(b => b.is_verified);
    const firstUnverifiedIdx = data.findIndex(b => !b.is_verified);
    expect(firstVerifiedIdx).toBeLessThan(firstUnverifiedIdx);
  });

  it('each listing has required fields', async () => {
    const { data } = await getBusinessListings();
    data.forEach(b => {
      expect(b).toHaveProperty('id');
      expect(b).toHaveProperty('business_name');
      expect(b).toHaveProperty('category');
      expect(b).toHaveProperty('phone');
      expect(b).toHaveProperty('is_verified');
    });
  });
});

describe('createBusinessListing', () => {
  it('creates a new business listing', async () => {
    const { data, error } = await createBusinessListing({
      user_token: 'user-1',
      business_name: 'Test Cafe',
      category: 'food_dining',
      phone: '081 234 5678',
      description: 'A test cafe',
    });
    expect(error).toBeNull();
    expect(data).toHaveProperty('id');
    expect(data.business_name).toBe('Test Cafe');
    expect(data.is_verified).toBe(false);
    expect(data.is_active).toBe(true);
    expect(data).toHaveProperty('created_at');
    expect(data).toHaveProperty('updated_at');
  });

  it('listing is retrievable after creation', async () => {
    await createBusinessListing({
      user_token: 'user-1',
      business_name: 'New Shop',
      category: 'retail',
    });

    const { data } = await getBusinessListings({ category: 'retail' });
    expect(data.length).toBe(3);
    expect(data.some(b => b.business_name === 'New Shop')).toBe(true);
  });
});

describe('getClassifiedListings', () => {
  it('returns all active classifieds', async () => {
    const { data, error } = await getClassifiedListings();
    expect(error).toBeNull();
    expect(data.length).toBe(6);
  });

  it('filters by listing type', async () => {
    const { data: forSale } = await getClassifiedListings({ type: 'for_sale' });
    expect(forSale.length).toBe(3);
    forSale.forEach(c => expect(c.listing_type).toBe('for_sale'));

    const { data: services } = await getClassifiedListings({ type: 'services' });
    expect(services.length).toBe(2);
    services.forEach(c => expect(c.listing_type).toBe('services'));
  });

  it('returns results sorted by created_at descending', async () => {
    const { data } = await getClassifiedListings();
    for (let i = 1; i < data.length; i++) {
      expect(new Date(data[i - 1].created_at).getTime())
        .toBeGreaterThanOrEqual(new Date(data[i].created_at).getTime());
    }
  });
});

describe('createClassifiedListing', () => {
  it('creates a for-sale listing', async () => {
    const { data, error } = await createClassifiedListing({
      user_token: 'user-1',
      listing_type: 'for_sale',
      title: 'Used Bicycle',
      description: 'Good condition',
      price: 500,
      category: 'sports',
    });
    expect(error).toBeNull();
    expect(data.title).toBe('Used Bicycle');
    expect(data.price).toBe(500);
    expect(data.is_active).toBe(true);
  });

  it('creates a wanted listing', async () => {
    const { data } = await createClassifiedListing({
      user_token: 'user-1',
      listing_type: 'wanted',
      title: 'Looking for fridge',
      price: 3000,
      category: 'appliances',
    });
    expect(data.listing_type).toBe('wanted');
    expect(data.is_anonymous).toBe(false);
  });

  it('creates a services listing', async () => {
    const { data } = await createClassifiedListing({
      user_token: 'user-1',
      listing_type: 'services',
      title: 'Painting Services',
      description: 'Interior and exterior painting',
      price: null,
      category: 'home_services',
    });
    expect(data.listing_type).toBe('services');
    expect(data.price).toBeNull();
  });

  it('listing is retrievable after creation', async () => {
    await createClassifiedListing({
      user_token: 'user-1',
      listing_type: 'for_sale',
      title: 'New Item',
      category: 'other',
    });

    const { data } = await getClassifiedListings({ type: 'for_sale' });
    expect(data.length).toBe(4);
  });
});
