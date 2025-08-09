-- Proveri da li postoje trigger funkcije
SELECT 
    trigger_name,
    event_manipulation,
    event_object_schema,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
   OR event_object_table = 'profiles';

-- Proveri da li postoje funkcije
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
   AND routine_name LIKE '%user%' 
   OR routine_name LIKE '%profile%';
