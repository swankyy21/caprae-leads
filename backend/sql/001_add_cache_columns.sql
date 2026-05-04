create extension if not exists pgcrypto;

alter table leads
  add column if not exists cache_key text;

update leads
set cache_key = encode(digest(coalesce(website, email, company, id::text), 'sha256'), 'hex')
where cache_key is null;

alter table leads
  alter column cache_key set not null;

create unique index if not exists leads_cache_key_key on leads (cache_key);

alter table lead_scores
  add column if not exists cache_key text,
  add column if not exists cache_hit boolean not null default false;

update lead_scores
set cache_key = leads.cache_key
from leads
where lead_scores.lead_id = leads.id
  and lead_scores.cache_key is null;

alter table lead_scores
  alter column cache_key set not null;

create index if not exists idx_leads_cache_key on leads (cache_key);
create index if not exists idx_lead_scores_cache_key on lead_scores (cache_key);
