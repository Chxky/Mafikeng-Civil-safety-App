-- Mahikeng Civic Safety Database Schema
-- Designed for Supabase (PostgreSQL) with Row Level Security

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================
-- USERS (Pseudonymous - no personal data required)
-- ============================================================
CREATE TABLE user_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT UNIQUE NOT NULL,              -- Random anonymous token generated on device
  display_name TEXT DEFAULT 'Community Member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  is_moderator BOOLEAN DEFAULT FALSE,
  is_patrol_member BOOLEAN DEFAULT FALSE,
  emergency_contacts JSONB DEFAULT '[]'::jsonb  -- Encrypted locally, server stores hash only
);

-- ============================================================
-- CIVIC INFRASTRUCTURE REPORTS
-- ============================================================
CREATE TABLE civic_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_token_id UUID REFERENCES user_tokens(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN (
    'pothole', 'water_leak', 'sewage', 'streetlight',
    'electricity', 'illegal_dumping', 'housing', 'other'
  )),
  title TEXT NOT NULL,
  description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'critical')),
  department TEXT DEFAULT 'community' CHECK (department IN (
    'roads', 'water', 'sanitation', 'electricity',
    'waste', 'housing', 'community'
  )),
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'acknowledged', 'in_progress', 'resolved', 'closed'
  )),
  photo_urls TEXT[] DEFAULT '{}',
  video_urls TEXT[] DEFAULT '{}',
  municipality_response TEXT,
  -- Power outage specific fields
  outage_type TEXT CHECK (outage_type IN ('scheduled', 'unscheduled', 'unknown')),
  estimated_restoration TIMESTAMPTZ,
  is_business_alert BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_civic_reports_status ON civic_reports(status);
CREATE INDEX idx_civic_reports_category ON civic_reports(category);
CREATE INDEX idx_civic_reports_department ON civic_reports(department);
CREATE INDEX idx_civic_reports_location ON civic_reports USING GIST (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);
CREATE INDEX idx_civic_reports_created ON civic_reports(created_at DESC);

-- ============================================================
-- SAFETY INCIDENTS (Community Feed)
-- ============================================================
CREATE TABLE safety_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_token_id UUID REFERENCES user_tokens(id) ON DELETE SET NULL,
  incident_type TEXT NOT NULL CHECK (incident_type IN (
    'suspicious_activity', 'theft', 'vandalism', 'assault',
    'break_in', 'car_theft', 'drug_activity', 'noise', 'other'
  )),
  description TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  is_anonymous BOOLEAN DEFAULT TRUE,
  confirmations INT DEFAULT 0,
  flags INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_removed BOOLEAN DEFAULT FALSE,
  removed_by UUID REFERENCES user_tokens(id),
  removal_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_safety_incidents_type ON safety_incidents(incident_type);
CREATE INDEX idx_safety_incidents_location ON safety_incidents USING GIST (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);
CREATE INDEX idx_safety_incidents_created ON safety_incidents(created_at DESC);

-- ============================================================
-- INCIDENT CONFIRMATIONS (Voting)
-- ============================================================
CREATE TABLE incident_confirmations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID REFERENCES safety_incidents(id) ON DELETE CASCADE,
  user_token_id UUID REFERENCES user_tokens(id) ON DELETE CASCADE,
  confirmation_type TEXT NOT NULL CHECK (confirmation_type IN ('confirm', 'flag')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(incident_id, user_token_id)
);

-- ============================================================
-- SOS ALERTS
-- ============================================================
CREATE TABLE sos_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_token_id UUID REFERENCES user_tokens(id) ON DELETE SET NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  alert_type TEXT DEFAULT 'panic' CHECK (alert_type IN ('panic', 'medical', 'fire', 'crime')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'responding', 'resolved', 'false_alarm')),
  contacts_notified INT DEFAULT 0,
  audio_recording_url TEXT,
  video_recording_url TEXT,
  response_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sos_alerts_status ON sos_alerts(status);
CREATE INDEX idx_sos_alerts_created ON sos_alerts(created_at DESC);

