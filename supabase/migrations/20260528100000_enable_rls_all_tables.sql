-- Enable Row Level Security on all public tables.
-- No policies for anon/authenticated — PostgREST Data API access is denied.
-- Service role (honey-shop server routes) bypasses RLS.

DO $$
DECLARE
  tbl text;
  pol record;
BEGIN
  FOR tbl IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl
    LOOP
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        pol.policyname,
        tbl
      );
    END LOOP;

    EXECUTE format(
      'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',
      tbl
    );
  END LOOP;
END $$;
