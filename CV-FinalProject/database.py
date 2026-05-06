import os
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

class GameDatabase:
    def __init__(self):
        # Supabase setup
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY")
        
        self.use_supabase = False
        if url and key:
            try:
                self.supabase: Client = create_client(url, key)
                self.use_supabase = True
                print("Supabase connected successfully.")
            except Exception as e:
                print(f"Failed to connect to Supabase: {e}")

    def validate_child_id(self, child_id):
        """Validates the child ID by querying the 'children' table."""
        if not self.use_supabase:
            return True 
        try:
            # Check both 'id' and 'child_id' columns to be safe
            response = self.supabase.table("children").select("*").eq("id", child_id).execute()
            if not response.data:
                 response = self.supabase.table("children").select("*").eq("child_id", child_id).execute()
            return len(response.data) > 0
        except Exception as e:
            print(f"Validation failed: {e}")
            return False

    def save_round(self, *args, **kwargs):
        """
        Skipping round-by-round saves for now as the React dashboard 
        only tracks overall sessions, and the 'game_results' table is missing.
        """
        pass

    def save_session(self, summary_data):
        """
        Saves the overall session summary to the 'sessions' table,
        matching the schema and types expected by the React dashboard.
        """
        if self.use_supabase:
            try:
                # Ensure correct data types (PostgreSQL is strict about INT vs FLOAT)
                payload = {
                    "child_id": summary_data.get("child_id"),
                    "session_id": str(summary_data.get("session_id")),
                    "start_time": summary_data.get("start_time", datetime.now().isoformat()),
                    # Convert duration to INT to fix Supabase error 22P02
                    "duration_minutes": int(max(1, round(float(summary_data.get("duration_minutes", 0))))),
                    "therapist": summary_data.get("therapist", "AI Assistant"),
                    "game": summary_data.get("game_name"),
                    "total_trials": int(summary_data.get("total_trials", 0)),
                    "success_rate": float(summary_data.get("success_rate", 0)),
                    "impulsivity_index": float(summary_data.get("impulsivity_index", 0)),
                    "motor_control_score": float(summary_data.get("motor_control_score", 0)),
                    "distraction_score": float(summary_data.get("distraction_score", 0)),
                    "avg_reaction_time": float(summary_data.get("avg_reaction_time", 0)),
                    "max_consecutive_success": int(summary_data.get("max_consecutive_success", 0)),
                    "false_moves": int(summary_data.get("false_moves", 0)),
                    "false_stops": int(summary_data.get("false_stops", 0)),
                    "red_phase_errors": int(summary_data.get("red_phase_errors", 0)),
                    "green_phase_errors": int(summary_data.get("green_phase_errors", 0))
                }
                
                self.supabase.table("sessions").insert(payload).execute()
                print("✅ Session summary saved successfully to 'sessions' table.")
            except Exception as e:
                print(f"❌ Supabase session save failed: {e}")
        else:
            print("Session summary (Local):", summary_data)
