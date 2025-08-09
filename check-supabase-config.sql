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
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
   AND routine_name LIKE '%user%' 
   OR routine_name LIKE '%profile%';

-- Proveri da li postoji tabela profiles
SELECT 
    table_name,
    table_schema,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
   AND table_name = 'profiles';

-- Proveri RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';
