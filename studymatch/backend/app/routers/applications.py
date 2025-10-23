from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from app.database import get_db
from app.security import get_current_user
from app.models.user import User
from app.models.group import StudyGroup
from app.models.application import Application, ApplicationStatus
from app.models.membership import Membership, Role
from app.schemas.application import ApplicationCreate, ApplicationOut

router = APIRouter(prefix="/applications", tags=["applications"])

@router.post("/groups/{group_id}/apply", response_model=ApplicationOut)
def apply_group(group_id: int = Path(...), payload: ApplicationCreate = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    g = db.get(StudyGroup, group_id)
    if not g:
        raise HTTPException(404, "Group not found")
    if g.owner_id == user.id:
        raise HTTPException(400, "Owner cannot apply to own group")

    # existing approved membership?
    m = db.query(Membership).filter(and_(Membership.group_id == group_id, Membership.user_id == user.id)).first()
    if m:
        raise HTTPException(400, "Already a member")

    # existing pending / approved application?
    existing = db.query(Application).filter(and_(Application.group_id == group_id, Application.user_id == user.id)).first()
    if existing and existing.status in (ApplicationStatus.PENDING, ApplicationStatus.APPROVED):
        raise HTTPException(400, f"Already {existing.status.value.lower()}")

    app = Application(group_id=group_id, user_id=user.id, message=(payload.message if payload else None))
    db.add(app)
    db.commit()
    db.refresh(app)
    return app

@router.get("/mine", response_model=list[ApplicationOut])
def my_applications(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Application).filter(Application.user_id == user.id).order_by(Application.id.desc()).all()

@router.get("/groups/{group_id}", response_model=list[ApplicationOut])
def list_group_applications(group_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    g = db.get(StudyGroup, group_id)
    if not g:
        raise HTTPException(404, "Group not found")
    if g.owner_id != user.id:
        raise HTTPException(403, "Only owner can view applications")
    return db.query(Application).filter(Application.group_id == group_id).order_by(Application.id.desc()).all()

@router.post("/{app_id}/approve", response_model=ApplicationOut)
def approve_application(app_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    app = db.get(Application, app_id)
    if not app:
        raise HTTPException(404, "Application not found")
    g = db.get(StudyGroup, app.group_id)
    if not g:
        raise HTTPException(404, "Group not found")
    if g.owner_id != user.id:
        raise HTTPException(403, "Only owner can approve")
    app.status = ApplicationStatus.APPROVED
    # create membership if not exists
    exists = db.query(Membership).filter(Membership.group_id == app.group_id, Membership.user_id == app.user_id).first()
    if not exists:
        mem = Membership(group_id=app.group_id, user_id=app.user_id, role=Role.MEMBER)
        db.add(mem)
    db.add(app)
    db.commit()
    db.refresh(app)
    return app

@router.post("/{app_id}/reject", response_model=ApplicationOut)
def reject_application(app_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    app = db.get(Application, app_id)
    if not app:
        raise HTTPException(404, "Application not found")
    g = db.get(StudyGroup, app.group_id)
    if not g:
        raise HTTPException(404, "Group not found")
    if g.owner_id != user.id:
        raise HTTPException(403, "Only owner can reject")
    app.status = ApplicationStatus.REJECTED
    db.add(app)
    db.commit()
    db.refresh(app)
    return app
