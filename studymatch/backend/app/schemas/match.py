from pydantic import BaseModel

class MatchReason(BaseModel):
    topicFit: float
    timeOverlap: float
    levelGap: float
    modeDistance: float

class MatchItem(BaseModel):
    group_id: int
    score: float
    reason: MatchReason
