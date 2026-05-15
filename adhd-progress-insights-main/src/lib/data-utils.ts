export interface SessionSummary {
  total_trials: number;
  success_rate: number;
  impulsivity_index: number;
  motor_control_score: number;
  distraction_score: number;
  avg_reaction_time: number;
  max_consecutive_success: number;
  false_moves?: number;
  false_stops?: number;
  red_phase_errors?: number;
  green_phase_errors?: number;
}

export interface Session {
  session_info: {
    child_id: string;
    session_id: string;
    start_time: string;
    duration_minutes: number;
    therapist: string;
    game: string;
  };
  summary: SessionSummary;
}

export interface Child {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female";
  diagnosis_severity: "mild" | "moderate" | "severe";
  registered_date: string;
  therapist: string;
  status: "improving" | "stable" | "needs_intervention";
  avatar_initials: string;
}

export const targets = {
  impulsivity_index: 10,
  motor_control_score: 85,
  distraction_score: 10,
  avg_reaction_time: 0.35,
  success_rate: 90,
};

export const generateRecommendations = (sessions: Session[]): string[] => {
  if (sessions.length === 0) return ["No session data available to generate recommendations."];
  const last = sessions[sessions.length - 1].summary;
  const recs: string[] = [];
  if (last.motor_control_score < 70) recs.push("Motor control below target — intensify balance & stillness training exercises");
  if (last.impulsivity_index > 18) recs.push("High impulsivity index — increase sudden-stop exercises and delay-of-gratification tasks");
  if (last.distraction_score > 20) recs.push("Elevated distraction score — reduce environmental stimuli during sessions");
  if (last.avg_reaction_time > 0.55) recs.push("Slow reaction time — introduce rhythm-based response activities");
  if ((last.false_moves ?? 0) > 4) recs.push("Excessive false moves in red phase — reinforce inhibition cues with visual feedback");
  if (last.success_rate > 85) recs.push("Strong success rate — consider advancing to next difficulty level");
  if (recs.length === 0) recs.push("Performance within target range — maintain current training protocol");
  return recs;
};
