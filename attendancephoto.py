"""
STEP 5: Attendance from an Uploaded Classroom Photo
------------------------------------------------------
Goal: This is your actual app's core logic. No webcam — you provide
ONE photo of the classroom, and the script:
  1. Detects every face in that photo
  2. Matches each detected face against your enrolled student database
  3. Marks every enrolled student as Present (if matched in the photo)
     or Absent (if not matched)
  4. Appends the results — with date and time — into an Excel file

Every time you run this with a new class photo, it adds a new set of
rows to the SAME Excel file, so you build up a running attendance log
across many days/sessions.

Requirements (install first):
    pip install face_recognition opencv-python openpyxl pandas

SETUP BEFORE RUNNING:
  1. Create a folder called "known_faces" next to this script.
  2. Add one clear reference photo per enrolled student, named after them:
         known_faces/Aditi_Rao.jpg
         known_faces/Rohan_Mehta.jpg
     This list of files = your full class roster. Everyone in this
     folder gets marked Present or Absent every time you run the script.

Run:
    python step5_attendance_from_photo.py
    (it will ask you for the path to the classroom photo)
"""

import face_recognition
import os
import numpy as np
import pandas as pd
from datetime import datetime

KNOWN_FACES_DIR = "known_faces"
ATTENDANCE_FILE = "attendance_log.xlsx"

# Matching strictness — lower = stricter matching, fewer false positives.
# Worth tuning based on your Step 4 experiment results.
MATCH_TOLERANCE = 0.6


def load_known_faces(folder_path):
    """
    Loads every reference photo from the folder, extracts one face
    encoding per photo, and returns matching lists of encodings and names.
    This defines your full class roster.
    """
    known_encodings = []
    known_names = []

    if not os.path.isdir(folder_path):
        print(f"ERROR: '{folder_path}' folder not found. Create it and add student reference photos.")
        return known_encodings, known_names

    for filename in os.listdir(folder_path):
        if not filename.lower().endswith((".jpg", ".jpeg", ".png")):
            continue

        file_path = os.path.join(folder_path, filename)
        image = face_recognition.load_image_file(file_path)
        encodings = face_recognition.face_encodings(image)

        if len(encodings) == 0:
            print(f"WARNING: No face found in {filename} — skipping. Use a clearer reference photo.")
            continue

        known_encodings.append(encodings[0])
        name = os.path.splitext(filename)[0].replace("_", " ")
        known_names.append(name)

    return known_encodings, known_names


def recognize_classroom_photo(photo_path, known_encodings, known_names):
    """
    Detects all faces in the classroom photo and matches each one
    against the known student database. Returns a SET of names that
    were found present in the photo (duplicates naturally collapse).
    Also returns a count of faces that were detected but did NOT
    match anyone — useful for flagging to the teacher for manual review.
    """
    if not os.path.exists(photo_path):
        print(f"ERROR: Photo not found at '{photo_path}'")
        return set(), 0

    image = face_recognition.load_image_file(photo_path)
    face_locations = face_recognition.face_locations(image, model="hog")
    face_encodings = face_recognition.face_encodings(image, face_locations)

    print(f"Detected {len(face_encodings)} face(s) in the classroom photo.")

    present_names = set()
    unmatched_count = 0

    for face_encoding in face_encodings:
        if len(known_encodings) == 0:
            unmatched_count += 1
            continue

        matches = face_recognition.compare_faces(known_encodings, face_encoding, tolerance=MATCH_TOLERANCE)
        face_distances = face_recognition.face_distance(known_encodings, face_encoding)
        best_match_index = np.argmin(face_distances)

        if matches[best_match_index]:
            present_names.add(known_names[best_match_index])
        else:
            unmatched_count += 1

    return present_names, unmatched_count


def save_attendance_to_excel(known_names, present_names, session_date, session_time):
    """
    Builds attendance rows for this session — one row per enrolled
    student — and appends them to the Excel log. Creates the file
    with headers if it doesn't exist yet.
    """
    new_rows = []
    for name in known_names:
        status = "Present" if name in present_names else "Absent"
        new_rows.append({
            "Date": session_date,
            "Time": session_time,
            "Student Name": name,
            "Status": status,
        })

    new_df = pd.DataFrame(new_rows)

    if os.path.exists(ATTENDANCE_FILE):
        # Append to existing log so history builds up across sessions.
        existing_df = pd.read_excel(ATTENDANCE_FILE)
        combined_df = pd.concat([existing_df, new_df], ignore_index=True)
    else:
        combined_df = new_df

    combined_df.to_excel(ATTENDANCE_FILE, index=False)
    print(f"\nAttendance saved to {ATTENDANCE_FILE}")


def main():
    print("Loading enrolled student database...")
    known_encodings, known_names = load_known_faces(KNOWN_FACES_DIR)

    if len(known_names) == 0:
        print("No enrolled students found. Add reference photos to the 'known_faces' folder first.")
        return

    print(f"Loaded {len(known_names)} enrolled student(s): {', '.join(known_names)}\n")

    photo_path = input("Enter the path to the classroom photo: ").strip()

    present_names, unmatched_count = recognize_classroom_photo(photo_path, known_encodings, known_names)

    # Timestamp for this session — recorded once, applied to every
    # student's row so the whole session shares one date/time.
    now = datetime.now()
    session_date = now.strftime("%Y-%m-%d")
    session_time = now.strftime("%H:%M:%S")

    # --------- Print a quick summary before saving ---------
    print("\n===== ATTENDANCE SUMMARY =====")
    for name in known_names:
        status = "Present" if name in present_names else "Absent"
        print(f"  {name}: {status}")

    if unmatched_count > 0:
        print(f"\nNOTE: {unmatched_count} face(s) in the photo did not match any enrolled student.")
        print("This could mean a visitor, a new/unenrolled student, or a low-quality match —")
        print("worth a manual check (this is your 'teacher verification' step).")

    save_attendance_to_excel(known_names, present_names, session_date, session_time)


if __name__ == "__main__":
    main()
