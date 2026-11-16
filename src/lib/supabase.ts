import { createClient } from '@supabase/supabase-js'

const DEFAULT_URL = 'https://zxyiouqrrlwkuxxaeaju.supabase.co'
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4eWlvdXFycmx3a3V4eGFlYWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ2ODkzNjcsImV4cCI6MjExMDI2NTM2N30.d0DZflqF8iGePRvOTQNRpzTS61bJ4XIzvcoYhE9TYaA'

const url = import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY

export const supabase = createClient(url, anonKey)