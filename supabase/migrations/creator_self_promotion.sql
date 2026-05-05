-- Migration: allow self-service promotion from 'user' to 'creator'
--
-- Context: the original prevent_role_escalation trigger blocked ALL role changes
-- by authenticated users. This was correct when role was admin-only territory.
-- We now add a single permitted exception: a user may promote their own profile
-- from 'user' to 'creator'. Everything else remains blocked.
--
-- Permitted after this migration:
--   user     → creator   (own row, authenticated)   ✅ self-service creator activation
--   service_role → any  (no JWT)                    ✅ admin/webhook operations
--
-- Still blocked:
--   user     → admin    (own or other row)           ❌
--   creator  → admin    (own or other row)           ❌
--   creator  → user     (downgrade via client)       ❌
--   any role → other    (third-party row update)     ❌
--
-- The trigger itself does not change — only the function body is replaced.
-- Run in: Supabase Dashboard → SQL Editor

CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF auth.uid() IS NOT NULL THEN
      -- Single permitted exception: a user self-promoting their own profile
      -- from 'user' to 'creator'. The RLS UPDATE policy already guarantees
      -- auth.uid() = NEW.id for any client-initiated change, but we check
      -- explicitly here as defence-in-depth.
      IF auth.uid() = NEW.id AND OLD.role = 'user' AND NEW.role = 'creator' THEN
        RAISE NOTICE '[security] user % self-promoted to creator', auth.uid();
        -- Fall through to RETURN NEW — change is allowed.
      ELSE
        RAISE EXCEPTION
          'ROLE_CHANGE_FORBIDDEN: role change requires service_role. '
          'user=% attempted to change "%" to "%" on profile %',
          auth.uid(), OLD.role, NEW.role, NEW.id;
      END IF;
    ELSE
      -- auth.uid() IS NULL → service_role key (bypasses JWT) → always permitted.
      RAISE NOTICE '[security] role changed "%" → "%" via service_role on profile %',
        OLD.role, NEW.role, NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Verify the trigger still points to the updated function
SELECT tgname, tgrelid::regclass, proname
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'trg_prevent_role_escalation';
