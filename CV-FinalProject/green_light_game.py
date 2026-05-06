import cv2
import time
import pygame
import threading
import uuid
import numpy as np
from database import GameDatabase
from collections import deque
from datetime import datetime

class GreenLightGame:
    def __init__(self, child_id="CHILD001"):
        self.cap = cv2.VideoCapture(0)
        self.db = GameDatabase()
        self.child_id = child_id
        self.session_id = str(uuid.uuid4())[:8]
        self.start_time = time.time()
        
        # Audio
        pygame.mixer.init()
        try:
            self.green_sound = pygame.mixer.Sound("Green_light.mp3")
            self.red_sound = pygame.mixer.Sound("Red_Light.mp3")
        except:
            self.green_sound = None
            self.red_sound = None

        # Motion Detection
        self.threshold = 50
        self.previous_frame = None
        
        # UI/Interaction
        self.mouse_pos = (0, 0)
        self.mouse_clicked = False
        self.button_rect = (0, 0, 0, 0)
        
        self.reset_stats()
        self._play_sound(self.green_sound)

    def reset_stats(self):
        """Initializes or resets game statistics and state."""
        self.start_time = time.time()
        self.current_phase = "GREEN"
        self.last_phase_change = time.time()
        self.round_number = 0
        self.state = "PLAYING"
        
        # ADHD Performance Metrics
        self.trials = []
        self.reaction_times = []
        self.freeze_durations = []
        self.false_moves = 0
        self.false_stops = 0
        self.consecutive_success = 0
        self.max_consecutive_success = 0
        self.motion_detected_in_phase = False
        self.freeze_start = None

    def _play_sound(self, sound):
        if sound:
            threading.Thread(target=sound.play, daemon=True).start()

    def update(self):
        ret, frame = self.cap.read()
        if not ret: return None
        frame = cv2.flip(frame, 1)
        h, w, _ = frame.shape
        
        if self.state == "SUMMARY":
            self._draw_summary(frame)
            return frame

        # Motion Detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (21, 21), 0)
        
        motion_detected = False
        motion_magnitude = 0
        if self.previous_frame is not None:
            frame_diff = cv2.absdiff(self.previous_frame, gray)
            # Use a threshold for noise
            _, thresh_frame = cv2.threshold(frame_diff, 25, 255, cv2.THRESH_BINARY)
            motion_magnitude = np.mean(thresh_frame)
            # Only count as motion if it's above a noise floor (0.5% of pixels changed)
            if motion_magnitude > 0.5: 
                motion_detected = True
        
        self.previous_frame = gray
        
        # Update Button Rect based on frame size
        bw, bh = 200, 80
        bx, by = w - bw - 20, h - bh - 20
        self.button_rect = (bx, by, bw, bh)

        # Win Button Check
        mx, my = self.mouse_pos
        if self.mouse_clicked:
            if bx <= mx <= bx + bw and by <= my <= by + bh:
                self._end_session()
                return frame

        # Phase Management
        now = time.time()
        phase_duration = self.green_duration if self.current_phase == "GREEN" else self.red_duration
        
        if now - self.last_phase_change > phase_duration:
            self._record_phase_end()
            
            self.round_number += 1
            if self.round_number >= self.total_rounds:
                self._end_session()
            else:
                self.current_phase = "RED" if self.current_phase == "GREEN" else "GREEN"
                self.last_phase_change = now
                self.motion_detected_in_phase = False
                if self.current_phase == "RED":
                    self.freeze_start = now
                self._play_sound(self.green_sound if self.current_phase == "GREEN" else self.red_sound)

        # Interaction during phase
        if motion_detected and not self.motion_detected_in_phase:
            self.motion_detected_in_phase = True
            react_time = now - self.last_phase_change
            
            if self.current_phase == "RED":
                self.false_moves += 1
                self.consecutive_success = 0
                self._save_round_to_db(False, reaction=react_time)
            else:
                self.reaction_times.append(react_time)
                self.consecutive_success += 1
                if self.consecutive_success > self.max_consecutive_success:
                    self.max_consecutive_success = self.consecutive_success
                self._save_round_to_db(True, reaction=react_time)

        # Draw UI
        self._draw_ui(frame, motion_detected)
        self.mouse_clicked = False
        return frame

    def _record_phase_end(self):
        # If no motion was detected in Green, it's a false stop
        if self.current_phase == "GREEN" and not self.motion_detected_in_phase:
            self.false_stops += 1
            self.consecutive_success = 0
            self._save_round_to_db(False)
        # If no motion was detected in Red, it's a success
        elif self.current_phase == "RED" and not self.motion_detected_in_phase:
            self.consecutive_success += 1
            if self.consecutive_success > self.max_consecutive_success:
                self.max_consecutive_success = self.consecutive_success
            if self.freeze_start:
                self.freeze_durations.append(time.time() - self.freeze_start)
            self._save_round_to_db(True)

    def _save_round_to_db(self, success, reaction=0):
        self.db.save_round(
            self.session_id,
            self.child_id,
            "Red Light Green Light",
            self.current_phase,
            round(reaction, 2),
            1 if success else 0,
            0,
            1 if not success and self.current_phase == "RED" else 0
        )

    def _end_session(self):
        self.state = "SUMMARY"
        
        # Calculate Advanced ADHD Metrics
        total_red = len(self.freeze_durations) + self.false_moves
        impulsivity_index = (self.false_moves / total_red * 100) if total_red > 0 else 0
        
        avg_reaction = np.mean(self.reaction_times) if self.reaction_times else 0
        # Distraction is variability in reaction time
        distraction_score = min(100, np.std(self.reaction_times) * 50) if len(self.reaction_times) > 1 else 0
        
        # Motor Control Score based on stillness in Red
        avg_freeze = np.mean(self.freeze_durations) if self.freeze_durations else 0
        motor_control_score = (avg_freeze / self.red_duration * 100) if self.red_duration > 0 else 0
        
        success_rate = ((self.round_number - self.false_moves - self.false_stops) / self.round_number * 100) if self.round_number > 0 else 0
        
        summary = {
            "child_id": self.child_id,
            "session_id": self.session_id,
            "game_name": "Red Light Green Light",
            "start_time": datetime.fromtimestamp(self.start_time).isoformat(),
            "duration_minutes": round((time.time() - self.start_time) / 60, 2),
            "total_trials": self.total_rounds,
            "success_rate": round(success_rate, 2),
            "impulsivity_index": round(impulsivity_index, 2),
            "motor_control_score": round(motor_control_score, 2),
            "distraction_score": round(distraction_score, 2),
            "avg_reaction_time": round(avg_reaction, 2),
            "max_consecutive_success": self.max_consecutive_success,
            "false_moves": self.false_moves,
            "false_stops": self.false_stops,
            "red_phase_errors": self.false_moves,
            "green_phase_errors": self.false_stops
        }
        
        self.db.save_session(summary)

    def _draw_ui(self, frame, motion):
        h, w, _ = frame.shape
        color = (0, 255, 0) if self.current_phase == "GREEN" else (0, 0, 255)
        cv2.circle(frame, (100, 100), 50, color, -1)
        cv2.putText(frame, self.current_phase, (60, 110), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        
        cv2.putText(frame, f"Round: {self.round_number+1}/{self.total_rounds}", (w-250, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        cv2.putText(frame, f"Successes: {self.total_rounds - self.false_moves - self.false_stops}", (w-250, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        if motion:
            cv2.putText(frame, "MOTION DETECTED!", (w//2 - 150, h - 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 3)

        # Draw Win Button
        bx, by, bw, bh = self.button_rect
        cv2.rectangle(frame, (bx, by), (bx + bw, by + bh), (0, 0, 255), -1)
        cv2.putText(frame, "WIN BUTTON", (bx + 10, by + 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    def _draw_summary(self, frame):
        h, w, _ = frame.shape
        cv2.rectangle(frame, (w//4, h//4), (3*w//4, 3*h//4), (20,20,20), -1)
        cv2.putText(frame, "ADVENTURE COMPLETE!", (w//2 - 180, h//4 + 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 3)
        success_rate = round(((self.round_number - self.false_moves - self.false_stops) / self.round_number) * 100, 1) if self.round_number > 0 else 0
        cv2.putText(frame, f"Success Rate: {success_rate}%", (w//2 - 120, h//2), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        cv2.putText(frame, "Stats uploaded to your dashboard!", (w//2 - 180, h//2 + 50), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)
        cv2.putText(frame, "Press 'Back to Menu'", (w//2 - 120, h//2 + 120), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

    def restart(self):
        self.reset_stats()
        self._play_sound(self.green_sound)

    def release(self):
        """Releases the camera and cleanup resources."""
        if self.cap.isOpened():
            self.cap.release()

    def cleanup(self):
        """Alias for release to match common interface."""
        self.release()
