// Encryption utilities using Web Crypto API
// Implements pseudonymous auth and E2E encryption for patrol chat

const TOKEN_KEY = 'mahikeng_user_token';
// eslint-disable-next-line no-unused-vars
const CONTACTS_KEY = 'mahikeng_emergency_contacts';

/**
 * Generate a cryptographically secure random token for pseudonymous auth
 */
export function generateUserToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get or create user token (stored in localStorage)
 */
export function getOrCreateUserToken() {
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = generateUserToken();
    localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

/**
 * Generate a display name from token (consistent pseudonym)
 */
export function generateDisplayName(token) {
  const adjectives = [
    'Brave', 'Watchful', 'Guardian', 'Silent', 'Swift',
    'Bold', 'Alert', 'Steady', 'Keen', 'Noble',
  ];
  const nouns = [
    'Eagle', 'Shield', 'Sentinel', 'Watchman', 'Guardian',
    'Protector', 'Ranger', 'Scout', 'Keeper', 'Defender',
  ];

  // Use token bytes to deterministically pick words
  const hash = token.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const adj = adjectives[hash % adjectives.length];
  const noun = nouns[(hash * 7) % nouns.length];

  return `${adj} ${noun}`;
}

/**
 * Hash data for privacy (one-way)
 */
export async function hashData(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encrypt data for E2E messaging (AES-GCM)
 */
export async function generateEncryptionKey() {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function exportKey(key) {
  const exported = await crypto.subtle.exportKey('raw', key);
  return Array.from(new Uint8Array(exported))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function importKey(keyHex) {
  const keyBytes = new Uint8Array(
    keyHex.match(/.{2}/g).map(byte => parseInt(byte, 16))
  );
  return crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encryptMessage(message, key) {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(message)
  );

  return {
    iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
    data: Array.from(new Uint8Array(encrypted))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(''),
  };
}

export async function decryptMessage(encryptedData, key) {
  const iv = new Uint8Array(
    encryptedData.iv.match(/.{2}/g).map(byte => parseInt(byte, 16))
  );
  const data = new Uint8Array(
    encryptedData.data.match(/.{2}/g).map(byte => parseInt(byte, 16))
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Encrypt emergency contacts for local storage
 */
export async function encryptContacts(contacts, token) {
  try {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(token.substring(0, 32)),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('mahikeng-salt'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(JSON.stringify(contacts))
    );

    return {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted)),
    };
  } catch (err) {
    console.error('Encryption failed:', err);
    return null;
  }
}

/**
 * Decrypt emergency contacts from local storage
 */
export async function decryptContacts(encryptedData, token) {
  try {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(token.substring(0, 32)),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('mahikeng-salt'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(encryptedData.iv) },
      key,
      new Uint8Array(encryptedData.data)
    );

    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch (err) {
    console.error('Decryption failed:', err);
    return [];
  }
}
