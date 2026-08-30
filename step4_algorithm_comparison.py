"""
STEP 4: Algorithm Accuracy Comparison + Graph
-----------------------------------------------
Goal: Run Haar Cascade, HOG, and CNN-based face detection on the SAME
set of test photos, compare each against your manually-counted ground
truth, and automatically generate a bar chart + CSV table of real
results you can put directly into your paper.

HOW IT WORKS:
  1. Loops through every photo in your test_photos folder
  2. Runs all three detectors on each photo, timing each one
  3. Asks YOU once per photo: "how many real faces are actually here?"
     (this is your ground truth — the one manual step that can't be
     automated, since the algorithms don't know what's "correct")
  4. Calculates precision, recall, and average speed per algorithm
  5. Saves a bar chart image (comparison_graph.png) and a CSV table
     (results.csv) with all the numbers

Requirements (install first):
    pip install face_recognition opencv-python matplotlib pandas

SETUP BEFORE RUNNING:
  Create a folder called "test_photos" next to this script and add
  20-30 photos representing realistic classroom conditions (different
  lighting, angles, distances, some partial occlusion).

Run:
    python step4_algorithm_comparison.py
"""

import cv2
import face_recognition
import os
import time
import pandas as pd
import matplotlib.pyplot as plt

TEST_PHOTOS_DIR = "test_photos"


def detect_haar(image_bgr, face_cascade):
    """Detect faces using Haar Cascade. Returns (count, time_taken)."""
    start = time.time()
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))
    elapsed = time.time() - start
    return len(faces), elapsed


def detect_hog(image_rgb):
    """Detect faces using HOG (via face_recognition/dlib). Returns (count, time_taken)."""
    start = time.time()
    face_locations = face_recognition.face_locations(image_rgb, model="hog")
    elapsed = time.time() - start
    return len(face_locations), elapsed


def detect_cnn(image_rgb):
    """
    Detect faces using the CNN-based detector (via face_recognition/dlib).
    WARNING: This is much slower without a GPU — expect several seconds
    per photo on a normal laptop CPU. That slowness is itself a real,
    reportable result for your paper.
    """
    start = time.time()
    face_locations = face_recognition.face_locations(image_rgb, model="cnn")
    elapsed = time.time() - start
    return len(face_locations), elapsed


def get_ground_truth(filename):
    """Ask the user how many real faces are in this photo."""
    while True:
        answer = input(f"  How many REAL faces are in '{filename}'? ").strip()
        if answer.isdigit():
            return int(answer)
        print("  Please enter a whole number.")


def main():
    if not os.path.isdir(TEST_PHOTOS_DIR):
        print(f"ERROR: '{TEST_PHOTOS_DIR}' folder not found. Create it and add test photos first.")
        return

    photo_files = [f for f in os.listdir(TEST_PHOTOS_DIR) if f.lower().endswith((".jpg", ".jpeg", ".png"))]

    if len(photo_files) == 0:
        print(f"No photos found in '{TEST_PHOTOS_DIR}'. Add some and try again.")
        return

    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

    # Store per-algorithm running totals: true positives, false positives,
    # false negatives (misses), and total time taken.
    results = {
        "Haar Cascade": {"tp": 0, "fp": 0, "fn": 0, "time": 0.0},
        "HOG": {"tp": 0, "fp": 0, "fn": 0, "time": 0.0},
        "CNN": {"tp": 0, "fp": 0, "fn": 0, "time": 0.0},
    }

    print(f"Found {len(photo_files)} test photo(s). Starting comparison...\n")
    print("NOTE: CNN detection is slow on CPU — this may take a while per photo.\n")

    for filename in photo_files:
        path = os.path.join(TEST_PHOTOS_DIR, filename)
        image_bgr = cv2.imread(path)
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

        print(f"Processing: {filename}")

        haar_count, haar_time = detect_haar(image_bgr, face_cascade)
        hog_count, hog_time = detect_hog(image_rgb)
        cnn_count, cnn_time = detect_cnn(image_rgb)

        print(f"  Haar found: {haar_count}  |  HOG found: {hog_count}  |  CNN found: {cnn_count}")

        # Ground truth is asked ONCE per photo, then reused for all three
        # algorithms' scoring — this keeps the comparison fair.
        truth = get_ground_truth(filename)

        # Score each algorithm against the same ground truth.
        # Simplified scoring: if detected count >= truth, treat the extra
        # detections as false positives. If detected count < truth, treat
        # the shortfall as false negatives (misses). This is a reasonable
        # approximation for a beginner project; a more rigorous approach
        # would match individual face BOXES to ground-truth boxes, which
        # you can mention as a limitation/future improvement in your paper.
        for algo_name, count, elapsed in [
            ("Haar Cascade", haar_count, haar_time),
            ("HOG", hog_count, hog_time),
            ("CNN", cnn_count, cnn_time),
        ]:
            tp = min(count, truth)
            fp = max(0, count - truth)
            fn = max(0, truth - count)

            results[algo_name]["tp"] += tp
            results[algo_name]["fp"] += fp
            results[algo_name]["fn"] += fn
            results[algo_name]["time"] += elapsed

        print()

    # -------------------------------------------------------------
    # Calculate final precision, recall, and average speed per algorithm
    # -------------------------------------------------------------
    summary_rows = []
    for algo_name, r in results.items():
        tp, fp, fn = r["tp"], r["fp"], r["fn"]

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        avg_time = r["time"] / len(photo_files)

        summary_rows.append({
            "Algorithm": algo_name,
            "Precision (%)": round(precision * 100, 1),
            "Recall (%)": round(recall * 100, 1),
            "Avg Time per Photo (s)": round(avg_time, 3),
        })

    summary_df = pd.DataFrame(summary_rows)

    print("\n===== FINAL RESULTS =====")
    print(summary_df.to_string(index=False))

    # Save results as CSV — you can open this in Excel or paste into your paper.
    summary_df.to_csv("results.csv", index=False)
    print("\nSaved detailed results to results.csv")

    # -------------------------------------------------------------
    # Generate and save the comparison graph
    # -------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(8, 5))

    x = range(len(summary_df))
    width = 0.35

    ax.bar([i - width/2 for i in x], summary_df["Precision (%)"], width, label="Precision (%)", color="#3F7D4F")
    ax.bar([i + width/2 for i in x], summary_df["Recall (%)"], width, label="Recall (%)", color="#C98A2B")

    ax.set_xticks(list(x))
    ax.set_xticklabels(summary_df["Algorithm"])
    ax.set_ylabel("Percentage (%)")
    ax.set_ylim(0, 100)
    ax.set_title("Face Detection Algorithm Comparison — Your Test Results")
    ax.legend()

    plt.tight_layout()
    plt.savefig("comparison_graph.png", dpi=150)
    print("Saved graph to comparison_graph.png")

    plt.show()


if __name__ == "__main__":
    main()
