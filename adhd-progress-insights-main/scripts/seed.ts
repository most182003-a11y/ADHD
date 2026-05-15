import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { children, allSessions } from '../src/data/mockData';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
  console.log('Seeding children...');
  const { error: childrenError } = await supabase
    .from('children')
    .upsert(children.map(c => ({
      id: c.id,
      name: c.name,
      age: c.age,
      gender: c.gender,
      diagnosis_severity: c.diagnosis_severity,
      registered_date: c.registered_date,
      therapist: c.therapist,
      status: c.status,
      avatar_initials: c.avatar_initials
    })));

  if (childrenError) {
    console.error('Error seeding children:', childrenError);
    return;
  }

  console.log('Seeding sessions...');
  const { error: sessionsError } = await supabase
    .from('sessions')
    .upsert(allSessions.map(s => ({
      session_id: s.session_info.session_id,
      child_id: s.session_info.child_id,
      start_time: s.session_info.start_time,
      duration_minutes: s.session_info.duration_minutes,
      therapist: s.session_info.therapist,
      game: s.session_info.game,
      total_trials: s.summary.total_trials,
      success_rate: s.summary.success_rate,
      impulsivity_index: s.summary.impulsivity_index,
      motor_control_score: s.summary.motor_control_score,
      distraction_score: s.summary.distraction_score,
      avg_reaction_time: s.summary.avg_reaction_time,
      max_consecutive_success: s.summary.max_consecutive_success,
      false_moves: s.summary.false_moves,
      false_stops: s.summary.false_stops,
      red_phase_errors: s.summary.red_phase_errors,
      green_phase_errors: s.summary.green_phase_errors
    })));

  if (sessionsError) {
    console.error('Error seeding sessions:', sessionsError);
    return;
  }

  console.log('Seeding complete!');
}

seed();