-- ============================================================
-- PATROL GROUPS
-- ============================================================
CREATE TABLE patrol_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  created_by UUID REFERENCES user_tokens(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE patrol_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES patrol_groups(id) ON DELETE CASCADE,
  user_token_id UUID REFERENCES user_tokens(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_token_id)
);

CREATE TABLE patrol_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES patrol_groups(id) ON DELETE CASCADE,
  started_by UUID REFERENCES user_tokens(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE patrol_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES patrol_sessions(id) ON DELETE CASCADE,
  user_token_id UUID REFERENCES user_tokens(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PATROL CHAT (Encrypted messages)
-- ============================================================
CREATE TABLE patrol_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES patrol_groups(id) ON DELETE CASCADE,
  user_token_id UUID REFERENCES user_tokens(id) ON DELETE SET NULL,
  display_name TEXT DEFAULT 'Patroller',
  message TEXT NOT NULL,
  encrypted_content TEXT,                -- Optional E2E encrypted copy
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'location', 'alert')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_patrol_messages_group ON patrol_messages(group_id, created_at DESC);

-- ============================================================
-- MUNICIPALITY RESPONSE SCORECARD (Materialized View)
-- ============================================================
CREATE MATERIALIZED VIEW municipality_scorecard AS
SELECT
  category,
  department,
  COUNT(*) AS total_reports,
  COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_count,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
  COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_count,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'resolved')::NUMERIC /
    NULLIF(COUNT(*), 0) * 100, 1
  ) AS resolution_rate,
  AVG(
    EXTRACT(EPOCH FROM (resolved_at - created_at)) / 86400
  ) FILTER (WHERE status = 'resolved') AS avg_resolution_days
FROM civic_reports
GROUP BY category, department;

-- ============================================================
-- DEPARTMENT NOTIFICATIONS
-- ============================================================
CREATE TABLE department_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES civic_reports(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  notification_type TEXT DEFAULT 'new_report' CHECK (notification_type IN (
    'new_report', 'status_change', 'escalation', 'reminder'
  )),
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dept_notifications_dept ON department_notifications(department, is_read, created_at DESC);

-- ============================================================
-- BUSINESS PROFILES (Power Module)
-- ============================================================
CREATE TABLE business_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_token_id UUID REFERENCES user_tokens(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL CHECK (business_type IN (
    'restaurant', 'fresh_produce', 'guesthouse', 'clothing', 'other'
  )),
  phone TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  alert_radius_km DOUBLE PRECISION DEFAULT 2,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_business_profiles_location ON business_profiles USING GIST (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);
CREATE INDEX idx_business_profiles_user ON business_profiles(user_token_id);

ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own business profile" ON business_profiles
  FOR ALL USING (user_token_id IN (
    SELECT id FROM user_tokens WHERE token = current_setting('app.user_token', true)
  ));

-- ============================================================
-- OUTAGE CONFIRMATIONS (Power Module)
-- ============================================================
CREATE TABLE outage_confirmations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES civic_reports(id) ON DELETE CASCADE,
  user_token_id UUID REFERENCES user_tokens(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_id, user_token_id)
);

CREATE INDEX idx_outage_confirmations_report ON outage_confirmations(report_id);

ALTER TABLE outage_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can confirm outages" ON outage_confirmations
  FOR INSERT WITH CHECK (user_token_id IN (
    SELECT id FROM user_tokens WHERE token = current_setting('app.user_token', true)
  ));

CREATE POLICY "Public can read outage confirmations" ON outage_confirmations
  FOR SELECT USING (true);

-- ============================================================
-- BUSINESS ALERTS LOG (Power Module)
-- ============================================================
CREATE TABLE business_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  report_id UUID REFERENCES civic_reports(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  outage_type TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_business_alerts_business ON business_alerts(business_id, sent_at DESC);

-- ============================================================
-- PostGIS function for finding nearby businesses
-- ============================================================
CREATE OR REPLACE FUNCTION find_nearby_businesses(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION DEFAULT 2000
)
RETURNS SETOF business_profiles AS $$
  SELECT * FROM business_profiles
  WHERE is_active = true
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_meters
    );
$$ LANGUAGE SQL STABLE;

-- Refresh periodically
-- SELECT cron.schedule('refresh-scorecard', '*/15 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY municipality_scorecard');

-- ============================================================
-- USSD/SMS REPORTS
-- ============================================================
CREATE TABLE sms_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number_hash TEXT NOT NULL,       -- Hashed for privacy
  raw_message TEXT NOT NULL,
  parsed_category TEXT,
  parsed_description TEXT,
  parsed_latitude DOUBLE PRECISION,
  parsed_longitude DOUBLE PRECISION,
  civic_report_id UUID REFERENCES civic_reports(id),
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE civic_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrol_messages ENABLE ROW LEVEL SECURITY;

-- Users can read their own token
CREATE POLICY "Users can read own token" ON user_tokens
  FOR SELECT USING (token = current_setting('app.user_token', true));

-- Anyone can read civic reports (public dashboard)
CREATE POLICY "Anyone can read civic reports" ON civic_reports
  FOR SELECT USING (true);

-- Authenticated users can create reports
CREATE POLICY "Authenticated users can create reports" ON civic_reports
  FOR INSERT WITH CHECK (user_token_id IN (
    SELECT id FROM user_tokens WHERE token = current_setting('app.user_token', true)
  ));

-- Users can update their own reports
CREATE POLICY "Users can update own reports" ON civic_reports
  FOR UPDATE USING (user_token_id IN (
    SELECT id FROM user_tokens WHERE token = current_setting('app.user_token', true)
  ));

-- Moderators can update any report status
CREATE POLICY "Moderators can update reports" ON civic_reports
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_tokens WHERE token = current_setting('app.user_token', true) AND is_moderator = true)
  );

