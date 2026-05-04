create extension if not exists pgcrypto;

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  cache_key text unique not null,
  company text,
  industry text,
  location text,
  employees integer,
  revenue numeric,
  website text,
  owner text,
  email text,
  phone text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists lead_scores (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  cache_key text not null,
  overall_score integer not null,
  tier text not null,
  dimensions jsonb not null,
  acquisition_thesis text,
  key_risks jsonb not null default '[]'::jsonb,
  key_opportunities jsonb not null default '[]'::jsonb,
  recommended_action text,
  estimated_ev_range text,
  fit_tags jsonb not null default '[]'::jsonb,
  model text,
  cache_hit boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_leads_company on leads (company);
create index if not exists idx_leads_cache_key on leads (cache_key);
create index if not exists idx_lead_scores_overall on lead_scores (overall_score desc);
create index if not exists idx_lead_scores_cache_key on lead_scores (cache_key);
