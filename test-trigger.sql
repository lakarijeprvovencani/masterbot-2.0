-- Proveri da li je trigger funkcija kreirana
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
   AND routine_name = 'handle_new_user';

-- Proveri da li je trigger kreiran
SELECT 
    trigger_name,
    event_manipulation,
    event_object_schema,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Proveri da li postoji tabela profiles
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
   AND table_name = 'profiles';
