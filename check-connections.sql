-- Proveri povezanost između tabela
-- Ova skripta će proveriti da li su sve tabele pravilno povezane

-- 1. Proveri da li postoje tabele
SELECT 
    table_name,
    table_schema,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
   AND table_name IN ('profiles', 'user_brain')
ORDER BY table_name;

-- 2. Proveri strukturu profiles tabele
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
   AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Proveri strukturu user_brain tabele
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
   AND table_name = 'user_brain'
ORDER BY ordinal_position;

-- 4. Proveri foreign key constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
   AND tc.table_schema = 'public'
   AND tc.table_name IN ('profiles', 'user_brain');

-- 5. Proveri RLS policies
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
WHERE tablename IN ('profiles', 'user_brain')
ORDER BY tablename, policyname;

-- 6. Proveri da li postoje podaci u tabelama
SELECT 
    'profiles' as table_name,
    COUNT(*) as row_count
FROM public.profiles
UNION ALL
SELECT 
    'user_brain' as table_name,
    COUNT(*) as row_count
FROM public.user_brain;

-- 7. Proveri povezanost između profiles i user_brain
SELECT 
    p.id as profile_id,
    p.email,
    p.full_name,
    ub.user_id as brain_user_id,
    ub.company_name,
    ub.industry,
    ub.goals,
    ub.website,
    ub.data
FROM public.profiles p
LEFT JOIN public.user_brain ub ON p.id = ub.user_id
ORDER BY p.created_at DESC
LIMIT 10;
