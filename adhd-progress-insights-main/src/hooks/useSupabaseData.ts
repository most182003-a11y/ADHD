import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Child, Session } from '@/lib/data-utils';

export function useChildren() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchChildren() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('children')
          .select('*')
          .order('name');

        if (error) throw error;
        setChildren(data || []);
      } catch (e) {
        console.error('Error fetching children:', e);
        setError(e);
      } finally {
        setLoading(false);
      }
    }

    fetchChildren();

    // Set up real-time subscription
    const channel = supabase
      .channel('public:children')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'children' }, (payload) => {
        fetchChildren();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { children, loading, error };
}

export function useSessions(childId?: string) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchSessions() {
      try {
        setLoading(true);
        let query = supabase.from('sessions').select('*');
        
        if (childId) {
          query = query.eq('child_id', childId);
        }
        
        const { data, error } = await query.order('start_time', { ascending: false });

        if (error) throw error;
        
        // Map back to the Session interface if needed
        const mappedSessions: Session[] = (data || []).map(s => ({
          session_info: {
            child_id: s.child_id,
            session_id: s.session_id,
            start_time: s.start_time,
            duration_minutes: s.duration_minutes,
            therapist: s.therapist,
            game: s.game
          },
          summary: {
            total_trials: s.total_trials,
            success_rate: s.success_rate,
            impulsivity_index: s.impulsivity_index,
            motor_control_score: s.motor_control_score,
            distraction_score: s.distraction_score,
            avg_reaction_time: s.avg_reaction_time,
            max_consecutive_success: s.max_consecutive_success,
            false_moves: s.false_moves,
            false_stops: s.false_stops,
            red_phase_errors: s.red_phase_errors,
            green_phase_errors: s.green_phase_errors
          }
        }));
        
        setSessions(mappedSessions);
      } catch (e) {
        console.error('Error fetching sessions:', e);
        setError(e);
      } finally {
        setLoading(false);
      }
    }

    fetchSessions();

    const channel = supabase
      .channel('public:sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => {
        fetchSessions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [childId]);

  return { sessions, loading, error };
}
