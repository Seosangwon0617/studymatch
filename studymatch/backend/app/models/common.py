import enum

class Mode(enum.Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    HYBRID = "HYBRID"

class GroupStatus(enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
