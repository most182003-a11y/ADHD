import cv2
import numpy as np
import pygame
import time
import random
import uuid
import sys
import os
from database import GameDatabase
from pose_engine import PoseEngine
from datetime import datetime

# Get the directory of the current script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ASSETS_DIR = os.path.join(SCRIPT_DIR, "assets")

# Initialize Pygame for sound
pygame.init()
pygame.mixer.init()

# Visual Constants
COLORS = {
    'background': (30, 30, 30),
    'text': (240, 240, 240),
    'success': (0, 255, 127),
    'warning': (255, 150, 0),
    'error': (255, 60, 60),
    'accent': (0, 191, 255),
    'button_idle': (60, 60, 60),
    'button_hover': (100, 100, 100),
    'button_active': (0, 191, 255),
    'overlay': (0, 0, 0, 160)
}

class Button:
    def __init__(self, x, y, w, h, text, callback_val=None, color=COLORS['button_idle'], hover_color=COLORS['button_hover']):
        self.rect = (x, y, w, h)
        self.text = text
        self.callback_val = callback_val
        self.color = color
        self.hover_color = hover_color
        self.is_hovered = False
        self.hover_start_time = 0
        self.click_ready = False

    def draw(self, frame, pose_hover=False):
        x, y, w, h = self.rect
        current_color = self.hover_color if (self.is_hovered or pose_hover) else self.color
        
        # Draw button with shadow/border
        cv2.rectangle(frame, (x, y), (x + w, y + h), current_color, -1)
        cv2.rectangle(frame, (x, y), (x + w, y + h), (200, 200, 200), 2)
        
        # Text centering
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.7
        thickness = 2
        text_size = cv2.getTextSize(self.text, font, font_scale, thickness)[0]
        text_x = x + (w - text_size[0]) // 2
        text_y = y + (h + text_size[1]) // 2
        cv2.putText(frame, self.text, (text_x, text_y), font, font_scale, COLORS['text'], thickness)
        
        # Draw hold progress bar if being hovered by pose
        if hasattr(self, 'pose_hover_active') and self.pose_hover_active:
            progress = min(1.0, (time.time() - self.hover_start_time) / 1.0)
            if progress > 0:
                cv2.rectangle(frame, (x, y + h - 5), (x + int(w * progress), y + h), COLORS['success'], -1)

    def check_interaction(self, mouse_pos, pose_pos=None):
        x, y, w, h = self.rect
        mx, my = mouse_pos
        
        # Mouse Hover
        self.is_hovered = (x <= mx <= x + w and y <= my <= y + h)
        
        # Pose Hover (landmark position)
        pose_interacted = False
        if pose_pos:
            px, py = pose_pos
            if x <= px <= x + w and y <= py <= y + h:
                pose_interacted = True
                if self.hover_start_time == 0:
                    self.hover_start_time = time.time()
                elif time.time() - self.hover_start_time > 1.0: # Hold for 1s to click
                    self.click_ready = True
            else:
                self.hover_start_time = 0
                self.click_ready = False
                self.pose_hover_active = False
        
        if pose_pos and x <= px <= x + w and y <= py <= y + h:
            self.pose_hover_active = True
        else:
            self.pose_hover_active = False
        
        return self.is_hovered or self.click_ready


EASY_MOVEMENTS = [
    "Raise Right Hand",
    "Raise Left Hand",
    "Hands on Hips",
    "Touch Knees",
    "Put Hand Above Head"
]

MEDIUM_MOVEMENTS = [
    "Raise Both Hands",
    "Cross Arms on Chest",
    "Arms Out to Sides",
    "Flex Muscles",
    "One Hand Up, One Hand on Hip"
]

HARD_MOVEMENTS = [
    "Archer Pose",
    "The Surfer",
    "Crouching Tiger",
    "Tree Pose",
    "Arms Forming a Circle"
]

MOVEMENTS = EASY_MOVEMENTS # Default

