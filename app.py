"""
DIGITAL ATTENDANCE — Streamlit Web App
------------------------------------------
This wraps everything you've built so far (enrollment + recognition +
Excel logging) into a simple website that runs locally in your browser.
No more typing terminal commands or file paths by hand.

Requirements (install first):
    pip install streamlit face_recognition opencv-python pillow pandas openpyxl numpy

Run:
    py -3.12 -m streamlit run app.py

This opens a browser tab automatically at http://localhost:8501
"""

import streamlit as st
import face_recognition
import numpy as np
import pandas as pd
import os
from datetime import datetime
from PIL import Image

KNOWN_FACES_DIR = "known_faces"
ATTENDANCE_FILE = "attendance_log.xlsx"
MATCH_TOLERANCE = 0.6

os.makedirs(KNOWN_FACES_DIR, exist_ok=True)

st.set_page_config(page_title="Digital Attendance", page_icon="🎓", layout="centered")


# ===========================================================
# Helper functions (same logic as your earlier scripts)
# ===========================================================

def ensure_rgb_uint8(pil_image):
    """
    Forces ANY uploaded image into a clean, guaranteed-safe format for
    face_recognition/dlib. This fixes the common
    'Unsupported image type, must be 8bit gray or RGB image' error,
    which happens when:
      - a PNG has a transparency (alpha) channel — RGBA instead of RGB
      - an image is in palette mode ("P"), CMYK, or 16-bit color
      - the array ends up as float instead of integer pixel values

    .convert("RGB") alone sometimes isn't enough on its own for every
    file, so we also explicitly force the numpy array to 3 channels
    and 8-bit unsigned integers, which is exactly what dlib expects.
    """
    rgb_image = pil_image.convert("RGB")
    array = np.array(rgb_image, dtype=np.uint8)

    # Safety net: if something upstream still produced more than 3
    # channels (shouldn't happen after convert("RGB"), but just in case),
    # slice down to the first 3 (R, G, B) and drop anything extra.
    if array.ndim == 3 and array.shape[2] > 3:
        array = array[:, :, :3]

    # Make sure the array is contiguous in memory — dlib can also fail
    # on non-contiguous arrays produced by certain slicing/cropping operations.
    array = np.ascontiguousarray(array)

    return array

def load_known_faces():
    """Loads every enrolled student's face encoding from the known_faces folder."""
    known_encodings = []
    known_names = []

    for filename in os.listdir(KNOWN_FACES_DIR):
        if not filename.lower().endswith((".jpg", ".jpeg", ".png")):
            continue
        path = os.path.join(KNOWN_FACES_DIR, filename)
        image = face_recognition.load_image_file(path)
        encodings = face_recognition.face_encodings(image)
        if len(encodings) == 0:
            continue
        known_encodings.append(encodings[0])
        known_names.append(os.path.splitext(filename)[0].replace("_", " "))

    return known_encodings, known_names


def recognize_photo(pil_image, known_encodings, known_names):
    """Runs detection + recognition on an uploaded classroom photo."""
    image = ensure_rgb_uint8(pil_image)
    face_locations = face_recognition.face_locations(image, model="hog")
    face_encodings = face_recognition.face_encodings(image, face_locations)

    present_names = set()
    unmatched_count = 0

    for face_encoding in face_encodings:
        if len(known_encodings) == 0:
            unmatched_count += 1
            continue

        matches = face_recognition.compare_faces(known_encodings, face_encoding, tolerance=MATCH_TOLERANCE)
        distances = face_recognition.face_distance(known_encodings, face_encoding)
        best_match_index = np.argmin(distances)

        if matches[best_match_index]:
            present_names.add(known_names[best_match_index])
        else:
            unmatched_count += 1

    return present_names, unmatched_count, len(face_locations)


def save_attendance(known_names, present_names):
    """Appends today's attendance rows to the Excel log."""
    now = datetime.now()
    rows = [
        {
            "Date": now.strftime("%Y-%m-%d"),
            "Time": now.strftime("%H:%M:%S"),
            "Student Name": name,
            "Status": "Present" if name in present_names else "Absent",
        }
        for name in known_names
    ]
    new_df = pd.DataFrame(rows)

    if os.path.exists(ATTENDANCE_FILE):
        existing_df = pd.read_excel(ATTENDANCE_FILE)
        combined_df = pd.concat([existing_df, new_df], ignore_index=True)
    else:
        combined_df = new_df

    combined_df.to_excel(ATTENDANCE_FILE, index=False)
    return combined_df


