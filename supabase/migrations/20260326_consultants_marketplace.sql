-- ============================================================
-- Consultants Marketplace Tables
-- ============================================================

-- 1. consultants — consultant profiles
CREATE TABLE IF NOT EXISTS consultants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  name            TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  hourly_rate     NUMERIC(10,2) NOT NULL,
  rating          NUMERIC(3,2) NOT NULL DEFAULT 0,
  review_count    INTEGER NOT NULL DEFAULT 0,
  session_count   INTEGER NOT NULL DEFAULT 0,
  country         TEXT,
  industry        TEXT,
  availability    TEXT NOT NULL DEFAULT 'available'
                  CHECK (availability IN ('available','busy','unavailable')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE consultants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON consultants USING (true);

CREATE TRIGGER set_consultants_updated_at
  BEFORE UPDATE ON consultants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. consultant_skills — skills grouped by section
CREATE TABLE IF NOT EXISTS consultant_skills (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id   UUID NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  section_title   TEXT NOT NULL,
  skill_name      TEXT NOT NULL,
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE consultant_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON consultant_skills USING (true);

CREATE INDEX idx_consultant_skills_consultant ON consultant_skills(consultant_id);

-- 3. service_packages — bookable service offerings
CREATE TABLE IF NOT EXISTS service_packages (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id        UUID NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  price                NUMERIC(10,2) NOT NULL,
  description          TEXT NOT NULL DEFAULT '',
  consultation_content TEXT NOT NULL DEFAULT '',
  duration_minutes     INTEGER NOT NULL,
  order_index          INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON service_packages USING (true);

CREATE INDEX idx_service_packages_consultant ON service_packages(consultant_id);

CREATE TRIGGER set_service_packages_updated_at
  BEFORE UPDATE ON service_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. consultant_availability — available day/time slots
CREATE TABLE IF NOT EXISTS consultant_availability (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id   UUID NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  is_booked       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE consultant_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON consultant_availability USING (true);

CREATE INDEX idx_consultant_availability_open ON consultant_availability(consultant_id, date)
  WHERE is_booked = false;

-- 5. bookings — core booking records
CREATE TABLE IF NOT EXISTS bookings (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            TEXT NOT NULL,
  consultant_id      UUID NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  service_package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('upcoming','pending','finished','cancelled')),
  booking_date       DATE NOT NULL,
  start_time         TIME NOT NULL,
  end_time           TIME NOT NULL,
  duration_minutes   INTEGER NOT NULL,
  cost               NUMERIC(10,2) NOT NULL,
  payment_status     TEXT NOT NULL DEFAULT 'unpaid'
                     CHECK (payment_status IN ('unpaid','paid','refunded')),
  user_comment       TEXT DEFAULT '',
  video_call_url     TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON bookings USING (true);

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_consultant ON bookings(consultant_id);
CREATE INDEX idx_bookings_user_status ON bookings(user_id, status);

CREATE TRIGGER set_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. consultant_reviews — client feedback
CREATE TABLE IF NOT EXISTS consultant_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id   UUID NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL,
  booking_id      UUID REFERENCES bookings(id) ON DELETE SET NULL,
  rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text            TEXT NOT NULL DEFAULT '',
  user_name       TEXT NOT NULL,
  user_country    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE consultant_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON consultant_reviews USING (true);

CREATE INDEX idx_consultant_reviews_consultant ON consultant_reviews(consultant_id);

-- 7. message_threads — one thread per client ↔ consultant pair
CREATE TABLE IF NOT EXISTS message_threads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  consultant_id   UUID NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, consultant_id)
);

ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON message_threads USING (true);

CREATE INDEX idx_message_threads_user ON message_threads(user_id);

-- 8. messages — individual chat messages
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id       UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_user_id  TEXT NOT NULL,
  text            TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON messages USING (true);

CREATE INDEX idx_messages_thread ON messages(thread_id, created_at);
