import tkinter as tk
import customtkinter as ctk
from PIL import Image, ImageTk, ImageOps
import cv2
import os
import time
from database import GameDatabase
from mirror_me import MirrorMeGame
from green_light_game import GreenLightGame

# Set appearance mode and color theme
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

class App(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("ADHD - Child Development App")
        self.geometry("1200x850")
        
        # Database
        self.db = GameDatabase()
        self.child_id = None
        self.current_game = None
        
        # Main Container
        self.container = ctk.CTkFrame(self)
        self.container.pack(fill="both", expand=True, padx=20, pady=20)
        
        self.show_id_entry()

    def clear_container(self):
        for widget in self.container.winfo_children():
            widget.destroy()

    def show_id_entry(self):
        self.clear_container()
        
        frame = ctk.CTkFrame(self.container, corner_radius=20)
        frame.place(relx=0.5, rely=0.5, anchor="center")
        
        # Logo or Icon placeholder
        logo_label = ctk.CTkLabel(frame, text="🌟", font=("Arial", 60))
        logo_label.pack(pady=(40, 10))
        
        ctk.CTkLabel(frame, text="Welcome back, Explorer!", font=("Arial", 32, "bold")).pack(pady=10, padx=60)
        ctk.CTkLabel(frame, text="Enter your secret ID to start the adventure", font=("Arial", 16), text_color="gray").pack(pady=5)
        
        self.id_entry = ctk.CTkEntry(frame, placeholder_text="e.g. CHILD001", width=350, height=50, font=("Arial", 20), justify="center")
        self.id_entry.pack(pady=30)
        self.id_entry.bind("<Return>", lambda e: self.validate_id())
        
        self.error_label = ctk.CTkLabel(frame, text="", text_color="#ff5555", font=("Arial", 14))
        self.error_label.pack()
        
        self.login_btn = ctk.CTkButton(frame, text="Start Adventure!", font=("Arial", 20, "bold"), 
                                      width=200, height=50, corner_radius=25, command=self.validate_id)
        self.login_btn.pack(pady=(20, 40))

    def validate_id(self):
        child_id = self.id_entry.get().strip().upper()
        if not child_id:
            self.error_label.configure(text="Please enter your ID!")
            return

        self.login_btn.configure(state="disabled", text="Checking...")
        
        if self.db.validate_child_id(child_id):
            self.child_id = child_id
            self.show_game_selection()
        else:
            self.error_label.configure(text="ID not found. Ask your guardian for help!")
            self.login_btn.configure(state="normal", text="Start Adventure!")

    def show_game_selection(self):
        self.clear_container()
        
        # Header
        header = ctk.CTkFrame(self.container, fg_color="transparent")
        header.pack(fill="x", pady=(20, 40))
        
        ctk.CTkLabel(header, text=f"Hello, {self.child_id}! 🚀", font=("Arial", 36, "bold")).pack(side="left", padx=20)
        ctk.CTkButton(header, text="Logout", width=100, fg_color="#444", command=self.show_id_entry).pack(side="right", padx=20)
        
        ctk.CTkLabel(self.container, text="Choose a game to play today:", font=("Arial", 22)).pack(pady=10)
        
        games_container = ctk.CTkFrame(self.container, fg_color="transparent")
        games_container.pack(expand=True)
        
        # Game Cards
        self.create_game_card(games_container, "Mirror Me", "Follow the poses and hold still!", "🪞", 0)
        self.create_game_card(games_container, "Red Light Green Light", "Move when green, freeze when red!", "🚦", 1)

    def create_game_card(self, parent, title, desc, emoji, col):
        card = ctk.CTkFrame(parent, width=350, height=450, corner_radius=20)
        card.grid(row=0, column=col, padx=30, pady=20)
        card.grid_propagate(False)
        
        ctk.CTkLabel(card, text=emoji, font=("Arial", 80)).pack(pady=(60, 20))
        ctk.CTkLabel(card, text=title, font=("Arial", 26, "bold")).pack(pady=5)
        ctk.CTkLabel(card, text=desc, font=("Arial", 16), text_color="gray", wraplength=250).pack(pady=20)
        
        ctk.CTkButton(card, text="Play Now", font=("Arial", 18, "bold"), width=200, height=45, 
                     corner_radius=22, command=lambda t=title: self.start_game(t)).pack(side="bottom", pady=40)

    def start_game(self, game_name):
        self.clear_container()
        
        # Top Nav
        nav = ctk.CTkFrame(self.container, height=60, corner_radius=0)
        nav.pack(fill="x", side="top", pady=(0, 10))
        
        ctk.CTkLabel(nav, text=f"Playing: {game_name}", font=("Arial", 20, "bold")).pack(side="left", padx=30)
        
        ctk.CTkButton(nav, text="🔙 Back to Menu", fg_color="#333", hover_color="#444", width=150, 
                     command=self.exit_game).pack(side="right", padx=10)
        ctk.CTkButton(nav, text="🔄 Restart", fg_color="#cc7a00", hover_color="#b36b00", width=120, 
                     command=self.restart_game).pack(side="right", padx=10)
        
        # Game Content Area
        self.video_container = ctk.CTkFrame(self.container, fg_color="black")
        self.video_container.pack(fill="both", expand=True, padx=10, pady=10)
        
        self.video_label = tk.Label(self.video_container, bg="black")
        self.video_label.pack(fill="both", expand=True)
        
        # Bind Mouse Events
        self.video_label.bind("<Motion>", self._on_mouse_move)
        self.video_label.bind("<Button-1>", self._on_mouse_click)
        
        # Initialize Game
        if game_name == "Mirror Me":
            self.current_game = MirrorMeGame(child_id=self.child_id)
        else:
            self.current_game = GreenLightGame(child_id=self.child_id)
            
        self.update_loop()

    def update_loop(self):
        if self.current_game:
            frame = self.current_game.update()
            if frame is not None:
                # Convert BGR to RGB
                cv2_img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                
                # Resize to fit Label while maintaining aspect ratio or filling
                lbl_w = self.video_label.winfo_width()
                lbl_h = self.video_label.winfo_height()
                
                if lbl_w > 1 and lbl_h > 1:
                    img = Image.fromarray(cv2_img)
                    # Maintain aspect ratio by padding (letterboxing)
                    img = ImageOps.pad(img, (lbl_w, lbl_h), color="black")
                    imgtk = ImageTk.PhotoImage(image=img)
                    self.video_label.imgtk = imgtk
                    self.video_label.configure(image=imgtk)
                
            self.after(20, self.update_loop)

    def _on_mouse_move(self, event):
        if self.current_game and hasattr(self.current_game, 'mouse_pos'):
            # Map Tkinter coordinates to Game coordinates
            lbl_w = self.video_label.winfo_width()
            lbl_h = self.video_label.winfo_height()
            
            # Assuming camera is 1280x720 or 640x480
            # Get internal frame size from game
            if hasattr(self.current_game, 'cap'):
                cam_w = self.current_game.cap.get(cv2.CAP_PROP_FRAME_WIDTH)
                cam_h = self.current_game.cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
                
                if lbl_w > 0 and lbl_h > 0:
                    map_x = int(event.x * (cam_w / lbl_w))
                    map_y = int(event.y * (cam_h / lbl_h))
                    self.current_game.mouse_pos = (map_x, map_y)

    def _on_mouse_click(self, event):
        if self.current_game:
            if hasattr(self.current_game, 'mouse_clicked'):
                self.current_game.mouse_clicked = True

    def restart_game(self):
        if self.current_game:
            self.current_game.restart()

    def exit_game(self):
        if self.current_game:
            if hasattr(self.current_game, 'cleanup'):
                self.current_game.cleanup()
            elif hasattr(self.current_game, 'cap'):
                self.current_game.cap.release()
            self.current_game = None
        self.show_game_selection()

if __name__ == "__main__":
    app = App()
    app.mainloop()
