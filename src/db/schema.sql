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
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'acknowledged', 'in_progress', 'resolved', 'closed'
  )),
  photo_urls TEXT[] DEFAULT '{}',
  video_urls TEXT[] DEFAULT '{}',
  municipality_response TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_civic_reports_status ON civic_reports(status);
CREATE INDEX idx_civic_reports_category ON civic_reports(category);
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
  encrypted_content TEXT NOT NULL,       -- E2E encrypted, server cannot read
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
GROUP BY category;

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
