"""
High School Management System API

A FastAPI application for Mergington High School with activities, events,
gallery, and contact information.
"""

from fastapi import FastAPI, HTTPException, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
import os
from pathlib import Path
import json
import secrets

app = FastAPI(title="Mergington High School API",
              description="API for viewing activities, events, gallery and contact info")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")

# Teacher credentials and in-memory auth sessions
teachers_file_path = current_dir / "teachers.json"
with open(teachers_file_path, "r", encoding="utf-8") as f:
    teacher_records = json.load(f)

teachers = {record["username"]: record["password"] for record in teacher_records}
teacher_sessions = {}


class LoginRequest(BaseModel):
    username: str
    password: str


def require_teacher(x_teacher_token: str | None) -> str:
    """Validate teacher token and return associated username."""
    if not x_teacher_token or x_teacher_token not in teacher_sessions:
        raise HTTPException(
            status_code=403,
            detail="Teacher login required"
        )
    return teacher_sessions[x_teacher_token]

# In-memory activity database
activities = {
    "Chess Club": {
        "description": "Learn strategies and compete in chess tournaments",
        "schedule": "Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 12,
        "participants": ["michael@mergington.edu", "daniel@mergington.edu"]
    },
    "Programming Class": {
        "description": "Learn programming fundamentals and build software projects",
        "schedule": "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
        "max_participants": 20,
        "participants": ["emma@mergington.edu", "sophia@mergington.edu"]
    },
    "Gym Class": {
        "description": "Physical education and sports activities",
        "schedule": "Mondays, Wednesdays, Fridays, 2:00 PM - 3:00 PM",
        "max_participants": 30,
        "participants": ["john@mergington.edu", "olivia@mergington.edu"]
    },
    "Soccer Team": {
        "description": "Join the school soccer team and compete in matches",
        "schedule": "Tuesdays and Thursdays, 4:00 PM - 5:30 PM",
        "max_participants": 22,
        "participants": ["liam@mergington.edu", "noah@mergington.edu"]
    },
    "Basketball Team": {
        "description": "Practice and play basketball with the school team",
        "schedule": "Wednesdays and Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 15,
        "participants": ["ava@mergington.edu", "mia@mergington.edu"]
    },
    "Art Club": {
        "description": "Explore your creativity through painting and drawing",
        "schedule": "Thursdays, 3:30 PM - 5:00 PM",
        "max_participants": 15,
        "participants": ["amelia@mergington.edu", "harper@mergington.edu"]
    },
    "Drama Club": {
        "description": "Act, direct, and produce plays and performances",
        "schedule": "Mondays and Wednesdays, 4:00 PM - 5:30 PM",
        "max_participants": 20,
        "participants": ["ella@mergington.edu", "scarlett@mergington.edu"]
    },
    "Math Club": {
        "description": "Solve challenging problems and participate in math competitions",
        "schedule": "Tuesdays, 3:30 PM - 4:30 PM",
        "max_participants": 10,
        "participants": ["james@mergington.edu", "benjamin@mergington.edu"]
    },
    "Debate Team": {
        "description": "Develop public speaking and argumentation skills",
        "schedule": "Fridays, 4:00 PM - 5:30 PM",
        "max_participants": 12,
        "participants": ["charlotte@mergington.edu", "henry@mergington.edu"]
    }
}

# In-memory events database
events = {
    "Spring Carnival": {
        "date": "2026-05-30",
        "time": "2:00 PM - 5:00 PM",
        "location": "School Grounds",
        "description": "Annual school carnival with games, food, and entertainment",
        "category": "Festival",
        "image": "carnival.jpg",
        "details": "Join us for a day of fun! There will be game booths, food trucks, live music, and more."
    },
    "Science Fair": {
        "date": "2026-06-15",
        "time": "1:00 PM - 4:00 PM",
        "location": "Gymnasium",
        "description": "Students showcase their science projects and experiments",
        "category": "Academic",
        "image": "science-fair.jpg",
        "details": "Come see amazing student research projects in physics, chemistry, biology, and more!"
    },
    "Sports Day": {
        "date": "2026-06-05",
        "time": "10:00 AM - 3:00 PM",
        "location": "Sports Complex",
        "description": "Inter-class sports competitions and athletic events",
        "category": "Sports",
        "image": "sports-day.jpg",
        "details": "Watch competitive matches, races, and team sports across multiple events."
    },
    "Talent Show": {
        "date": "2026-06-22",
        "time": "7:00 PM - 9:00 PM",
        "location": "Auditorium",
        "description": "Students perform music, dance, comedy, and more",
        "category": "Entertainment",
        "image": "talent-show.jpg",
        "details": "Showcase your talents! Sign-ups for performers available in the main office."
    },
    "Art Exhibition": {
        "date": "2026-05-25",
        "time": "3:00 PM - 6:00 PM",
        "location": "Library",
        "description": "Display of student artwork from all art classes",
        "category": "Arts",
        "image": "art-exhibition.jpg",
        "details": "Come celebrate the creativity of our student artists!"
    }
}