# ===========================================================
# Sidebar navigation
# ===========================================================
st.sidebar.title("🎓 Digital Attendance")
page = st.sidebar.radio("Go to", ["Enroll Student", "Take Attendance", "View Attendance Log"])

known_encodings, known_names = load_known_faces()
st.sidebar.markdown("---")
st.sidebar.caption(f"Enrolled students: {len(known_names)}")
if known_names:
    st.sidebar.write(", ".join(known_names))


# ===========================================================
# PAGE 1: Enroll Student
# ===========================================================
if page == "Enroll Student":
    st.title("Enroll a Student")
    st.write("Upload one clear, front-facing photo per student. This becomes their reference for recognition.")

    student_name = st.text_input("Student name")
    uploaded_photo = st.file_uploader("Upload reference photo", type=["jpg", "jpeg", "png"])

    if uploaded_photo:
        st.image(uploaded_photo, caption="Preview", width=250)

    if st.button("Enroll student", type="primary"):
        if not student_name.strip():
            st.error("Please enter a student name.")
        elif not uploaded_photo:
            st.error("Please upload a photo.")
        else:
            # Check the photo actually contains a detectable face before saving.
            image = Image.open(uploaded_photo)
            image_array = ensure_rgb_uint8(image)
            check_encodings = face_recognition.face_encodings(image_array)

            if len(check_encodings) == 0:
                st.error("No face detected in that photo. Try a clearer, well-lit, front-facing photo.")
            else:
                safe_filename = student_name.strip().replace(" ", "_")
                extension = os.path.splitext(uploaded_photo.name)[1]
                save_path = os.path.join(KNOWN_FACES_DIR, f"{safe_filename}{extension}")
                image.convert("RGB").save(save_path)
                st.success(f"Enrolled {student_name} successfully!")
                st.rerun()


# ===========================================================
# PAGE 2: Take Attendance
# ===========================================================
elif page == "Take Attendance":
    st.title("Take Attendance")

    if len(known_names) == 0:
        st.warning("No students enrolled yet. Go to 'Enroll Student' first.")
    else:
        st.write(f"Comparing against **{len(known_names)}** enrolled student(s).")
        classroom_photo = st.file_uploader("Upload classroom photo", type=["jpg", "jpeg", "png"])

        if classroom_photo:
            st.image(classroom_photo, caption="Classroom photo", use_container_width=True)

            if st.button("Run recognition", type="primary"):
                with st.spinner("Detecting and matching faces..."):
                    pil_image = Image.open(classroom_photo)
                    present_names, unmatched_count, total_faces = recognize_photo(
                        pil_image, known_encodings, known_names
                    )

                st.success(f"Detected {total_faces} face(s) in the photo.")

                # Store results in session state so the "Save" button below
                # can access them after this button's click finishes.
                st.session_state["present_names"] = present_names
                st.session_state["unmatched_count"] = unmatched_count

        # Show results + save option if a recognition run has happened.
        if "present_names" in st.session_state:
            present_names = st.session_state["present_names"]
            unmatched_count = st.session_state["unmatched_count"]

            st.subheader("Results")
            col1, col2 = st.columns(2)
            with col1:
                st.write("**Present**")
                for name in known_names:
                    if name in present_names:
                        st.write(f"✅ {name}")
            with col2:
                st.write("**Absent**")
                for name in known_names:
                    if name not in present_names:
                        st.write(f"❌ {name}")

            if unmatched_count > 0:
                st.warning(
                    f"{unmatched_count} face(s) in the photo didn't match any enrolled student. "
                    "Could be a visitor, an unenrolled student, or a low-quality match — worth a manual check."
                )

            if st.button("Save this attendance to Excel", type="primary"):
                save_attendance(known_names, present_names)
                st.success(f"Saved to {ATTENDANCE_FILE}")
                del st.session_state["present_names"]
                del st.session_state["unmatched_count"]


# ===========================================================
# PAGE 3: View Attendance Log
# ===========================================================
elif page == "View Attendance Log":
    st.title("Attendance Log")

    if not os.path.exists(ATTENDANCE_FILE):
        st.info("No attendance recorded yet. Take attendance first.")
    else:
        df = pd.read_excel(ATTENDANCE_FILE)
        st.dataframe(df, use_container_width=True)

        with open(ATTENDANCE_FILE, "rb") as f:
            st.download_button(
                "Download attendance_log.xlsx",
                data=f,
                file_name="attendance_log.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
