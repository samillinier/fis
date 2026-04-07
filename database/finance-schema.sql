-- Finance Hub Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_id TEXT,
  ref_number TEXT,
  customer TEXT,
  txn_date DATE,
  due_date DATE,
  ship_date DATE,
  ship_method_name TEXT,
  tracking_num TEXT,
  sales_term TEXT,
  location TEXT,
  class TEXT,
  bill_addr_line1 TEXT,
  bill_addr_line2 TEXT,
  bill_addr_line3 TEXT,
  bill_addr_line4 TEXT,
  bill_addr_city TEXT,
  bill_addr_state TEXT,
  bill_addr_postal_code TEXT,
  bill_addr_country TEXT,
  ship_addr_line1 TEXT,
  ship_addr_line2 TEXT,
  ship_addr_line3 TEXT,
  ship_addr_line4 TEXT,
  ship_addr_city TEXT,
  ship_addr_state TEXT,
  ship_addr_postal_code TEXT,
  ship_addr_country TEXT,
  private_note TEXT,
  msg TEXT,
  bill_email TEXT,
  currency TEXT,
  exchange_rate NUMERIC(10, 4),
  tax_rate TEXT,
  tax_amt NUMERIC(15, 2),
  discount_taxable BOOLEAN,
  deposit NUMERIC(15, 2),
  to_be_printed BOOLEAN,
  to_be_emailed BOOLEAN,
  allow_ipn_payment BOOLEAN,
  allow_online_credit_card_payment BOOLEAN,
  allow_online_ach_payment BOOLEAN,
  ship_amt NUMERIC(15, 2),
  ship_item TEXT,
  discount_amt NUMERIC(15, 2),
  discount_rate NUMERIC(10, 4),
  line_service_date DATE,
  line_item TEXT,
  line_desc TEXT,
  line_qty NUMERIC(10, 2),
  line_unit_price NUMERIC(15, 2),
  line_amount NUMERIC(15, 2),
  line_class TEXT,
  line_taxable TEXT,
  client TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bills table
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bill_id TEXT,
  ref_number TEXT,
  ap_account TEXT,
  vendor TEXT,
  print_on_check_name TEXT,
  txn_date DATE,
  due_date DATE,
  sales_term TEXT,
  location TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  address_line3 TEXT,
  address_line4 TEXT,
  address_city TEXT,
  address_state TEXT,
  address_postal_code TEXT,
  address_country TEXT,
  private_note TEXT,
  currency TEXT,
  exchange_rate NUMERIC(10, 4),
  expense_account TEXT,
  expense_desc TEXT,
  expense_amount NUMERIC(15, 2),
  expense_billable_status TEXT,
  expense_billable_entity TEXT,
  expense_class TEXT,
  line_item TEXT,
  line_desc TEXT,
  line_qty NUMERIC(10, 2),
  line_unit_price NUMERIC(15, 2),
  line_amount NUMERIC(15, 2),
  line_billable_status TEXT,
  line_billable_entity TEXT,
  line_class TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_txn_date ON invoices(txn_date);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer);
CREATE INDEX IF NOT EXISTS idx_invoices_location ON invoices(location);
CREATE INDEX IF NOT EXISTS idx_invoices_file_name ON invoices(file_name);

CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_txn_date ON bills(txn_date);
CREATE INDEX IF NOT EXISTS idx_bills_vendor ON bills(vendor);
CREATE INDEX IF NOT EXISTS idx_bills_location ON bills(location);
CREATE INDEX IF NOT EXISTS idx_bills_file_name ON bills(file_name);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (service role full access)
DROP POLICY IF EXISTS "Service role full access invoices" ON invoices;
CREATE POLICY "Service role full access invoices" ON invoices
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access bills" ON bills;
CREATE POLICY "Service role full access bills" ON bills
  FOR ALL USING (true) WITH CHECK (true);