# In-memory gallery database
gallery = {
    "items": [
        {
            "id": 1,
            "title": "Chess Tournament Finals",
            "category": "Clubs",
            "image": "chess-tournament.jpg",
            "description": "Finals of the annual school chess tournament"
        },
        {
            "id": 2,
            "title": "Drama Club Performance",
            "category": "Clubs",
            "image": "drama-performance.jpg",
            "description": "Our Drama Club's spring play performance"
        },
        {
            "id": 3,
            "title": "Soccer Championship",
            "category": "Sports",
            "image": "soccer-championship.jpg",
            "description": "Soccer team wins district championship"
        },
        {
            "id": 4,
            "title": "Art Class Exhibition",
            "category": "Arts",
            "image": "art-exhibit.jpg",
            "description": "Beautiful artwork from our art classes"
        },
        {
            "id": 5,
            "title": "Science Fair Winners",
            "category": "Academic",
            "image": "science-winners.jpg",
            "description": "Celebrating our science fair champion projects"
        },
        {
            "id": 6,
            "title": "Basketball Game",
            "category": "Sports",
            "image": "basketball-game.jpg",
            "description": "Exciting basketball action from last month"
        }
    ]
}

# Contact information
contact_info = {
    "school_name": "Mergington High School",
    "address": "123 School Lane, Mergington, ST 12345",
    "phone": "(555) 123-4567",
    "email": "info@mergington.edu",
    "principal": "Dr. Michael Johnson",
    "vice_principal": "Ms. Sarah Wilson",
    "hours": "8:00 AM - 3:30 PM (Monday - Friday)",
    "social_media": {
        "facebook": "https://facebook.com/mergingtonhs",
        "twitter": "https://twitter.com/mergingtonhs",
        "instagram": "https://instagram.com/mergingtonhs"
    }
}


@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")


@app.get("/activities")
def get_activities():
    return activities


@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, email: str, x_teacher_token: str | None = Header(default=None)):
    """Sign up a student for an activity"""
    require_teacher(x_teacher_token)

    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Validate student is not already signed up
    if email in activity["participants"]:
        raise HTTPException(
            status_code=400,
            detail="Student is already signed up"
        )

    # Add student
    activity["participants"].append(email)
    return {"message": f"Signed up {email} for {activity_name}"}


@app.delete("/activities/{activity_name}/unregister")
def unregister_from_activity(activity_name: str, email: str, x_teacher_token: str | None = Header(default=None)):
    """Unregister a student from an activity"""
    require_teacher(x_teacher_token)

    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Validate student is signed up
    if email not in activity["participants"]:
        raise HTTPException(
            status_code=400,
            detail="Student is not signed up for this activity"
        )

    # Remove student
    activity["participants"].remove(email)
    return {"message": f"Unregistered {email} from {activity_name}"}


@app.post("/auth/login")
def teacher_login(login_request: LoginRequest):
    """Authenticate teacher and return a session token."""
    expected_password = teachers.get(login_request.username)
    if expected_password is None or expected_password != login_request.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = secrets.token_urlsafe(24)
    teacher_sessions[token] = login_request.username
    return {
        "message": "Login successful",
        "token": token,
        "username": login_request.username
    }


@app.post("/auth/logout")
def teacher_logout(x_teacher_token: str | None = Header(default=None)):
    """End teacher session."""
    if x_teacher_token and x_teacher_token in teacher_sessions:
        del teacher_sessions[x_teacher_token]
    return {"message": "Logged out"}


@app.get("/auth/me")
def get_current_teacher(x_teacher_token: str | None = Header(default=None)):
    """Return teacher identity for a valid session token."""
    username = require_teacher(x_teacher_token)
    return {"username": username}


# ==================== EVENTS ENDPOINTS ====================

@app.get("/events")
def get_events():
    """Get all upcoming events"""
    return events


@app.get("/events/{event_name}")
def get_event_details(event_name: str):
    """Get details for a specific event"""
    if event_name not in events:
        raise HTTPException(status_code=404, detail="Event not found")
    return {event_name: events[event_name]}


# ==================== GALLERY ENDPOINTS ====================

@app.get("/gallery")
def get_gallery():
    """Get all gallery items"""
    return gallery


@app.get("/gallery/{item_id}")
def get_gallery_item(item_id: int):
    """Get a specific gallery item"""
    for item in gallery["items"]:
        if item["id"] == item_id:
            return item
    raise HTTPException(status_code=404, detail="Gallery item not found")


# ==================== CONTACT ENDPOINTS ====================

@app.get("/contact")
def get_contact_info():
    """Get school contact information"""
    return contact_info
