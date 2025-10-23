from sqlalchemy.orm import Session
from app.models.group import StudyGroup, GroupStatus, Mode
from app.models.user import User
from app.models.profile import Profile
from app.utils import jaccard

def time_overlap(user_avail: list[dict], group_days: list[str]) -> float:
    if not user_avail or not group_days:
        return 0.0
    u_days = {slot.get("day") for slot in user_avail}
    g_days = set(group_days)
    if not u_days:
        return 0.0
    return len(u_days & g_days) / max(1, len(g_days))

def distance_penalty(user_online_only: bool, group_mode: Mode) -> float:
    if group_mode == Mode.ONLINE:
        return 0.0
    return 0.3 if user_online_only else 0.0

def level_gap(user_level: str | None, required_level: str | None) -> float:
    order = {"BEGINNER": 0, "INTERMEDIATE": 1, "ADVANCED": 2}
    if not user_level or not required_level or user_level not in order or required_level not in order:
        return 0.5
    diff = abs(order[user_level] - order[required_level])
    return 1 - min(1, diff / 2)

def compute_scores(db: Session, user: User) -> list[dict]:
    profile: Profile | None = user.profile
    if not profile:
        return []
    groups = db.query(StudyGroup).filter(StudyGroup.status == GroupStatus.OPEN).all()
    results: list[dict] = []
    for g in groups:
        topicFit = jaccard(profile.interests or [], [g.topic])
        timeOverlap = time_overlap(profile.availability or [], g.days_of_week or [])
        levelGap = level_gap(profile.level, None)
        modeDistance = distance_penalty(profile.is_online_only, g.mode)
        score = 0.3 * topicFit + 0.3 * timeOverlap + 0.15 * levelGap + 0.1 * (1 - modeDistance)
        results.append({
            "group_id": g.id,
            "score": round(float(score), 4),
            "reason": {
                "topicFit": round(float(topicFit), 3),
                "timeOverlap": round(float(timeOverlap), 3),
                "levelGap": round(float(levelGap), 3),
                "modeDistance": round(float(modeDistance), 3),
            },
        })
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:20]
