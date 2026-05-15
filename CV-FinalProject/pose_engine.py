import cv2
import mediapipe as mp
import numpy as np
from mediapipe.python.solutions import pose as mp_pose
from mediapipe.python.solutions import drawing_utils as mp_drawing

class PoseEngine:
    def __init__(self, smooth_factor=5):
        self.pose = mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            smooth_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.smooth_factor = smooth_factor
        self.history = []

    def process_frame(self, frame, mirrored=True):
        """Processes a frame and returns pose landmarks."""
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb_frame)
        
        if results.pose_landmarks:
            landmarks = self._extract_landmarks(results.pose_landmarks)
            smoothed_landmarks = self._apply_smoothing(landmarks)
            # Store mirroring state for check logic
            self.last_mirrored = mirrored
            return smoothed_landmarks, results.pose_landmarks
        return None, None

    def _extract_landmarks(self, pose_landmarks):
        """Converts MediaPipe landmarks to a dictionary of coordinates."""
        landmarks = {}
        for idx, landmark in enumerate(pose_landmarks.landmark):
            landmarks[idx] = np.array([landmark.x, landmark.y, landmark.z, landmark.visibility])
        return landmarks

    def _apply_smoothing(self, landmarks):
        """Applies a moving average filter to landmarks to reduce noise."""
        self.history.append(landmarks)
        if len(self.history) > self.smooth_factor:
            self.history.pop(0)
            
        smoothed = {}
        for idx in landmarks.keys():
            coords = np.mean([h[idx] for h in self.history], axis=0)
            smoothed[idx] = coords
        return smoothed

    @staticmethod
    def get_movement_check(movement_name, landmarks, mirrored=True):
        """Checks if a specific movement is currently being performed."""
        if not landmarks:
            return False, False # (correct, direction_error)

        # Referencing MP Pose Landmarks: 
        # Left: Wrist(15), Shoulder(11), Elbow(13), Knee(25), Hip(23)
        # Right: Wrist(16), Shoulder(12), Elbow(14), Knee(26), Hip(24)
        # Nose: 0
        
        if mirrored:
            # Swap left and right indices for mirrored logic
            # Left: Wrist(15), Shoulder(11), Elbow(13), Knee(25), Hip(23), Ear(7)
            # Right: Wrist(16), Shoulder(12), Elbow(14), Knee(26), Hip(24), Ear(8)
            l_wrist = landmarks[16]
            r_wrist = landmarks[15]
            l_shldr = landmarks[12]
            r_shldr = landmarks[11]
            l_elbow = landmarks[14]
            r_elbow = landmarks[13]
            l_knee = landmarks[26]
            r_knee = landmarks[25]
            l_hip = landmarks[24]
            r_hip = landmarks[23]
            l_ear = landmarks[8]
            r_ear = landmarks[7]
            l_ankle = landmarks[28]
            r_ankle = landmarks[27]
        else:
            l_wrist = landmarks[15]
            r_wrist = landmarks[16]
            l_shldr = landmarks[11]
            r_shldr = landmarks[12]
            l_elbow = landmarks[13]
            r_elbow = landmarks[14]
            l_knee = landmarks[25]
            r_knee = landmarks[26]
            l_hip = landmarks[23]
            r_hip = landmarks[24]
            l_ear = landmarks[7]
            r_ear = landmarks[8]
            l_ankle = landmarks[27]
            r_ankle = landmarks[28]
        
        nose = landmarks[0]
        thresh = 0.5
        
        def is_visible(idx_list):
            return all(landmarks[idx][3] >= thresh for idx in idx_list)

        if movement_name == "Raise Right Hand":
            if not is_visible([16, 12, 11, 15]): return False, False
            # Right hand above right shoulder, left hand below left shoulder
            correct = r_wrist[1] < r_shldr[1] - 0.1 and l_wrist[1] > l_shldr[1]
            dir_err = l_wrist[1] < l_shldr[1] - 0.1 and r_wrist[1] > r_shldr[1]
            return correct, dir_err

        elif movement_name == "Raise Left Hand":
            if not is_visible([15, 11, 12, 16]): return False, False
            correct = l_wrist[1] < l_shldr[1] - 0.1 and r_wrist[1] > r_shldr[1]
            dir_err = r_wrist[1] < r_shldr[1] - 0.1 and l_wrist[1] > l_shldr[1]
            return correct, dir_err

        elif movement_name == "Hands on Hips":
            if not is_visible([15, 23, 16, 24]): return False, False
            # Hands on Hips: Wrists close to hips (23, 24)
            dist_l = np.linalg.norm(l_wrist[:2] - l_hip[:2])
            dist_r = np.linalg.norm(r_wrist[:2] - r_hip[:2])
            # Check if wrists are near hips and significantly below shoulders
            correct = dist_l < 0.2 and dist_r < 0.2 and l_wrist[1] > l_shldr[1] + 0.1 and r_wrist[1] > r_shldr[1] + 0.1
            return correct, False

        elif movement_name == "Touch Knees":
            if not is_visible([15, 25, 16, 26]): return False, False
            # Wrists close to knees
            dist_l = np.linalg.norm(l_wrist[:2] - l_knee[:2])
            dist_r = np.linalg.norm(r_wrist[:2] - r_knee[:2])
            correct = dist_l < 0.15 and dist_r < 0.15
            return correct, False

        elif movement_name == "Put Hand Above Head":
            # Either hand above nose
            r_up = r_wrist[3] > thresh and r_wrist[1] < nose[1]
            l_up = l_wrist[3] > thresh and l_wrist[1] < nose[1]
            return r_up or l_up, False

        elif movement_name == "Raise Both Hands":
            if not is_visible([15, 11, 16, 12]): return False, False
            # Both hands above shoulders
            correct = r_wrist[1] < r_shldr[1] - 0.1 and l_wrist[1] < l_shldr[1] - 0.1
            return correct, False

        elif movement_name == "Cross Arms on Chest":
            if not is_visible([15, 12, 16, 11]): return False, False
            # Left wrist near right shoulder AND right wrist near left shoulder
            dist_l_r_shldr = np.linalg.norm(l_wrist[:2] - r_shldr[:2])
            dist_r_l_shldr = np.linalg.norm(r_wrist[:2] - l_shldr[:2])
            correct = dist_l_r_shldr < 0.2 and dist_r_l_shldr < 0.2
            return correct, False

        elif movement_name == "Arms Out to Sides":
            if not is_visible([15, 11, 16, 12]): return False, False
            # Wrists at shoulder level but far away horizontally
            same_level = abs(l_wrist[1] - l_shldr[1]) < 0.15 and abs(r_wrist[1] - r_shldr[1]) < 0.15
            far_out = abs(l_wrist[0] - l_shldr[0]) > 0.2 and abs(r_wrist[0] - r_shldr[0]) > 0.2
            correct = same_level and far_out
            return correct, False

        elif movement_name == "Flex Muscles":
            if not is_visible([15, 13, 11, 16, 14, 12]): return False, False
            # Both elbows out, wrists above elbows
            elbows_out = abs(l_shldr[1] - l_elbow[1]) < 0.1 and abs(r_shldr[1] - r_elbow[1]) < 0.1
            wrists_up = l_wrist[1] < l_elbow[1] - 0.1 and r_wrist[1] < r_elbow[1] - 0.1
            correct = elbows_out and wrists_up
            return correct, False

        elif movement_name == "One Hand Up, One Hand on Hip":
            r_up_l_hip = r_wrist[3] > thresh and r_wrist[1] < r_shldr[1] - 0.1 and \
                         l_wrist[3] > thresh and np.linalg.norm(l_wrist[:2] - l_hip[:2]) < 0.2
            l_up_r_hip = l_wrist[3] > thresh and l_wrist[1] < l_shldr[1] - 0.1 and \
                         r_wrist[3] > thresh and np.linalg.norm(r_wrist[:2] - r_hip[:2]) < 0.2
            return r_up_l_hip or l_up_r_hip, False

        elif movement_name == "Archer Pose":
            # Archer Right: Right arm forward, Left hand near Left ear
            archer_r = r_wrist[3] > thresh and r_wrist[0] < r_shldr[0] - 0.2 and \
                       l_wrist[3] > thresh and np.linalg.norm(l_wrist[:2] - l_ear[:2]) < 0.2
            # Archer Left: Left arm forward, Right hand near Right ear
            archer_l = l_wrist[3] > thresh and l_wrist[0] > l_shldr[0] + 0.2 and \
                       r_wrist[3] > thresh and np.linalg.norm(r_wrist[:2] - r_ear[:2]) < 0.2
            return archer_r or archer_l, False

        elif movement_name == "The Surfer":
            if not is_visible([27, 28, 15, 16, 11, 12, 0]): return False, False
            # Sideways wide stance, knees bent, arms out
            wide = abs(l_ankle[0] - r_ankle[0]) > 0.4
            crouching = nose[1] > min(l_shldr[1], r_shldr[1]) + 0.05
            arms_extended = abs(l_wrist[0] - r_wrist[0]) > 0.6
            return wide and crouching and arms_extended, False

        elif movement_name == "Crouching Tiger":
            if not is_visible([0, 11, 15, 16]): return False, False
            deep_crouch = nose[1] > l_shldr[1] + 0.1
            hands_forward = np.linalg.norm(l_wrist[:2] - nose[:2]) < 0.3 and np.linalg.norm(r_wrist[:2] - nose[:2]) < 0.3
            return deep_crouch and hands_forward, False

        elif movement_name == "Tree Pose":
            l_on_r = l_ankle[3] > thresh and r_knee[3] > thresh and np.linalg.norm(l_ankle[:2] - r_knee[:2]) < 0.15
            r_on_l = r_ankle[3] > thresh and l_knee[3] > thresh and np.linalg.norm(r_ankle[:2] - l_knee[:2]) < 0.15
            return l_on_r or r_on_l, False

        elif movement_name == "Arms Forming a Circle":
            if not is_visible([15, 16, 0]): return False, False
            above_head = r_wrist[1] < nose[1] - 0.1 and l_wrist[1] < nose[1] - 0.1
            hands_close = np.linalg.norm(l_wrist[:2] - r_wrist[:2]) < 0.15
            return above_head and hands_close, False

        return False, False

    def draw_landmarks(self, frame, pose_landmarks):
        """Draws the skeleton on the frame."""
        mp_drawing.draw_landmarks(
            frame, 
            pose_landmarks, 
            mp_pose.POSE_CONNECTIONS
        )