-- Anyone can read safety incidents
CREATE POLICY "Anyone can read safety incidents" ON safety_incidents
  FOR SELECT USING (is_removed = false);

-- Authenticated users can create incidents
CREATE POLICY "Authenticated users can create incidents" ON safety_incidents
  FOR INSERT WITH CHECK (user_token_id IN (
    SELECT id FROM user_tokens WHERE token = current_setting('app.user_token', true)
  ));

-- SOS alerts: users can create and read own
CREATE POLICY "Users can manage own SOS alerts" ON sos_alerts
  FOR ALL USING (user_token_id IN (
    SELECT id FROM user_tokens WHERE token = current_setting('app.user_token', true)
  ));

-- Patrol messages: only group members can read
CREATE POLICY "Group members can read patrol messages" ON patrol_messages
  FOR SELECT USING (group_id IN (
    SELECT group_id FROM patrol_members WHERE user_token_id IN (
      SELECT id FROM user_tokens WHERE token = current_setting('app.user_token', true)
    )
  ));

-- ============================================================
-- PUSH SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_token_id UUID REFERENCES user_tokens(id) ON DELETE CASCADE,
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_token_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push subscriptions" ON push_subscriptions
  FOR ALL USING (user_token_id IN (
    SELECT id FROM user_tokens WHERE token = current_setting('app.user_token', true)
  ));

-- ============================================================
-- EDUTRANS: SCHOOL TRANSPORT TRACKING
-- ============================================================
CREATE TABLE transport_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  school TEXT NOT NULL,
  vehicle_registration TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  scheduled_pickup_times JSONB DEFAULT '[]',
  scheduled_dropoff_times JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE learners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_user_token UUID REFERENCES user_tokens(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  school TEXT NOT NULL,
  grade TEXT,
  route_id UUID REFERENCES transport_routes(id) ON DELETE SET NULL,
  vehicle_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_learners_parent ON learners(parent_user_token);
CREATE INDEX idx_learners_route ON learners(route_id);

CREATE TABLE trip_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES transport_routes(id) ON DELETE CASCADE,
  driver_user_token UUID REFERENCES user_tokens(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'delayed', 'arrived', 'cancelled')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  locations JSONB DEFAULT '[]'
);

CREATE INDEX idx_trip_sessions_route ON trip_sessions(route_id);
CREATE INDEX idx_trip_sessions_status ON trip_sessions(status);

