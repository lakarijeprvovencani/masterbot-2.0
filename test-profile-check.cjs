require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function checkProfile() {
  const userId = '101137e8-6254-4a6b-8308-26a71037c3cb'
  
  console.log('🔍 Proveravam profil za user ID:', userId)
  
  // Proveri profiles tabelu
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
    
  console.log('📊 Profile data:', profileData)
  console.log('❌ Profile error:', profileError)
  
  // Proveri user_brain tabelu
  console.log('\n🔍 Proveravam user_brain za user ID:', userId)
  
  const { data: brainData, error: brainError } = await supabase
    .from('user_brain')
    .select('*')
    .eq('user_id', userId)
    .single()
    
  console.log('🧠 Brain data:', brainData)
  console.log('❌ Brain error:', brainError)
  
  // Ako nema profile, kreiraj ga
  if (profileError && profileError.code === 'PGRST116') {
    console.log('\n🆕 Kreiram profile za korisnika...')
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: 'Nikola',
        onboarding_completed: true,
        industry: 'E-commerce'
      })
      .select()
      .single()
    
    console.log('✅ Novi profile:', newProfile)
    console.log('❌ Create error:', createError)
  }
  
  // Ako nema user_brain, kreiraj ga
  if (brainError && brainError.code === 'PGRST116') {
    console.log('\n🆕 Kreiram user_brain za korisnika...')
    const { data: newBrain, error: createBrainError } = await supabase
      .from('user_brain')
      .insert({
        user_id: userId,
        company_name: 'Tia Lorens',
        industry: 'E-commerce',
        goals: ['Povećanje prodaje'],
        website: 'https://tialorens.rs/',
        analysis: 'AI analiza završena za Tia Lorens'
      })
      .select()
      .single()
    
    console.log('✅ Novi user_brain:', newBrain)
    console.log('❌ Create brain error:', createBrainError)
  }
}

checkProfile().catch(console.error)
