CREATE TABLE public.preferences (
  user_id uuid PRIMARY KEY,
  display_name text,
  organizing text[] NOT NULL DEFAULT '{}',
  struggles text[] NOT NULL DEFAULT '{}',
  mode text NOT NULL DEFAULT 'cherry',
  rewards_enabled boolean NOT NULL DEFAULT true,
  onboarded boolean NOT NULL DEFAULT false,
  cherries integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'personal',
  deadline date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  notes text,
  area text NOT NULL DEFAULT 'personal',
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  due_date date,
  due_time time,
  is_pick boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'todo',
  recurrence text NOT NULL DEFAULT 'none',
  estimate_min integer,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.brain_dumps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  day date NOT NULL,
  energy text NOT NULL,
  UNIQUE (user_id, day)
);
CREATE TABLE public.focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  minutes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  item_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_key)
);
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['preferences','projects','tasks','brain_dumps','check_ins','focus_sessions','rewards'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "own rows" ON public.%I FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t);
  END LOOP;
END $$;
CREATE INDEX ON public.tasks (user_id, status);