class MirrorMeGame:
    def __init__(self, child_id="CHILD001"):
        self.cap = cv2.VideoCapture(0)
        self.db = GameDatabase()
        self.engine = PoseEngine()
        self.child_id = child_id
        self.session_id = str(uuid.uuid4())[:8]
        self.game_start_timestamp = time.time()
        
        self.state = "CALIBRATION"
        self.round_number = 0
        self.total_rounds = 10
        self.score = 0
        self.mirror_video = True # Default to mirror mode
        
        self.mouse_pos = (0, 0)
        self.mouse_clicked = False
        self.buttons = []
        self.state_init = None
        # cv2.namedWindow("Mirror Me") # Handled by Tkinter
        # cv2.setMouseCallback("Mirror Me", self._mouse_callback)
        
        self.available_movements = EASY_MOVEMENTS
        self.current_movement = None
        self.start_time = 0
        self.hold_start_time = 0
        self.hold_duration_required = 2.0 # Default
        
        self.last_feedback = ""
        self.feedback_color = COLORS['text']
        self.feedback_timer = 0
        
        self.stats = [] # Store results for final summary
        
        # Difficulty Settings
        self.difficulties = {
            'EASY': {'timeout': 10.0, 'hold': 1.5, 'desc': 'Easy: Relaxed pace'},
            'MEDIUM': {'timeout': 7.0, 'hold': 2.5, 'desc': 'Medium: Standard challenge'},
            'HARD': {'timeout': 5.0, 'hold': 4.0, 'desc': 'Hard: Pro reflection'}
        }
        self.difficulty = 'MEDIUM' # Default
        
        self.total_reaction_time = 0
        
        self.reset_stats()
        self._load_current_ref_images()

    def reset_stats(self):
        """Resets statistics for a new game session."""
        self.state = "CALIBRATION"
        self.round_number = 0
        self.score = 0
        self.start_time = 0
        self.hold_start_time = 0
        self.last_feedback = ""
        self.feedback_timer = 0
        self.stats = []
        self.direction_errors_count = 0
        self.premature_moves_count = 0
        self.tracking_loss_total_time = 0
        self.consecutive_success = 0
        self.max_consecutive_success = 0
        self.hold_stability_data = [] 
        self.total_reaction_time = 0
        self.body_scale_factors = [] # To normalize movement by distance
        self.session_saved = False
        self.state_init = None
        self.current_movement = None

        
        # Load reference images
        self.ref_images = {}
        self.img_mapping = {
            "Raise Right Hand": os.path.join(ASSETS_DIR, "raise_right_hand.png"),
            "Raise Left Hand": os.path.join(ASSETS_DIR, "raise_left_hand.png"),
            "Hands on Hips": os.path.join(ASSETS_DIR, "nano_banana_hands_on_hips.png"),
            "Touch Knees": os.path.join(ASSETS_DIR, "touch_knees.png"),
            "Put Hand Above Head": os.path.join(ASSETS_DIR, "hand_above_head.png"),
            "Raise Both Hands": os.path.join(ASSETS_DIR, "raise_both_hands.png"),
            "Cross Arms on Chest": os.path.join(ASSETS_DIR, "cross_arms.png"),
            "Arms Out to Sides": os.path.join(ASSETS_DIR, "arms_out.png"),
            "Flex Muscles": os.path.join(ASSETS_DIR, "flex_muscles.png"),
            "One Hand Up, One Hand on Hip": os.path.join(ASSETS_DIR, "one_up_one_hip.png"),
            "Archer Pose": os.path.join(ASSETS_DIR, "archer.png"),
            "The Surfer": os.path.join(ASSETS_DIR, "surfer.png"),
            "The Flamingo": os.path.join(ASSETS_DIR, "flamingo.png"),
            "Crouching Tiger": os.path.join(ASSETS_DIR, "tiger.png"),
            "Tree Pose": os.path.join(ASSETS_DIR, "tree_pose.png"),
            "Arms Forming a Circle": os.path.join(ASSETS_DIR, "circle_arms.png")
        }
        self._load_current_ref_images()

    def _load_current_ref_images(self):
        """Loads reference images for the current movement set."""
        self.ref_images = {}
        for move in self.available_movements:
            path = self.img_mapping.get(move)
            if path:
                img = cv2.imread(path)
                if img is not None:
                    self.ref_images[move] = cv2.resize(img, (200, 200))

    def update(self):
        """Single update step, returns the frame to display."""
        ret, frame = self.cap.read()
        if not ret: return None
        
        if self.mirror_video:
            frame = cv2.flip(frame, 1)
        h, w, _ = frame.shape
        
        smoothed_lms, raw_lms = self.engine.process_frame(frame, mirrored=self.mirror_video)
        
        if self.state == "CALIBRATION":
            self._handle_calibration(frame, smoothed_lms)
        elif self.state == "DIFFICULTY":
            self._handle_difficulty_selection(frame, smoothed_lms)
        elif self.state == "HOLD_SELECTION":
            self._handle_hold_selection(frame, smoothed_lms)
        elif self.state == "INSTRUCTION":
            self._handle_instruction()
        elif self.state == "TRACKING":
            self._handle_tracking(smoothed_lms)
        elif self.state == "FEEDBACK":
            self._handle_feedback()
        elif self.state == "SUMMARY":
            self._handle_summary(frame, smoothed_lms)
            return frame # Show summary frame

        # Reset click for next frame
        self.mouse_clicked = False

        # Drawing
        self._draw_ui(frame, raw_lms)
        return frame

    def restart(self):
        """Restarts the game stats."""
        self.reset_stats()
        self.game_start_timestamp = time.time()
        self.session_id = str(uuid.uuid4())[:8]

    def release(self):
        """Releases the camera."""
        if self.cap.isOpened():
            self.cap.release()

    def cleanup(self):
        """Standard cleanup method."""
        self.release()

    def _mouse_callback(self, event, x, y, flags, param):
        self.mouse_pos = (x, y)
        if event == cv2.EVENT_LBUTTONDOWN:
            self.mouse_clicked = True

    def _handle_calibration(self, frame, landmarks):
        if self.start_time == 0:
            self.start_time = time.time()
        
        elapsed = time.time() - self.start_time
        if elapsed < 3.0:
            self.last_feedback = f"Calibration: Stand still... {int(3 - elapsed)}"
            self.feedback_color = COLORS['warning']
        else:
            self.state = "DIFFICULTY"
            self.start_time = 0

    def _handle_difficulty_selection(self, frame, landmarks):
        h, w, _ = frame.shape
        # Create buttons if they don't exist for this state
        if not self.buttons or self.state_init != "DIFFICULTY":
            btn_w, btn_h = 200, 50
            start_y = h // 4 + 100
            self.buttons = [
                Button(w//2 - btn_w//2, start_y, btn_w, btn_h, "EASY", "EASY"),
                Button(w//2 - btn_w//2, start_y + 70, btn_w, btn_h, "MEDIUM", "MEDIUM"),
                Button(w//2 - btn_w//2, start_y + 140, btn_w, btn_h, "HARD", "HARD")
            ]
            self.state_init = "DIFFICULTY"

        # Overlay menu background
        overlay = frame.copy()
        cv2.rectangle(overlay, (w//4, h//4), (3*w//4, 3*h//4 + 50), (20,20,20), -1)
        cv2.addWeighted(frame, 0.4, overlay, 0.6, 0, frame)
        
        cv2.putText(frame, "SELECT DIFFICULTY", (w//2 - 150, h//4 + 50), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, COLORS['accent'], 3)

        # Pose interaction point (using index finger or nose)
        pose_pt = None
        if landmarks:
            # Using Index Finger Tip (19 or 20)
            target = landmarks[19] if self.mirror_video else landmarks[20]
            if target[3] > 0.5:
                pose_pt = (int(target[0] * w), int(target[1] * h))
                cv2.circle(frame, pose_pt, 10, COLORS['accent'], -1)

        for btn in self.buttons:
            interacted = btn.check_interaction(self.mouse_pos, pose_pt)
            btn.draw(frame, pose_hover=interacted)
            
            if (self.mouse_clicked and btn.is_hovered) or btn.click_ready:
                self.difficulty = btn.callback_val
                self.available_movements = {
                    'EASY': EASY_MOVEMENTS,
                    'MEDIUM': MEDIUM_MOVEMENTS,
                    'HARD': HARD_MOVEMENTS
                }[self.difficulty]
                self.hold_duration_required = self.difficulties[self.difficulty]['hold']
                self.state = "HOLD_SELECTION"
                self.buttons = [] # Clear for next state
                self.last_feedback = f"Level Set: {self.difficulty}"
                self.feedback_color = COLORS['success']
                break

    def _handle_hold_selection(self, frame, landmarks):
        h, w, _ = frame.shape
        if not self.buttons or self.state_init != "HOLD_SELECTION":
            btn_w, btn_h = 60, 50
            start_y = h // 4 + 150
            self.buttons = [
                Button(w//2 - 100, start_y, btn_w, btn_h, "-", "DEC"),
                Button(w//2 + 40, start_y, btn_w, btn_h, "+", "INC"),
                Button(w//2 - 100, start_y + 80, 200, 50, "START GAME", "START")
            ]
            self.state_init = "HOLD_SELECTION"

        overlay = frame.copy()
        cv2.rectangle(overlay, (w//4, h//4), (3*w//4, 3*h//4 + 100), (20,20,20), -1)
        cv2.addWeighted(frame, 0.4, overlay, 0.6, 0, frame)
        
        cv2.putText(frame, "ADJUST HOLD TIME", (w//2 - 150, h//4 + 50), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, COLORS['warning'], 3)
        
        cv2.putText(frame, f"{self.hold_duration_required:.1f}s", (w//2 - 30, h//4 + 130), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1.2, COLORS['success'], 3)

        pose_pt = None
        if landmarks:
            target = landmarks[19] if self.mirror_video else landmarks[20]
            if target[3] > 0.5:
                pose_pt = (int(target[0] * w), int(target[1] * h))
                cv2.circle(frame, pose_pt, 10, COLORS['accent'], -1)

        for btn in self.buttons:
            interacted = btn.check_interaction(self.mouse_pos, pose_pt)
            btn.draw(frame, pose_hover=interacted)
            
            if (self.mouse_clicked and btn.is_hovered) or btn.click_ready:
                if btn.callback_val == "DEC":
                    self.hold_duration_required = max(0.5, self.hold_duration_required - 0.5)
                elif btn.callback_val == "INC":
                    self.hold_duration_required = min(10.0, self.hold_duration_required + 0.5)
                elif btn.callback_val == "START":
                    self.state = "INSTRUCTION"
                    self._load_current_ref_images()
                    self.last_feedback = f"Hold Time: {self.hold_duration_required}s"
                    self.feedback_color = COLORS['success']
                    self.start_time = time.time()
                    self.buttons = []
                    break


    def _handle_instruction(self):
        if self.current_movement is None:
            self.current_movement = random.choice(self.available_movements)
            self.start_time = time.time()
            self.last_feedback = f"Get Ready: {self.current_movement}"
            self.feedback_color = COLORS['text']
            self.already_doing_pose = False # Reset for this round
            
        # Impulsivity Check: Is the user already in the pose before the tracking starts?
        # We'll check this once near the end of the instruction phase
        instruction_elapsed = time.time() - self.start_time
        if 1.5 < instruction_elapsed < 2.0 and not self.already_doing_pose:
            # Check if they are already doing the pose (passing a "virtual" mirrored state)
            # We briefly peek at the engine's last landmarks
            last_lms = self.engine.history[-1] if self.engine.history else None
            correct, _ = self.engine.get_movement_check(self.current_movement, last_lms, mirrored=self.mirror_video)
            if correct:
                self.already_doing_pose = True
                self.premature_moves_count += 1

        if instruction_elapsed > 2.0:
            self.state = "TRACKING"
            self.start_time = time.time() # Start timer for reaction
            self.current_round_positions = [] # To track stability for Motor Control


    def _handle_tracking(self, landmarks):
        elapsed = time.time() - self.start_time
        timeout = self.difficulties[self.difficulty]['timeout']
        
        if elapsed > timeout + 2.0: # 2s instruction + difficulty-based timeout
            self._save_round_data(False, elapsed, False, 0)
            self.state = "FEEDBACK"
            return

        correct, dir_err = self.engine.get_movement_check(self.current_movement, landmarks, mirrored=self.mirror_video)
        
        # Tracking Distraction (Tracking loss)
        if landmarks is None:
            self.tracking_loss_total_time += 1.0/30.0 # Approximate frame time if no timestamps
        
        if correct:
            if self.hold_start_time == 0:
                self.hold_start_time = time.time()
            hold_elapsed = time.time() - self.hold_start_time
            
            # Motor Control: Save landmark positions during hold to check stability later
            if landmarks:
                # Use wrist positions (15, 16) as proxies for stability
                lp = [landmarks[15][:2], landmarks[16][:2]]
                self.current_round_positions.append(lp)
                
                # Track body scale (shoulder width) to normalize stability
                s_dist = np.linalg.norm(landmarks[11][:2] - landmarks[12][:2])
                if s_dist > 0.05:
                    self.body_scale_factors.append(s_dist)
            
            self.last_feedback = f"Holding... {hold_elapsed:.1f}/{self.hold_duration_required:.1f}s"
            self.feedback_color = COLORS['success']
            
            if hold_elapsed >= self.hold_duration_required:
                self.score += 1
                # Calculate stability for this round normalized by body scale
                current_stability = 0
                if self.current_round_positions:
                    # Mean variance of wrists
                    raw_var = float(np.var(self.current_round_positions, axis=0).mean())
                    avg_scale = np.mean(self.body_scale_factors) if self.body_scale_factors else 0.2
                    # Normalize: variance is squared, so we divide by scale squared
                    current_stability = raw_var / (avg_scale ** 2)
                    self.hold_stability_data.append(current_stability)
                
                self._save_round_data(True, elapsed, dir_err, hold_elapsed, current_stability)
                self.state = "FEEDBACK"

        else:
            self.hold_start_time = 0
            if dir_err:
                self.direction_errors_count += 1
                self.last_feedback = "Wrong Side! Use your other hand."
                self.feedback_color = COLORS['error']
            else:
                self.last_feedback = "Follow the instruction!"
                self.feedback_color = COLORS['text']


    def _handle_feedback(self):
        if self.feedback_timer == 0:
            self.feedback_timer = time.time()
        
        if time.time() - self.feedback_timer > 2.0:
            self.round_number += 1
            if self.round_number >= self.total_rounds:
                self.state = "SUMMARY"
            else:
                self.state = "INSTRUCTION"
                self.current_movement = None
                self.hold_start_time = 0
                self.feedback_timer = 0

    def _save_round_data(self, correct, reaction, dir_err, hold, stability=0):
        is_premature = 1 if (correct and self.already_doing_pose) else 0
        self.db.save_round(
            self.session_id, 
            self.child_id,
            "Mirror Me",
            self.current_movement, 
            round(reaction, 2), 
            1 if correct else 0, 
            round(hold, 2), 
            1 if dir_err else 0,
            stability=round(stability, 6),
            is_premature=is_premature
        )
        self.stats.append({
            'num': self.round_number + 1,
            'move': self.current_movement,
            'correct': correct,
            'reaction': reaction,
            'dir_err': dir_err,
            'stability': stability,
            'is_premature': is_premature
        })

        
        if correct:
            self.consecutive_success += 1
            self.max_consecutive_success = max(self.max_consecutive_success, self.consecutive_success)
        else:
            self.consecutive_success = 0


    def _draw_ui(self, frame, raw_lms):
        h, w, _ = frame.shape
        
        # Header
        cv2.rectangle(frame, (0,0), (w, 60), (0,0,0), -1)
        header_text = f"Level: {self.difficulty} | Round: {self.round_number+1}/{self.total_rounds} | Score: {self.score}"
        cv2.putText(frame, header_text, 
                    (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, COLORS['text'], 2)
        
        # Feedback area
        cv2.putText(frame, self.last_feedback, (10, h - 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, self.feedback_color, 3)
        
        # Reference Image Overlay
        if self.state in ["INSTRUCTION", "TRACKING"] and self.current_movement in self.ref_images:
            ref_img = self.ref_images[self.current_movement]
            ref_h, ref_w, _ = ref_img.shape
            # Place in top right corner
            margin = 10
            x_offset = w - ref_w - margin
            y_offset = 70 # Below header
            
            # Create a background for the reference image
            cv2.rectangle(frame, (x_offset - 5, y_offset - 5), (w - margin + 5, y_offset + ref_h + 5), (255, 255, 255), -1)
            frame[y_offset:y_offset+ref_h, x_offset:x_offset+ref_w] = ref_img
            
            # Label
            cv2.putText(frame, "TRY THIS:", (x_offset, y_offset - 15), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)

        # Skeleton
        if raw_lms:
            self.engine.draw_landmarks(frame, raw_lms)

    def _handle_summary(self, frame, landmarks):
        h, w, _ = frame.shape
        cv2.rectangle(frame, (50, 40), (w-50, h-40), (20,20,20), -1)
        cv2.rectangle(frame, (50, 40), (w-50, h-40), COLORS['accent'], 2)
        
        cv2.putText(frame, "GAME OVER - PERFORMANCE SUMMARY", (w//2 - 250, 80), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, COLORS['success'], 3)

        # Calculate metrics
        success_rate = (self.score / self.total_rounds) * 100 if self.total_rounds > 0 else 0
        
        # Stability: avg_var is now normalized by body scale. 
        # A variance of 0.01 relative to body size is very high.
        avg_normalized_var = np.mean(self.hold_stability_data) if self.hold_stability_data else 0.05
        motor_control = max(0, min(100, 100 - (avg_normalized_var * 500))) # Adjusted multiplier for normalized var
        
        # Impulsivity: percentage of rounds with premature or direction errors
        error_rounds = len([s for s in self.stats if s['dir_err'] or s['is_premature']])
        impulsivity = (error_rounds / self.total_rounds * 100) if self.total_rounds > 0 else 0
        impulsivity_label = "Low" if impulsivity < 15 else "Moderate" if impulsivity < 40 else "High"
        
        total_possible_time = self.total_rounds * self.difficulties[self.difficulty]['timeout']
        distraction_pct = (self.tracking_loss_total_time / total_possible_time) * 100 if total_possible_time > 0 else 0
        distraction_score = min(100, distraction_pct * 5)
        avg_react = np.mean([s['reaction'] for s in self.stats]) if self.stats else 0
        total_trials = self.round_number

        # Save to Database (Once)
        if not self.session_saved:
            session_summary = {
                "child_id": self.child_id,
                "session_id": self.session_id,
                "game_name": "Mirror Me",
                "start_time": datetime.fromtimestamp(self.game_start_timestamp).isoformat(),
                "duration_minutes": round((time.time() - self.game_start_timestamp) / 60, 2),
                "total_trials": self.total_rounds,
                "success_rate": round(success_rate, 2),
                "impulsivity_index": round(float(impulsivity), 2),
                "motor_control_score": round(motor_control, 2),
                "distraction_score": round(distraction_score, 2),
                "avg_reaction_time": round(avg_react, 2),
                "max_consecutive_success": self.max_consecutive_success,
                "false_moves": self.direction_errors_count + self.premature_moves_count,
                "false_stops": self.total_rounds - self.score,
                "red_phase_errors": self.direction_errors_count + self.premature_moves_count,
                "green_phase_errors": self.total_rounds - self.score
            }
            self.db.save_session(session_summary)
            self.session_saved = True

        metrics = [
            (f"Success Rate: {success_rate:.1f}%", COLORS['text']),
            (f"Motor Control Score: {motor_control:.1f}/100", COLORS['accent']),
            (f"Impulsivity Index: {impulsivity_label} ({impulsivity:.1f}%)", COLORS['warning']),
            (f"Distraction Score: {distraction_score:.1f}/100", COLORS['error']),
            (f"Avg Reaction Time: {avg_react:.2f}s", COLORS['text']),
            (f"Total Trials: {total_trials}", COLORS['text']),
            (f"Max Consecutive Success: {self.max_consecutive_success}", COLORS['success'])
        ]


        start_y = 140
        for i, (text, color) in enumerate(metrics):
            cv2.putText(frame, text, (100, start_y + i*45), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        
        cv2.putText(frame, "Click 'Back to Menu' above", (w//2 - 150, h - 80), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, COLORS['warning'], 2)


if __name__ == "__main__":
    game = MirrorMeGame()
    game.run()
