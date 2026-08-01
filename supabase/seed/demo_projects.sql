-- =============================================================================
-- demo_projects.sql
--
-- OPTIONAL DEMO DATA. Not a migration — nothing in the application depends on
-- it, and it is not recorded in schema_migrations.
--
-- It exists so the project screens have something to render during
-- development. Run it if you want populated screens; skip it and the screens
-- show their empty states, which is the correct behaviour for a new tenant.
--
-- Attaches to whichever organisation the first ADMIN profile belongs to. If
-- that admin has no organisation, one is created for them, because a project
-- must belong to an organisation.
--
-- SAFE TO RE-RUN. Existing rows are matched by slug and left alone.
-- To remove everything this created:
--     delete from public.projects where slug in ('site-rebuild','commerce-replatform');
-- =============================================================================

do $$
declare
  v_admin uuid;
  v_org   uuid;
  p1      uuid;
  p2      uuid;
begin
  select id, organization_id into v_admin, v_org
    from public.profiles where portal = 'ADMIN' and is_active
    order by created_at limit 1;

  if v_admin is null then
    raise notice 'No active ADMIN profile — nothing seeded.';
    return;
  end if;

  if v_org is null then
    insert into public.organizations (name, slug, industry, tier)
    values ('Northwind Retail', 'northwind-retail', 'E-commerce', 'Premium')
    on conflict (lower(name)) do nothing;
    select id into v_org from public.organizations where slug = 'northwind-retail';
    update public.profiles set organization_id = v_org where id = v_admin;
  end if;

  insert into public.projects
    (organization_id, slug, name, description, status, stage, lead_id,
     start_date, target_end, budget_total, budget_spent, tone, icon, featured)
  values
    (v_org, 'site-rebuild', 'Site Rebuild',
     'Full replatform of the storefront onto the edge runtime, with a new design system and a headless CMS.',
     'Active', 'Build', v_admin, '2026-03-02', '2026-09-30', 180000, 122400, 'brand', 'store', true),
    (v_org, 'commerce-replatform', 'Commerce Replatform',
     'Migration of checkout and fulfilment onto the new order pipeline.',
     'On Hold', 'Discovery', v_admin, '2026-05-11', '2027-01-15', 95000, 18500, 'ion', 'chart', false)
  on conflict (organization_id, slug) do nothing;

  select id into p1 from public.projects where organization_id = v_org and slug = 'site-rebuild';
  select id into p2 from public.projects where organization_id = v_org and slug = 'commerce-replatform';

  -- 3 done + 1 active at 40% across 5 => project_progress reports 68%.
  if not exists (select 1 from public.project_milestones where project_id = p1) then
    insert into public.project_milestones
      (project_id, phase, title, description, status, due_date, progress, lead_id, display_order)
    values
      (p1,'Phase 1','Discovery & Audit','Analytics review, tech audit and content inventory.','done','2026-03-28',null,v_admin,1),
      (p1,'Phase 2','Design System','Tokens, primitives and the component library.','done','2026-05-02',null,v_admin,2),
      (p1,'Phase 3','Foundations','Routing, rendering strategy and the CMS schema.','done','2026-06-20',null,v_admin,3),
      (p1,'Phase 4','API Integration Layer','Catalogue, pricing and inventory services.','active','2026-08-15',40,v_admin,4),
      (p1,'Phase 5','Launch & Handover','Cutover, monitoring and team enablement.','final','2026-09-30',null,v_admin,5);
  end if;

  if not exists (select 1 from public.project_milestones where project_id = p2) then
    insert into public.project_milestones
      (project_id, phase, title, description, status, due_date, progress, lead_id, display_order)
    values
      (p2,'Phase 1','Requirements','Order pipeline mapping and gap analysis.','active','2026-06-30',25,v_admin,1),
      (p2,'Phase 2','Checkout Rebuild','New checkout on the shared payment service.','upcoming','2026-10-01',null,v_admin,2);
  end if;

  if not exists (select 1 from public.project_tasks where project_id = p1) then
    insert into public.project_tasks
      (project_id, column_id, title, description, discipline, assignee_id, awaiting_approval, priority, display_order)
    values
      (p1,'backlog','Catalogue sync contract','Agree the payload shape with the ERP team.','DEV',v_admin,false,false,1),
      (p1,'backlog','Search relevance tuning','Baseline the current ranking before changes.','RESEARCH',v_admin,false,false,2),
      (p1,'in-progress','Pricing service adapter','Wire regional pricing into the edge cache.','DEV',v_admin,false,true,1),
      (p1,'in-progress','Inventory webhooks','Near-real-time stock updates.','DEV',v_admin,false,false,2),
      (p1,'review','Homepage hero copy','Final wording for the launch hero.','CONTENT',v_admin,true,false,1),
      (p1,'review','Checkout accessibility pass','Keyboard and screen reader audit.','QA',v_admin,true,false,2),
      (p1,'done','Design tokens','OKLCH palette and spacing scale.','DESIGN',v_admin,false,false,1),
      (p1,'done','CMS schema','Content models and editorial workflow.','DEV',v_admin,false,false,2);
  end if;

  raise notice 'Seeded 2 projects, 7 milestones and 8 tasks for organisation %.', v_org;
end $$;

select p.slug, p.name, p.status, pp.progress || '%' as progress,
       (select count(*) from public.project_tasks t where t.project_id = p.id) as tasks
  from public.projects p
  join public.project_progress pp on pp.project_id = p.id
 order by p.name;
