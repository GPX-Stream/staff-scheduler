import { Redis } from '@upstash/redis';

// Vercel's Upstash integration uses KV_REST_API_* variables
export const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// Redis keys for schedule data
export const KEYS = {
  STAFF: 'schedule:staff',
  BLOCKS: 'schedule:blocks',
  VERSION: 'schedule:version',
};

// Redis key for authentication (single object with all users)
export const AUTH_KEYS = {
  USERS: 'users',
};

// Redis key for app configuration
export const CONFIG_KEYS = {
  CONFIG: 'app:config',
};

// Default configuration values (used when no config exists in DB)
export const DEFAULT_CONFIG = {
  coverage: {
    start: 8,   // 8am
    end: 18,    // 6pm
  },
  timezones: [
    { id: 'Pacific/Honolulu', label: 'Hawaii (HST)' },
    { id: 'America/Anchorage', label: 'Alaska (AKT)' },
    { id: 'America/Los_Angeles', label: 'California (PT)' },
    { id: 'America/Denver', label: 'Denver (MT)' },
    { id: 'America/Chicago', label: 'Dallas (CT)' },
    { id: 'America/New_York', label: 'Florida (ET)' },
    { id: 'America/Puerto_Rico', label: 'Puerto Rico (AT)' },
    { id: 'America/Sao_Paulo', label: 'Brazil (BRT)' },
    { id: 'Europe/London', label: 'UK (GMT/BST)' },
    { id: 'Europe/Paris', label: 'France (CET/CEST)' },
    { id: 'Africa/Johannesburg', label: 'South Africa (SAST)' },
    { id: 'Europe/Moscow', label: 'Moscow (MSK)' },
    { id: 'Asia/Dubai', label: 'Dubai (GST)' },
    { id: 'Asia/Karachi', label: 'Pakistan (PKT)' },
    { id: 'Asia/Dhaka', label: 'Bangladesh (BST)' },
    { id: 'Asia/Bangkok', label: 'Cambodia (ICT)' },
    { id: 'Asia/Singapore', label: 'Singapore (SGT)' },
    { id: 'Asia/Tokyo', label: 'Japan (JST)' },
    { id: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
    { id: 'Pacific/Auckland', label: 'New Zealand (NZST/NZDT)' },
  ],
  colors: [
    { name: 'blue', bg: 'bg-blue-500', light: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-700', hex: '#3b82f6' },
    { name: 'emerald', bg: 'bg-emerald-500', light: 'bg-emerald-100', border: 'border-emerald-500', text: 'text-emerald-700', hex: '#10b981' },
    { name: 'violet', bg: 'bg-violet-500', light: 'bg-violet-100', border: 'border-violet-500', text: 'text-violet-700', hex: '#8b5cf6' },
    { name: 'amber', bg: 'bg-amber-500', light: 'bg-amber-100', border: 'border-amber-500', text: 'text-amber-700', hex: '#f59e0b' },
    { name: 'rose', bg: 'bg-rose-500', light: 'bg-rose-100', border: 'border-rose-500', text: 'text-rose-700', hex: '#f43f5e' },
    { name: 'cyan', bg: 'bg-cyan-500', light: 'bg-cyan-100', border: 'border-cyan-500', text: 'text-cyan-700', hex: '#06b6d4' },
    { name: 'orange', bg: 'bg-orange-500', light: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-700', hex: '#f97316' },
    { name: 'indigo', bg: 'bg-indigo-500', light: 'bg-indigo-100', border: 'border-indigo-500', text: 'text-indigo-700', hex: '#6366f1' },
  ],
  roles: [
    { id: 'admin', label: 'Admin', color: 'blue' },
    { id: 'tier1', label: 'Support - Tier 1', color: 'green' },
    { id: 'tier2', label: 'Support - Tier 2', color: 'amber' },
  ],
};
