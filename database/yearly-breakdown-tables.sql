-- Yearly Breakdown tables (Supabase)
-- Stores isolated yearly Visual + Survey datasets, partitioned by `year`.
-- Mirrors the existing shared-data model (user_id points to shared admin user).

-- Visual data (yearly)
create table if not exists public.yearly_visual_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  year integer not null,
  workroom_name text,
  store text,
  sales numeric,
  labor_po numeric,
  vendor_debit numeric,
  category text,
  cycle_time numeric,
  data_jsonb jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists yearly_visual_data_user_year_idx
  on public.yearly_visual_data(user_id, year);

-- Survey data (yearly)
create table if not exists public.yearly_survey_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  year integer not null,
  workroom_name text,
  store text,
  ltr_score numeric,
  craft_score numeric,
  prof_score numeric,
  survey_date text,
  survey_comment text,
  labor_category text,
  reliable_home_improvement_score numeric,
  time_taken_to_complete numeric,
  project_value_score numeric,
  installer_knowledge_score numeric,
  data_jsonb jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists yearly_survey_data_user_year_idx
  on public.yearly_survey_data(user_id, year);

-- Yearly metadata (raw arrays etc.)
create table if not exists public.yearly_dashboard_metadata (
  user_id uuid not null references public.users(id) on delete cascade,
  year integer not null,
  raw_column_l_values jsonb,
  raw_craft_values jsonb,
  raw_prof_values jsonb,
  raw_labor_categories jsonb,
  raw_company_values jsonb,
  raw_installer_names jsonb,
  excel_file_total_rows integer,
  updated_at timestamptz not null default now(),
  primary key (user_id, year)
);

-- Yearly file names (visual/survey filenames shown in UI)
create table if not exists public.yearly_user_metadata (
  user_id uuid not null references public.users(id) on delete cascade,
  year integer not null,
  visual_file_name text,
  survey_file_name text,
  updated_at timestamptz not null default now(),
  primary key (user_id, year)
);

