"""
STEP 3 PROTOTYPE: Live Face Scanning (Detection + Recognition)
------------------------------------------------------------------
Goal: Connect to your laptop webcam, detect faces in real time, and
label each one with a name IF it matches a known/enrolled face.
Unknown faces are labeled "Unknown".

This is the core "scanning" algorithm your final app will build on —
the difference between this and your final app is just: instead of
a live webcam loop, the real app will run this same matching logic
on a single classroom photo, then log results to Excel.

HOW IT WORKS:
  1. Loads reference photos from a folder (one clear photo per person)
  2. Converts each reference photo into a "face encoding" — a set of
     128 numbers that uniquely describe that face's geometry
  3. For every frame from the webcam: detects faces, encodes them,
     and compares those encodings against your known encodings
  4. If the distance between two encodings is small enough, it's
     considered a match

Requirements (install first):
    pip install face_recognition opencv-python

SETUP BEFORE RUNNING:
  1. Create a folder called "known_faces" next to this script.
  2. Inside it, add one clear, well-lit photo per person you want
     recognized. Name each file after the person, e.g.:
         known_faces/Aditi_Rao.jpg
         known_faces/Rohan_Mehta.jpg
     The filename (without extension) becomes the label shown on screen.

Run:
    python step3_live_face_scan.py
"""

import face_recognition
import cv2
import os
import numpy as np

KNOWN_FACES_DIR = "known_faces"

# How strict the matching is. Lower = stricter (fewer false matches,
# but may miss real matches too). 0.6 is the commonly used default —
# worth tuning and reporting on in your experiments section.
MATCH_TOLERANCE = 0.6


def load_known_faces(folder_path):
    """
    Loads every image in the given folder, extracts one face encoding
    per image, and returns two matching lists: encodings and names.
    """
    known_encodings = []
    known_names = []

    if not os.path.isdir(folder_path):
        print(f"ERROR: '{folder_path}' folder not found. Create it and add reference photos first.")
        return known_encodings, known_names

    for filename in os.listdir(folder_path):
        if not filename.lower().endswith((".jpg", ".jpeg", ".png")):
            continue  # skip non-image files

        file_path = os.path.join(folder_path, filename)
        image = face_recognition.load_image_file(file_path)

        # face_encodings() returns a list because an image could
        # contain multiple faces — we assume ONE clear face per
        # reference photo, so we take the first result if found.
        encodings = face_recognition.face_encodings(image)

        if len(encodings) == 0:
            print(f"WARNING: No face found in {filename} — skipping. Use a clearer photo.")
            continue

        known_encodings.append(encodings[0])

        # Turn "Aditi_Rao.jpg" into "Aditi Rao" for a cleaner on-screen label.
        name = os.path.splitext(filename)[0].replace("_", " ")
        known_names.append(name)

        print(f"Enrolled: {name}")

    return known_encodings, known_names


def run_live_scan(known_encodings, known_names):
    """
    Opens the webcam and continuously detects + recognizes faces,
    drawing a labeled box around each one.
    """
    video_capture = cv2.VideoCapture(0)

    if not video_capture.isOpened():
        print("ERROR: Could not access webcam.")
        return

    print("Live scanning started. Press 'q' to quit.")

    # Skip every other frame for speed, same trick as Step 2.
    process_this_frame = True

    while True:
        ret, frame = video_capture.read()
        if not ret:
            print("Failed to grab frame.")
            break

        if process_this_frame:
            # Shrink frame for faster processing.
            small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
            rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)

            # Detect faces, then compute their encodings.
            face_locations = face_recognition.face_locations(rgb_small_frame, model="hog")
            face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

            face_names = []
            for face_encoding in face_encodings:
                name = "Unknown"

                if len(known_encodings) > 0:
                    # Compare this face against every known face.
                    # Returns True/False for each known face based on tolerance.
                    matches = face_recognition.compare_faces(
                        known_encodings, face_encoding, tolerance=MATCH_TOLERANCE
                    )

                    # Also compute the actual numeric distance to each known
                    # face — smaller distance = more confident match. We use
                    # this to pick the BEST match rather than just the first
                    # "True" in the list.
                    face_distances = face_recognition.face_distance(known_encodings, face_encoding)
                    best_match_index = np.argmin(face_distances)

                    if matches[best_match_index]:
                        name = known_names[best_match_index]

                face_names.append(name)

        process_this_frame = not process_this_frame

        # Draw results, scaling coordinates back up by 4x.
        for (top, right, bottom, left), name in zip(face_locations, face_names):
            top *= 4
            right *= 4
            bottom *= 4
            left *= 4

            # Green box for recognized, red box for unknown.
            box_color = (0, 255, 0) if name != "Unknown" else (0, 0, 255)

            cv2.rectangle(frame, (left, top), (right, bottom), box_color, 2)

            # Label background for readability.
            cv2.rectangle(frame, (left, bottom - 25), (right, bottom), box_color, cv2.FILLED)
            cv2.putText(
                frame, name, (left + 6, bottom - 6),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1
            )

        cv2.imshow("Live Face Scan — press 'q' to quit", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    video_capture.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    print("Loading known faces...")
    known_encodings, known_names = load_known_faces(KNOWN_FACES_DIR)
    print(f"Loaded {len(known_names)} known face(s).\n")

    run_live_scan(known_encodings, known_names)
