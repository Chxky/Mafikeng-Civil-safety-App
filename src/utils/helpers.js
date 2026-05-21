import { formatDistanceToNow, format } from 'date-fns';

/**
 * Format relative time
 */
export function timeAgo(dateStr) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return 'recently';
  }
}

/**
 * Format date for display
 */
export function formatDate(dateStr) {
  try {
    return format(new Date(dateStr), 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

/**
 * Format date and time
 */
export function formatDateTime(dateStr) {
  try {
    return format(new Date(dateStr), 'dd MMM yyyy, HH:mm');
  } catch {
    return dateStr;
  }
}

/**
 * Category display info
 */
export const CATEGORIES = {
  pothole: { label: 'Pothole', icon: '🕳️', color: 'text-orange-600', bg: 'bg-orange-100' },
  water_leak: { label: 'Water Leak', icon: '💧', color: 'text-blue-600', bg: 'bg-blue-100' },
  sewage: { label: 'Sewage', icon: '⚠️', color: 'text-red-600', bg: 'bg-red-100' },
  streetlight: { label: 'Streetlight', icon: '💡', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  electricity: { label: 'Electricity', icon: '⚡', color: 'text-purple-600', bg: 'bg-purple-100' },
  illegal_dumping: { label: 'Illegal Dumping', icon: '🗑️', color: 'text-gray-600', bg: 'bg-gray-100' },
  housing: { label: 'Housing', icon: '🏠', color: 'text-indigo-600', bg: 'bg-indigo-100' },
  other: { label: 'Other', icon: '📋', color: 'text-gray-600', bg: 'bg-gray-100' },
};

/**
 * Incident type display info
 */
export const INCIDENT_TYPES = {
  suspicious_activity: { label: 'Suspicious Activity', icon: '👁️', color: 'text-amber-600', bg: 'bg-amber-100' },
  theft: { label: 'Theft', icon: '🔓', color: 'text-red-600', bg: 'bg-red-100' },
  vandalism: { label: 'Vandalism', icon: '🔨', color: 'text-orange-600', bg: 'bg-orange-100' },
  assault: { label: 'Assault', icon: '🚨', color: 'text-red-700', bg: 'bg-red-100' },
  break_in: { label: 'Break-in', icon: '🚪', color: 'text-red-600', bg: 'bg-red-100' },
  car_theft: { label: 'Car Theft', icon: '🚗', color: 'text-orange-600', bg: 'bg-orange-100' },
  drug_activity: { label: 'Drug Activity', icon: '💊', color: 'text-purple-600', bg: 'bg-purple-100' },
  noise: { label: 'Noise Disturbance', icon: '🔊', color: 'text-gray-600', bg: 'bg-gray-100' },
  other: { label: 'Other', icon: '📋', color: 'text-gray-600', bg: 'bg-gray-100' },
};

/**
 * Status display info
 */
export const STATUSES = {
  pending: { label: 'Pending', color: 'text-warning-700', bg: 'bg-warning-100', dot: 'bg-warning-400' },
  acknowledged: { label: 'Acknowledged', color: 'text-civic-700', bg: 'bg-civic-100', dot: 'bg-civic-400' },
  in_progress: { label: 'In Progress', color: 'text-purple-700', bg: 'bg-purple-100', dot: 'bg-purple-400' },
  resolved: { label: 'Resolved', color: 'text-safety-700', bg: 'bg-safety-100', dot: 'bg-safety-400' },
  closed: { label: 'Closed', color: 'text-gray-700', bg: 'bg-gray-100', dot: 'bg-gray-400' },
};

/**
 * Urgency display info
 */
export const URGENCY_LEVELS = {
  low: { label: 'Low', color: 'text-gray-600', bg: 'bg-gray-100' },
  normal: { label: 'Normal', color: 'text-civic-600', bg: 'bg-civic-100' },
  high: { label: 'High', color: 'text-warning-600', bg: 'bg-warning-100' },
  critical: { label: 'Critical', color: 'text-danger-600', bg: 'bg-danger-100' },
};

// ============================================================
// MAHIKENG MUNICIPAL DEPARTMENTS
// ============================================================
export const DEPARTMENTS = {
  roads: {
    name: 'Roads & Stormwater',
    shortName: 'Roads',
    icon: '🛣️',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    head: 'Director: Roads & Stormwater',
    phone: '018 381 8200',
    email: 'roads@mahikeng.gov.za',
    categories: ['pothole'],
  },
  water: {
    name: 'Water Services',
    shortName: 'Water',
    icon: '💧',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    head: 'Director: Water Services',
    phone: '018 381 8300',
    email: 'water@mahikeng.gov.za',
    categories: ['water_leak'],
  },
  sanitation: {
    name: 'Sanitation & Sewerage',
    shortName: 'Sanitation',
    icon: '🚰',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    head: 'Director: Sanitation',
    phone: '018 381 8310',
    email: 'sanitation@mahikeng.gov.za',
    categories: ['sewage'],
  },
  electricity: {
    name: 'Electricity & Energy',
    shortName: 'Electricity',
    icon: '⚡',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    head: 'Director: Electricity',
    phone: '018 381 8320',
    email: 'electricity@mahikeng.gov.za',
    categories: ['streetlight', 'electricity'],
  },
  waste: {
    name: 'Waste Management',
    shortName: 'Waste',
    icon: '♻️',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    head: 'Director: Waste Management',
    phone: '018 381 8330',
    email: 'waste@mahikeng.gov.za',
    categories: ['illegal_dumping'],
  },
  housing: {
    name: 'Housing & Human Settlements',
    shortName: 'Housing',
    icon: '🏠',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    head: 'Director: Housing',
    phone: '018 381 8340',
    email: 'housing@mahikeng.gov.za',
    categories: ['housing'],
  },
  community: {
    name: 'Community & Customer Services',
    shortName: 'Customer Services',
    icon: '🏛️',
    color: 'text-gray-700',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    head: 'Director: Community Services',
    phone: '018 381 8100',
    email: 'info@mahikeng.gov.za',
    categories: ['other'],
  },
};

// Category -> Department lookup
export const CATEGORY_TO_DEPARTMENT = {};
Object.entries(DEPARTMENTS).forEach(([key, dept]) => {
  dept.categories.forEach(cat => {
    CATEGORY_TO_DEPARTMENT[cat] = key;
  });
});

/**
 * Check if device is online
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Debounce function
 */
export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Compress image before upload
 */
export function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => resolve(blob),
          'image/jpeg',
          quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Vibrate device (for SOS feedback)
 */
export function vibrate(pattern = [200, 100, 200]) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

/**
 * Show toast notification
 */
export let showToast = null;

export function setToastHandler(handler) {
  showToast = handler;
}

/**
 * Network status change listener
 */
export function onNetworkChange(callback) {
  const handler = () => callback(navigator.onLine);
  window.addEventListener('online', handler);
  window.addEventListener('offline', handler);
  return () => {
    window.removeEventListener('online', handler);
    window.removeEventListener('offline', handler);
  };
}
