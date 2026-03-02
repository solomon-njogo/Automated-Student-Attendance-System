## Automated Student Attendance System

### Overview
The **Automated Student Attendance System** is a simple rule-based web application that helps determine whether a student meets attendance requirements based on recorded class attendance.

The system is built using **Python**, **Flask**, and **SQLite**, and focuses on demonstrating how attendance rules can be modeled and checked programmatically.

---

### Objectives
- **Model attendance policies** in code using clear, rule-based logic.
- **Store and manage** student and attendance data in an SQLite database.
- **Evaluate** whether each student meets the minimum attendance threshold.
- **Provide simple outputs** (e.g., valid/invalid attendance) through a Flask-based interface or scripts.

---

### Tech Stack
- **Language**: Python  
  - Use `py` to run Python commands in the terminal on Windows.
- **Web framework**: Flask
- **Database**: SQLite (`db/attendance.db`)
- **Methodology**: Rule-based logic (e.g., percentage-based thresholds)

---

### Project Structure (high-level)
- `app.py` – Flask entrypoint and HTTP API.
- `requirements.txt` – Python dependencies.
- `db/attendance.db` – SQLite database file (created after initialization).
- `db/schemas/schema.sql` – Database schema definition.
- `db/init_db.py` – Helper script to create and migrate the database.

---

### Setup & Installation

#### 1. Prerequisites
- Python 3.x installed and available as `py` on Windows.

#### 2. Clone the repository
```bash
git clone https://github.com/solomon-njogo/Automated-Student-Attendance-System
cd Automated-Student-Attendance-System
```

#### 3. Create and activate a virtual environment
It is recommended to use a virtual environment for this project.

```bash
py -m venv venv
venv\Scripts\activate
```

If you are using a Unix-like shell (e.g., Git Bash), you can also activate with:

```bash
source venv/Scripts/activate
```

#### 4. Install dependencies
```bash
py -m pip install -r requirements.txt
```

#### 5. Initialize the database
This will create `db/attendance.db` (if it does not exist) and apply the schema from `db/schemas/schema.sql`.

```bash
py db\init_db.py
```

---

### Running the Application

With the virtual environment activated, the database created and initialized as well as dependencies installed:

```bash
py app.py
```

By default, Flask will start a development server (e.g., on `http://127.0.0.1:5000/`).  
Open the URL shown in the terminal to access the API.  
The root endpoint `/` returns a simple JSON message confirming that the API is running.

---

### Core Scope (planned)
- **Student management**: Store basic student information.
- **Attendance records**: Track attendance per class/session.
- **Rule-based evaluation**: Determine if a student’s attendance is:
  - Valid (meets or exceeds the required percentage), or  
  - Invalid (below the requirement).
- **Testing with mock data**: Use sample data to validate the logic and edge cases.

---

### Database Schema (summary)

The project uses a simple SQLite database with the following core tables:

- **students**
  - `id` `INTEGER PRIMARY KEY AUTOINCREMENT`
  - `reg_number` `TEXT NOT NULL UNIQUE`
  - `full_name` `TEXT NOT NULL`
  - `created_at` `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

- **attendance_records**
  - `id` `INTEGER PRIMARY KEY AUTOINCREMENT`
  - `student_id` `INTEGER NOT NULL` (FK to `students.id`, `ON DELETE CASCADE`)
  - `session_date` `DATE NOT NULL`
  - `status` `TEXT NOT NULL` (`'PRESENT'`, `'ABSENT'`, or `'EXCUSED'`)
  - `created_at` `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
  - Unique constraint on (`student_id`, `session_date`) to prevent duplicate records for the same student on the same day.

For the full schema, see `db/schemas/schema.sql`.

---

### Development Roadmap
- **Week 1: Study attendance policies**
  - Review university/college attendance rules (e.g., minimum percentage required, handling excused absences).
  - Translate policies into clear, programmable rules.

- **Week 2: Design & create the database**
  - Design tables for students, courses (if any), and attendance records.
  - Implement the SQLite schema and connection logic in Python.

- **Week 3: Implement attendance logic**
  - Write Python functions to calculate attendance percentage.
  - Apply rule-based logic to classify attendance as valid/invalid.
  - Expose this logic via Flask routes or scripts.

- **Week 4: Testing with mock data**
  - Populate the database with sample students and attendance records.
  - Run test cases (normal, boundary, and edge cases).
  - Fix any issues in logic or data handling.

- **Week 5: Presentation & documentation**
  - Prepare a short demo of the system (e.g., web interface or CLI output).
  - Summarize findings: how rules are applied, limitations, and possible improvements.
  - Finalize this `README.md` and any additional project documentation.

---

### Future Improvements
- Add authentication for students and lecturers.
- Support multiple courses and sections.
- Export attendance reports (PDF/CSV).
- Integrate with institutional systems (e.g., LMS or student portals).

---

This project is part of the **APT3020** coursework and is completed as **group work**, aiming to demonstrate practical application of rule-based systems to real-world academic policies.

### Group Members
1. Solomon Njogo  
2. Ted  
3. Shawn