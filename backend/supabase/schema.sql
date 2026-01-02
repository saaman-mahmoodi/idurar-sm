-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CORE TABLES
-- =============================================

-- Admins table (replaces Admin model)
-- Note: Supabase Auth handles users, but we keep this for additional admin data
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  removed BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT false,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  surname TEXT,
  photo TEXT,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  removed BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  setting_category TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value JSONB,
  value_type TEXT DEFAULT 'String',
  is_private BOOLEAN DEFAULT false,
  is_core_setting BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(setting_category, setting_key)
);

-- Uploads table
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  removed BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  model_name TEXT,
  field_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN (
    'jpeg', 'jpg', 'png', 'gif', 'webp', 'doc', 'txt', 'csv',
    'docx', 'xls', 'xlsx', 'pdf', 'zip', 'rar', 'mp4', 'mov',
    'avi', 'mp3', 'm4a', 'webm'
  )),
  is_public BOOLEAN NOT NULL,
  user_id UUID NOT NULL REFERENCES admins(id),
  is_secure BOOLEAN NOT NULL,
  path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- APP TABLES
-- =============================================

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  removed BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  name TEXT NOT NULL,
  phone TEXT,
  country TEXT,
  address TEXT,
  email TEXT,
  created_by UUID REFERENCES admins(id),
  assigned UUID REFERENCES admins(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Modes table
CREATE TABLE payment_modes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  removed BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  ref TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Taxes table
CREATE TABLE taxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  removed BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  tax_name TEXT NOT NULL,
  tax_value NUMERIC NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotes table
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  removed BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES admins(id),
  converted BOOLEAN DEFAULT false,
  number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  content TEXT,
  date DATE NOT NULL,
  expired_date DATE NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id),
  items JSONB NOT NULL DEFAULT '[]',
  tax_rate NUMERIC DEFAULT 0,
  sub_total NUMERIC DEFAULT 0,
  tax_total NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NA',
  discount NUMERIC DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'sent', 'accepted', 'declined', 'cancelled', 'on hold')),
  approved BOOLEAN DEFAULT false,
  is_expired BOOLEAN DEFAULT false,
  pdf TEXT,
  files JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  removed BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES admins(id),
  number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  content TEXT,
  recurring TEXT CHECK (recurring IN ('daily', 'weekly', 'monthly', 'annually', 'quarter')),
  date DATE NOT NULL,
  expired_date DATE NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id),
  converted_from TEXT CHECK (converted_from IN ('quote', 'offer')),
  converted_quote_id UUID REFERENCES quotes(id),
  items JSONB NOT NULL DEFAULT '[]',
  tax_rate NUMERIC DEFAULT 0,
  sub_total NUMERIC DEFAULT 0,
  tax_total NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NA',
  credit NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'partially')),
  is_overdue BOOLEAN DEFAULT false,
  approved BOOLEAN DEFAULT false,
  notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'sent', 'refunded', 'cancelled', 'on hold')),
  pdf TEXT,
  files JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  removed BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES admins(id),
  number INTEGER NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NA',
  payment_mode_id UUID REFERENCES payment_modes(id),
  ref TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads table (with TTL functionality via pg_cron or application logic)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES admins(id),
  business_name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  website TEXT,
  place_id TEXT,
  rating NUMERIC CHECK (rating >= 0 AND rating <= 5),
  user_ratings_total INTEGER CHECK (user_ratings_total >= 0),
  business_types TEXT[] DEFAULT '{}',
  location JSONB,
  search_location TEXT NOT NULL,
  search_radius INTEGER NOT NULL CHECK (search_radius >= 1 AND search_radius <= 50000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- =============================================
-- INDEXES
-- =============================================

-- Admins indexes
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_auth_user_id ON admins(auth_user_id);
CREATE INDEX idx_admins_removed ON admins(removed) WHERE removed = false;

-- Clients indexes
CREATE INDEX idx_clients_removed ON clients(removed) WHERE removed = false;
CREATE INDEX idx_clients_created_by ON clients(created_by);
CREATE INDEX idx_clients_assigned ON clients(assigned);

-- Quotes indexes
CREATE INDEX idx_quotes_removed ON quotes(removed) WHERE removed = false;
CREATE INDEX idx_quotes_client_id ON quotes(client_id);
CREATE INDEX idx_quotes_created_by ON quotes(created_by);
CREATE INDEX idx_quotes_status ON quotes(status);

-- Invoices indexes
CREATE INDEX idx_invoices_removed ON invoices(removed) WHERE removed = false;
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_created_by ON invoices(created_by);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);

-- Payments indexes
CREATE INDEX idx_payments_removed ON payments(removed) WHERE removed = false;
CREATE INDEX idx_payments_client_id ON payments(client_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_created_by ON payments(created_by);

-- Leads indexes
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_expires_at ON leads(expires_at);
CREATE INDEX idx_leads_user_created ON leads(user_id, created_at DESC);

-- Settings indexes
CREATE INDEX idx_settings_category_key ON settings(setting_category, setting_key);

-- Uploads indexes
CREATE INDEX idx_uploads_user_id ON uploads(user_id);
CREATE INDEX idx_uploads_field_id ON uploads(field_id);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Admin policies (service role has full access)
CREATE POLICY "Service role has full access to admins" ON admins
  FOR ALL USING (true);

-- Settings policies
CREATE POLICY "Service role has full access to settings" ON settings
  FOR ALL USING (true);

-- Uploads policies
CREATE POLICY "Service role has full access to uploads" ON uploads
  FOR ALL USING (true);

-- Clients policies
CREATE POLICY "Service role has full access to clients" ON clients
  FOR ALL USING (true);

-- Payment modes policies
CREATE POLICY "Service role has full access to payment_modes" ON payment_modes
  FOR ALL USING (true);

-- Taxes policies
CREATE POLICY "Service role has full access to taxes" ON taxes
  FOR ALL USING (true);

-- Quotes policies
CREATE POLICY "Service role has full access to quotes" ON quotes
  FOR ALL USING (true);

-- Invoices policies
CREATE POLICY "Service role has full access to invoices" ON invoices
  FOR ALL USING (true);

-- Payments policies
CREATE POLICY "Service role has full access to payments" ON payments
  FOR ALL USING (true);

-- Leads policies
CREATE POLICY "Service role has full access to leads" ON leads
  FOR ALL USING (true);

-- =============================================
-- FUNCTIONS FOR TTL CLEANUP (Leads)
-- =============================================

-- Function to delete expired leads
CREATE OR REPLACE FUNCTION delete_expired_leads()
RETURNS void AS $$
BEGIN
  DELETE FROM leads WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Note: To enable automatic cleanup, you need to set up pg_cron:
-- SELECT cron.schedule('delete-expired-leads', '0 * * * *', 'SELECT delete_expired_leads();');
-- Or handle this in application logic
