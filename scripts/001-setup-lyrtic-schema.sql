-- Lyrtic Core Schema - Phase 1
-- Created: June 2026

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: users
-- Purpose: Individual user accounts with authentication credentials
-- ============================================================================
CREATE TABLE users (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(320)  NOT NULL UNIQUE,
  password_hash   VARCHAR(255)  NOT NULL,
  full_name       VARCHAR(255)  NOT NULL,
  avatar_url      TEXT,
  email_verified  BOOLEAN       NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ============================================================================
-- TABLE: organizations
-- Purpose: Business workspace - primary multi-tenancy boundary
-- ============================================================================
CREATE TABLE organizations (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255)  NOT NULL,
  slug            VARCHAR(100)  NOT NULL UNIQUE,
  logo_url        TEXT,
  plan            VARCHAR(50)   NOT NULL DEFAULT 'free',
  settings        JSONB         NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_organizations_slug ON organizations(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_created_at ON organizations(created_at DESC);

-- ============================================================================
-- TABLE: memberships
-- Purpose: Maps users to organizations with role-based access
-- ============================================================================
CREATE TABLE memberships (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID          NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role            VARCHAR(50)   NOT NULL DEFAULT 'member',
  invited_by      UUID          REFERENCES users(id),
  accepted_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),

  UNIQUE (user_id, organization_id)
);

CREATE INDEX idx_memberships_org ON memberships(organization_id);
CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_memberships_accepted ON memberships(accepted_at) WHERE accepted_at IS NOT NULL;

-- ============================================================================
-- TABLE: customers
-- Purpose: Core entity - individual customers within an organization
-- ============================================================================
CREATE TABLE customers (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID          NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email                 VARCHAR(320)  NOT NULL,
  full_name             VARCHAR(255),
  phone                 VARCHAR(50),
  location              VARCHAR(255),
  customer_id           VARCHAR(255),
  status                VARCHAR(50)   DEFAULT 'active',
  lifecycle_stage       VARCHAR(50)   DEFAULT 'lead',
  health_score          DECIMAL(5,2)  DEFAULT 50.0,
  churn_risk            VARCHAR(50)   DEFAULT 'low',
  last_interaction      TIMESTAMPTZ,
  notes                 TEXT,
  metadata              JSONB         DEFAULT '{}',
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
  deleted_at            TIMESTAMPTZ
);

CREATE INDEX idx_customers_org ON customers(organization_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_health_score ON customers(health_score DESC);
CREATE INDEX idx_customers_churn_risk ON customers(churn_risk);
CREATE INDEX idx_customers_status ON customers(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);

-- ============================================================================
-- TABLE: transactions
-- Purpose: Customer transaction history for behavior analysis
-- ============================================================================
CREATE TABLE transactions (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID          NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id       UUID          NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  transaction_id    VARCHAR(255)  NOT NULL,
  amount            DECIMAL(12,2) NOT NULL,
  currency          VARCHAR(3)    DEFAULT 'USD',
  transaction_date  TIMESTAMPTZ   NOT NULL,
  category          VARCHAR(100),
  description       TEXT,
  payment_method    VARCHAR(50),
  status            VARCHAR(50)   DEFAULT 'completed',
  metadata          JSONB         DEFAULT '{}',
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_org ON transactions(organization_id);
CREATE INDEX idx_transactions_customer ON transactions(customer_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX idx_transactions_amount ON transactions(amount DESC);
CREATE UNIQUE INDEX idx_transactions_unique ON transactions(organization_id, transaction_id);

-- ============================================================================
-- TABLE: events
-- Purpose: Customer behavioral events for engagement analysis
-- ============================================================================
CREATE TABLE events (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID          NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id       UUID          NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  event_type        VARCHAR(100)  NOT NULL,
  event_name        VARCHAR(255)  NOT NULL,
  event_date        TIMESTAMPTZ   NOT NULL,
  properties        JSONB         DEFAULT '{}',
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_org ON events(organization_id);
CREATE INDEX idx_events_customer ON events(customer_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_date ON events(event_date DESC);

-- ============================================================================
-- TABLE: segments
-- Purpose: Customer groupings based on rules or behaviors
-- ============================================================================
CREATE TABLE segments (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID          NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name              VARCHAR(255)  NOT NULL,
  description       TEXT,
  criteria          JSONB         NOT NULL,
  criteria_logic    VARCHAR(50)   DEFAULT 'AND',
  customer_count    INT           DEFAULT 0,
  status            VARCHAR(50)   DEFAULT 'active',
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX idx_segments_org ON segments(organization_id);
CREATE INDEX idx_segments_status ON segments(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_segments_created_at ON segments(created_at DESC);

-- ============================================================================
-- TABLE: segment_memberships
-- Purpose: Tracks which customers are in which segments
-- ============================================================================
CREATE TABLE segment_memberships (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id        UUID          NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  customer_id       UUID          NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  added_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),

  UNIQUE (segment_id, customer_id)
);

CREATE INDEX idx_segment_memberships_segment ON segment_memberships(segment_id);
CREATE INDEX idx_segment_memberships_customer ON segment_memberships(customer_id);

-- ============================================================================
-- TABLE: insights
-- Purpose: AI-generated customer insights and analysis reports
-- ============================================================================
CREATE TABLE insights (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID          NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id       UUID          REFERENCES customers(id) ON DELETE CASCADE,
  segment_id        UUID          REFERENCES segments(id) ON DELETE CASCADE,
  insight_type      VARCHAR(100)  NOT NULL,
  title             VARCHAR(500)  NOT NULL,
  content           TEXT          NOT NULL,
  summary           TEXT,
  confidence        DECIMAL(3,2)  DEFAULT 0.95,
  generated_by      VARCHAR(50)   DEFAULT 'claude',
  metadata          JSONB         DEFAULT '{}',
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_insights_org ON insights(organization_id);
CREATE INDEX idx_insights_customer ON insights(customer_id);
CREATE INDEX idx_insights_type ON insights(insight_type);
CREATE INDEX idx_insights_created_at ON insights(created_at DESC);

-- ============================================================================
-- TABLE: imports
-- Purpose: CSV import history and metadata
-- ============================================================================
CREATE TABLE imports (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID          NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by        UUID          NOT NULL REFERENCES users(id),
  file_name         VARCHAR(255)  NOT NULL,
  blob_url          TEXT          NOT NULL,
  status            VARCHAR(50)   NOT NULL DEFAULT 'pending',
  total_rows        INT,
  successful_rows   INT,
  failed_rows       INT,
  error_details     JSONB,
  field_mapping     JSONB         NOT NULL,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_imports_org ON imports(organization_id);
CREATE INDEX idx_imports_status ON imports(status);
CREATE INDEX idx_imports_created_at ON imports(created_at DESC);

-- ============================================================================
-- TABLE: sessions
-- Purpose: User authentication sessions
-- ============================================================================
CREATE TABLE sessions (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token             TEXT          NOT NULL UNIQUE,
  expires_at        TIMESTAMPTZ   NOT NULL,
  user_agent        TEXT,
  ip_address        INET,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- ============================================================================
-- Update Triggers for updated_at timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_segments_updated_at BEFORE UPDATE ON segments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insights_updated_at BEFORE UPDATE ON insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_imports_updated_at BEFORE UPDATE ON imports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
