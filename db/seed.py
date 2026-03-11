import sqlite3
import pandas as pd
import random
import os
from datetime import date, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), 'attendance.db')
CSV_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'students.csv')

def seed():
    df = pd.read_csv(CSV_PATH)

    # Use first 200 students for manageable seeding
    df = df.head(200).reset_index(drop=True)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("Seeding students...")
    for i, row in df.iterrows():
        reg_number= f"REG{str(i+1).zfill(4)}"
        # Use StudentID or index as name if StudentID is not available
        full_name = str(row.get('StudentID', f"Student {i+1}"))
        cursor.execute('''
            INSERT INTO students (reg_number, full_name)
            VALUES (?, ?)
        ''', (reg_number, full_name))

    print("Seeding sessions...")
    session_dates = []
    current = date.today() - timedelta(days=60)
    while len(session_dates) < 30:
        if current.weekday() < 5:  # Only weekdays
            session_dates.append(current)
        current += timedelta(days=1)

    for d in session_dates:
        cursor.execute('''
            INSERT INTO sessions (session_date)
            VALUES (?)
        ''', (d.isoformat(),)
        )

    print("Seeding attendance records...")
    cursor.execute('SELECT id FROM students')
    student_ids = [row[0] for row in cursor.fetchall()]
    
    cursor.execute('SELECT id FROM sessions')
    session_ids = [row[0] for row in cursor.fetchall()]

    statuses = ['PRESENT', 'ABSENT', 'EXCUSED'] # ~60% present, 20% absent, 20% excused
    for student_id in student_ids:
        for session_id in session_ids:
            status = random.choices(statuses, weights=[0.6, 0.2, 0.2])[0]
            cursor.execute('''
                INSERT OR IGNORE INTO attendance_records (student_id, session_id, status)
                VALUES (?, ?, ?)
            ''', (student_id, session_id, status)
            )

    conn.commit()
    conn.close()
    print("Seeding completed successfully.")

if __name__ == "__main__":
    seed()