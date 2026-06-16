import { describe, it, expect, beforeEach } from 'vitest';
import {
  getMunicipalDocuments,
  getDocumentById,
  seedDocumentsData,
} from '../db/documentsApi';

beforeEach(() => {
  seedDocumentsData();
});

describe('getMunicipalDocuments', () => {
  it('returns all active documents', async () => {
    const { data, error } = await getMunicipalDocuments();
    expect(error).toBeNull();
    expect(data.length).toBe(10);
  });

  it('filters by document type', async () => {
    const { data } = await getMunicipalDocuments({ type: 'idp' });
    expect(data.length).toBe(1);
    expect(data[0].document_type).toBe('idp');
  });

  it('filters by by_law type', async () => {
    const { data } = await getMunicipalDocuments({ type: 'by_law' });
    expect(data.length).toBe(2);
    data.forEach(d => expect(d.document_type).toBe('by_law'));
  });

  it('filters by year', async () => {
    const { data } = await getMunicipalDocuments({ year: '2025' });
    expect(data.length).toBeGreaterThan(0);
    data.forEach(d => expect(d.year).toBe('2025'));
  });

  it('filters by search term', async () => {
    const { data } = await getMunicipalDocuments({ search: 'budget' });
    expect(data.length).toBeGreaterThan(0);
    data.forEach(d => {
      const match = d.title.toLowerCase().includes('budget') ||
        (d.description && d.description.toLowerCase().includes('budget'));
      expect(match).toBe(true);
    });
  });

  it('returns empty for nonexistent type', async () => {
    const { data } = await getMunicipalDocuments({ type: 'nonexistent' });
    expect(data).toEqual([]);
  });

  it('each document has required fields', async () => {
    const { data } = await getMunicipalDocuments();
    data.forEach(d => {
      expect(d).toHaveProperty('id');
      expect(d).toHaveProperty('title');
      expect(d).toHaveProperty('document_type');
      expect(d).toHaveProperty('year');
      expect(d).toHaveProperty('is_offline_available');
    });
  });
});

describe('getDocumentById', () => {
  it('returns a document by its id', async () => {
    const { data: all } = await getMunicipalDocuments();
    const target = all[0];

    const { data, error } = await getDocumentById(target.id);
    expect(error).toBeNull();
    expect(data.id).toBe(target.id);
    expect(data.title).toBe(target.title);
  });

  it('returns null and error for nonexistent id', async () => {
    const { data, error } = await getDocumentById('nonexistent-id');
    expect(data).toBeNull();
    expect(error).toBe('Not found');
  });
});
