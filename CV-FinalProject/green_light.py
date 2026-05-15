# Phoomiphat Kittisuphat 29/4/2023
# Modified version with comprehensive data extraction for ADHD training analysis

import cv2
import time
import pygame
import threading
import json
import csv
import os
from datetime import datetime
from collections import deque
import numpy as np

# تهيئة pygame للأصوات
pygame.mixer.init()

# تحميل ملفات الصوت
try:
    green_sound = pygame.mixer.Sound("Green_light.mp3")
    red_sound = pygame.mixer.Sound("Red_Light.mp3")
except:
    print("ملاحظة: ملفات الصوت غير موجودة، سيتم تشغيل البرنامج بدون صوت")
    green_sound = None
    red_sound = None


def play_sound(sound_file):
    """تشغيل الصوت في خيط منفصل"""
    if sound_file:
        threading.Thread(target=sound_file.play, daemon=True).start()


class MotionDetector:
    def __init__(self, threshold=50):
        self.threshold = threshold
        self.previous_frame = None
        self.start_time = None
        self.motion_history = deque(maxlen=100)  # حفظ تاريخ الحركة
        self.motion_magnitude_history = deque(maxlen=100)  # شدة الحركة
        
    def detect_motion(self, frame):
        # Convert frame to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (21, 21), 0)

        if self.previous_frame is None:
            self.previous_frame = gray
            self.start_time = time.time()
            return False, 0

        # Compute absolute difference
        frame_diff = cv2.absdiff(self.previous_frame, gray)
        
        # حساب مقدار الحركة (متوسط الفرق)
        motion_magnitude = np.mean(frame_diff)
        self.motion_magnitude_history.append(motion_magnitude)
        
        thresholded = cv2.threshold(frame_diff, self.threshold, 255, cv2.THRESH_BINARY)[1]
        thresholded = cv2.dilate(thresholded, None, iterations=2)

        contours, hierarchy = cv2.findContours(thresholded.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        motion_detected = len(contours) > 0
        if motion_detected:
            # حساب مساحة الحركة
            total_area = sum(cv2.contourArea(contour) for contour in contours)
            self.motion_history.append({
                'time': time.time(),
                'magnitude': motion_magnitude,
                'area': total_area,
                'num_contours': len(contours)
            })

        self.previous_frame = gray
        return motion_detected, motion_magnitude


class GameDataCollector:
    def __init__(self, child_id="CHILD001", session_id=None):
        self.child_id = child_id
        self.session_id = session_id or datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # بيانات الجلسة
        self.session_start = time.time()
        self.session_data = {
            'session_info': {
                'child_id': child_id,
                'session_id': self.session_id,
                'start_time': datetime.now().isoformat(),
                'green_light_duration': 0,
                'red_light_duration': 0
            },
            'trials': [],
            'reaction_times': [],
            'false_moves': [],
            'false_stops': [],
            'freeze_durations': [],
            'movement_data': [],
            'phase_performance': {
                'green': {'total_time': 0, 'motion_count': 0, 'avg_magnitude': 0},
                'red': {'total_time': 0, 'motion_count': 0, 'avg_magnitude': 0}
            },
            'summary': {}
        }
        
        # متغيرات تتبع الأداء
        self.current_trial = {
            'phase': None,
            'start_time': None,
            'expected_duration': None,
            'motion_detected': False,
            'motion_time': None
        }
        
        # للتتبع المستمر
        self.consecutive_success = 0
        self.max_consecutive_success = 0
        self.last_error_time = None
        self.freeze_start = None
        self.is_frozen = False
        
    def start_phase(self, phase, duration):
        """بدء مرحلة جديدة (أخضر/أحمر)"""
        self.current_trial = {
            'phase': phase,
            'start_time': time.time(),
            'expected_duration': duration,
            'motion_detected': False,
            'motion_time': None,
            'motion_magnitude': 0,
            'motion_area': 0
        }
        
        if phase == 'red':
            self.freeze_start = time.time()
            self.is_frozen = True
            
    def end_phase(self, phase):
        """إنهاء المرحلة الحالية وتسجيل البيانات"""
        if self.current_trial['phase'] != phase:
            return
            
        end_time = time.time()
        actual_duration = end_time - self.current_trial['start_time']
        
        # تسجيل المحاولة
        trial_data = {
            'phase': phase,
            'start_time': self.current_trial['start_time'],
            'end_time': end_time,
            'expected_duration': self.current_trial['expected_duration'],
            'actual_duration': actual_duration,
            'motion_detected': self.current_trial['motion_detected'],
            'motion_time': self.current_trial['motion_time'],
            'motion_magnitude': self.current_trial['motion_magnitude'],
            'motion_area': self.current_trial['motion_area'],
            'success': not (phase == 'red' and self.current_trial['motion_detected'])
        }
        
        self.session_data['trials'].append(trial_data)
        
        # تحديث الإحصائيات
        if phase == 'red':
            if self.is_frozen and self.freeze_start:
                freeze_duration = end_time - self.freeze_start
                if not self.current_trial['motion_detected']:
                    self.session_data['freeze_durations'].append(freeze_duration)
            
            if self.current_trial['motion_detected']:
                # خطأ: تحرك في الأحمر
                self.session_data['false_moves'].append({
                    'time': self.current_trial['motion_time'],
                    'reaction_time': self.current_trial['motion_time'] - self.current_trial['start_time']
                })
                self.consecutive_success = 0
                self.last_error_time = time.time()
            else:
                # نجاح: لم يتحرك في الأحمر
                self.consecutive_success += 1
                if self.consecutive_success > self.max_consecutive_success:
                    self.max_consecutive_success = self.consecutive_success
                    
        elif phase == 'green':
            if self.current_trial['motion_detected']:
                # تأخر في الاستجابة للحركة
                reaction_time = self.current_trial['motion_time'] - self.current_trial['start_time']
                self.session_data['reaction_times'].append({
                    'time': self.current_trial['motion_time'],
                    'reaction_time': reaction_time
                })
            else:
                # خطأ: لم يتحرك في الأخضر
                self.session_data['false_stops'].append({
                    'time': end_time
                })
        
        self.is_frozen = False
        
    def record_motion(self, motion_detected, magnitude, area=0):
        """تسجيل حدث حركة"""
        if motion_detected and self.current_trial['phase']:
            current_time = time.time()
            if not self.current_trial['motion_detected']:
                self.current_trial['motion_detected'] = True
                self.current_trial['motion_time'] = current_time
                self.current_trial['motion_magnitude'] = magnitude
                self.current_trial['motion_area'] = area
                
        # تسجيل بيانات الحركة المستمرة
        self.session_data['movement_data'].append({
            'time': time.time(),
            'magnitude': magnitude,
            'phase': self.current_trial['phase'] if self.current_trial['phase'] else 'none'
        })
        
    def generate_summary(self):
        """توليد ملخص الجلسة والمؤشرات المركبة"""
        trials = self.session_data['trials']
        if not trials:
            return
            
        # إحصائيات أساسية
        red_trials = [t for t in trials if t['phase'] == 'red']
        green_trials = [t for t in trials if t['phase'] == 'green']
        
        false_moves = len([t for t in red_trials if t['motion_detected']])
        false_stops = len([t for t in green_trials if not t['motion_detected']])
        total_trials = len(red_trials) + len(green_trials)
        
        # مؤشر الاندفاعية (Impulsivity Index)
        impulsivity_index = (false_moves / len(red_trials)) * 100 if red_trials else 0
        
        # مؤشر التحكم الحركي
        if self.session_data['freeze_durations']:
            avg_freeze = sum(self.session_data['freeze_durations']) / len(self.session_data['freeze_durations'])
            expected_freeze = sum(t['expected_duration'] for t in red_trials) / len(red_trials) if red_trials else 1
            motor_control_score = (avg_freeze / expected_freeze) * 100
        else:
            motor_control_score = 0
            
        # متوسط زمن الاستجابة
        avg_reaction_time = 0
        if self.session_data['reaction_times']:
            avg_reaction_time = sum(r['reaction_time'] for r in self.session_data['reaction_times']) / len(self.session_data['reaction_times'])
            
        # درجة التشتت (تباين زمن الاستجابة)
        distraction_score = 0
        if len(self.session_data['reaction_times']) > 1:
            times = [r['reaction_time'] for r in self.session_data['reaction_times']]
            distraction_score = np.std(times) if times else 0
            
        # تحديث phase_performance
        for phase in ['green', 'red']:
            phase_trials = [t for t in trials if t['phase'] == phase]
            if phase_trials:
                total_time = sum(t['actual_duration'] for t in phase_trials)
                motion_count = sum(1 for t in phase_trials if t['motion_detected'])
                avg_magnitude = np.mean([t['motion_magnitude'] for t in phase_trials if t['motion_magnitude'] > 0]) if motion_count > 0 else 0
                
                self.session_data['phase_performance'][phase] = {
                    'total_time': total_time,
                    'motion_count': motion_count,
                    'avg_magnitude': avg_magnitude,
                    'trial_count': len(phase_trials)
                }
        
        self.session_data['summary'] = {
            'session_duration': time.time() - self.session_start,
            'total_trials': total_trials,
            'false_moves': false_moves,
            'false_stops': false_stops,
            'success_rate': ((total_trials - false_moves - false_stops) / total_trials * 100) if total_trials > 0 else 0,
            'avg_reaction_time': avg_reaction_time,
            'impulsivity_index': impulsivity_index,
            'motor_control_score': motor_control_score,
            'distraction_score': distraction_score,
            'max_consecutive_success': self.max_consecutive_success,
            'time_before_first_error': self.calculate_time_to_first_error()
        }
        
    def calculate_time_to_first_error(self):
        """حساب الوقت قبل أول خطأ"""
        if self.last_error_time:
            return self.last_error_time - self.session_start
        return time.time() - self.session_start
        
    def save_data(self):
        """حفظ البيانات في ملفات"""
        # إنشاء مجلد للبيانات إذا لم يكن موجوداً
        if not os.path.exists('session_data'):
            os.makedirs('session_data')
            
        # حفظ بصيغة JSON
        json_filename = f"session_data/{self.child_id}_{self.session_id}.json"
        with open(json_filename, 'w', encoding='utf-8') as f:
            json.dump(self.session_data, f, indent=2, ensure_ascii=False)
            
        # حفظ بصيغة CSV للملخص
        csv_filename = f"session_data/{self.child_id}_{self.session_id}_summary.csv"
        with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Metric', 'Value'])
            for key, value in self.session_data['summary'].items():
                writer.writerow([key, value])
                
        # حفظ بيانات المحاولات في CSV منفصل
        trials_csv = f"session_data/{self.child_id}_{self.session_id}_trials.csv"
        with open(trials_csv, 'w', newline='', encoding='utf-8') as f:
            if self.session_data['trials']:
                writer = csv.DictWriter(f, fieldnames=self.session_data['trials'][0].keys())
                writer.writeheader()
                writer.writerows(self.session_data['trials'])
                
        print(f"\n✅ تم حفظ البيانات في:")
        print(f"   - {json_filename}")
        print(f"   - {csv_filename}")
        print(f"   - {trials_csv}")
        
        return json_filename


def mouse_callback(event, x, y, flags, param):
    global mouse_click_pos
    if event == cv2.EVENT_LBUTTONDOWN:
        mouse_click_pos = (x, y)


# ========== إعدادات اللعبة ==========
GREEN_LIGHT_DURATION = 5.5
RED_LIGHT_DURATION = 3.5
COUNTDOWN_TIME = 60
CHILD_ID = "CHILD001"  # يمكن تغييره لكل طفل
# ======================================

# تهيئة الكائنات
md = MotionDetector()
data_collector = GameDataCollector(child_id=CHILD_ID)

cap = cv2.VideoCapture(0)

start_time = cv2.getTickCount()
countdown_time = COUNTDOWN_TIME
elapsed_time = 0
game_over = False
motiond = 0
end = 0

circle_color = (0, 255, 0)
circle_radius = 50
circle_thickness = 5
circle_center = (100, 150)
last_color_change_time = time.time()
current_phase = "green"

# تحديث مدة الجلسة في data_collector
data_collector.session_data['session_info']['green_light_duration'] = GREEN_LIGHT_DURATION
data_collector.session_data['session_info']['red_light_duration'] = RED_LIGHT_DURATION

# بدء أول مرحلة
data_collector.start_phase(current_phase, GREEN_LIGHT_DURATION)
play_sound(green_sound)

# إعدادات الزر
button_x, button_y = 1000, 600
button_width, button_height = 200, 80
button_color = (255, 0, 0)
button_text = "WIN BUTTON"

mouse_click_pos = None

cv2.namedWindow('ADHD Training Game')
cv2.setMouseCallback('ADHD Training Game', mouse_callback)

# متغيرات لعرض الإحصائيات المباشرة
display_stats = True

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.resize(frame, (1280, 720))

    # رسم الزر
    cv2.rectangle(frame, (button_x, button_y), (button_x + button_width, button_y + button_height), button_color, -1)
    cv2.putText(frame, button_text, (button_x + 20, button_y + 50), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    # كشف الحركة
    motion_detected, motion_magnitude = md.detect_motion(frame)
    data_collector.record_motion(motion_detected, motion_magnitude)

    current_time = time.time()

    # تحديد مدة المرحلة الحالية
    if current_phase == "green":
        phase_duration = GREEN_LIGHT_DURATION
    else:
        phase_duration = RED_LIGHT_DURATION

    # تغيير المرحلة إذا انتهى الوقت
    if current_time - last_color_change_time > phase_duration:
        # إنهاء المرحلة الحالية
        data_collector.end_phase(current_phase)
        
        last_color_change_time = current_time

        if current_phase == "green":
            current_phase = "red"
            circle_color = (0, 0, 255)
            play_sound(red_sound)
        else:
            current_phase = "green"
            circle_color = (0, 255, 0)
            play_sound(green_sound)
            
        # بدء المرحلة الجديدة
        data_collector.start_phase(current_phase, phase_duration)

    # رسم الدائرة
    cv2.circle(frame, circle_center, circle_radius, circle_color, circle_thickness)

    # عرض معلومات المرحلة
    phase_text = f"Phase: {current_phase.upper()}"
    cv2.putText(frame, phase_text, (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    
    phase_time_left = phase_duration - (current_time - last_color_change_time)
    if phase_time_left > 0:
        time_text = f"Phase Time: {phase_time_left:.1f}s"
        cv2.putText(frame, time_text, (50, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    # المؤقت الرئيسي
    if not game_over:
        elapsed_time = (cv2.getTickCount() - start_time) / cv2.getTickFrequency()
        remaining_time = countdown_time - int(elapsed_time)
        if remaining_time <= 0 or motiond == 1:
            game_over = True
        else:
            cv2.putText(frame, f"Time: {remaining_time}", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)

    # التحقق من النقر على الزر
    button_clicked = False
    if mouse_click_pos is not None:
        x, y = mouse_click_pos
        if (button_x <= x <= button_x + button_width and
                button_y <= y <= button_y + button_height):
            button_clicked = True
        mouse_click_pos = None

    # النقر على الزر أو الضغط على k
    if (cv2.waitKey(1) & 0xFF == ord('k')) or button_clicked:
        cv2.putText(frame, "You Win!", (520, 360), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 255), 4)
        cv2.imshow('ADHD Training Game', frame)
        cv2.waitKey(2000)
        end = 1
        break

    # عرض حالة الحركة
    if motion_detected:
        if circle_color == (0, 0, 255):  # إذا كان أحمر
            motiond = 1
        cv2.putText(frame, f"Motion: YES ({motion_magnitude:.1f})", (1000, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
    else:
        cv2.putText(frame, f"Motion: NO ({motion_magnitude:.1f})", (1000, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

    # عرض إحصائيات مباشرة (اختياري)
    if display_stats and data_collector.session_data['summary']:
        y_offset = 200
        for key, value in list(data_collector.session_data['summary'].items())[:5]:  # عرض أول 5 مؤشرات
            if isinstance(value, float):
                cv2.putText(frame, f"{key}: {value:.2f}", (1000, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
            else:
                cv2.putText(frame, f"{key}: {value}", (1000, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
            y_offset += 25

    cv2.imshow('ADHD Training Game', frame)

    if game_over and end == 0:
        cv2.putText(frame, "Game Over", (480, 360), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 255), 4)
        cv2.imshow('ADHD Training Game', frame)
        cv2.waitKey(2000)
        end = 1
        break

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# إنهاء الجلسة وحفظ البيانات
data_collector.end_phase(current_phase)
data_collector.generate_summary()
data_collector.save_data()

# عرض الملخص النهائي
print("\n" + "="*50)
print("📊 ملخص الجلسة النهائي")
print("="*50)
summary = data_collector.session_data['summary']
for key, value in summary.items():
    if isinstance(value, float):
        print(f"{key}: {value:.2f}")
    else:
        print(f"{key}: {value}")

cap.release()
cv2.destroyAllWindows();lvc