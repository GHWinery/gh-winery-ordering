// ============================================================
// Supabase Configuration
// Replace these with your actual Supabase project credentials
// ============================================================
const SUPABASE_URL = 'https://usbfburremowjppqwsqe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzYmZidXJyZW1vd2pwcHF3c3FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NjM3MzcsImV4cCI6MjA4ODEzOTczN30.eQuudrN2VD4U6yltYVetHlHdrCiP6dXC41a4-ftpM2E';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