CREATE TABLE vehicle_permits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_registration TEXT UNIQUE NOT NULL,
  permit_status TEXT DEFAULT 'unknown' CHECK (permit_status IN ('valid', 'expired', 'unknown')),
  roadworthy_status TEXT DEFAULT 'unknown' CHECK (roadworthy_status IN ('valid', 'expired', 'unknown')),
  driver_prdp_status TEXT DEFAULT 'unknown' CHECK (driver_prdp_status IN ('valid', 'expired', 'unknown')),
  last_checked_date TIMESTAMPTZ
);

CREATE TABLE stranded_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES transport_routes(id) ON DELETE SET NULL,
  parent_user_token UUID REFERENCES user_tokens(id) ON DELETE SET NULL,
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ============================================================
-- DISASTER SHIELD: EARLY WARNING & RESILIENCE
-- ============================================================
CREATE TABLE weather_warnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'flooding', 'damaging_winds', 'fire_danger', 'severe_thunderstorm',
    'extreme_heat', 'heavy_rain', 'other'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('advisory', 'watch', 'warning')),
  description TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  expiry_time TIMESTAMPTZ NOT NULL,
  affected_areas TEXT,
  recommended_actions TEXT,
  source TEXT DEFAULT 'SAWS',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE disaster_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disaster_type TEXT NOT NULL CHECK (disaster_type IN (
    'flood', 'veld_fire', 'storm_damage', 'structural_collapse', 'other'
  )),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  description TEXT,
  photos TEXT[] DEFAULT '{}',
  urgency_level TEXT DEFAULT 'damage_only' CHECK (urgency_level IN (
    'immediate_threat', 'damage_only', 'information'
  )),
  needs_evacuation BOOLEAN DEFAULT FALSE,
  user_token UUID REFERENCES user_tokens(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'assessed', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_disaster_reports_type ON disaster_reports(disaster_type);
CREATE INDEX idx_disaster_reports_status ON disaster_reports(status);
CREATE INDEX idx_disaster_reports_location ON disaster_reports USING GIST (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);

CREATE TABLE user_safety_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disaster_id UUID REFERENCES disaster_reports(id) ON DELETE CASCADE,
  user_token UUID REFERENCES user_tokens(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('safe', 'need_help')),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(disaster_id, user_token)
);

CREATE TABLE volunteers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_token UUID REFERENCES user_tokens(id) ON DELETE CASCADE,
  skills TEXT[] DEFAULT '{}',
  location TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  contact_preference TEXT DEFAULT 'push',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE volunteer_deployments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  disaster_id UUID REFERENCES disaster_reports(id) ON DELETE CASCADE,
  volunteer_id UUID REFERENCES volunteers(id) ON DELETE CASCADE,
  assigned_area TEXT,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'deployed', 'completed')),
  deployed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE resilience_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'flood_safety', 'fire_safety', 'evacuation', 'first_aid', 'emergency_kit', 'other'
  )),
  description TEXT,
  file_url TEXT,
  is_offline_available BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE firebreak_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_token UUID REFERENCES user_tokens(id) ON DELETE SET NULL,
  land_location TEXT NOT NULL,
  firebreak_status TEXT DEFAULT 'unknown' CHECK (firebreak_status IN ('maintained', 'needs_attention', 'not_started', 'unknown')),
  reported_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE municipal_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_type TEXT DEFAULT 'general' CHECK (alert_type IN ('general', 'disaster', 'infrastructure', 'safety')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  is_active BOOLEAN DEFAULT TRUE,
  issued_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE learners ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stranded_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE disaster_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_safety_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can manage own learners" ON learners
  FOR ALL USING (parent_user_token IN (
    SELECT id FROM user_tokens WHERE token = current_setting('app.user_token', true)
  ));

CREATE POLICY "Public can read transport routes" ON transport_routes FOR SELECT USING (true);
CREATE POLICY "Public can read vehicle permits" ON vehicle_permits FOR SELECT USING (true);
CREATE POLICY "Public can read disaster reports" ON disaster_reports FOR SELECT USING (true);
CREATE POLICY "Public can read weather warnings" ON weather_warnings FOR SELECT USING (true);
CREATE POLICY "Public can read resilience resources" ON resilience_resources FOR SELECT USING (true);
CREATE POLICY "Public can read municipal alerts" ON municipal_alerts FOR SELECT USING (true);
