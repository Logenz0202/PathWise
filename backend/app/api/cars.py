from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.car_profile import CarProfile
from app.schemas.car_profile import CarProfileCreate, CarProfileResponse, CarProfileUpdate

router = APIRouter(prefix="/api/cars", tags=["cars"])


def get_car_or_404(car_id: int, db: Session) -> CarProfile:
    car = db.get(CarProfile, car_id)
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Car not found")
    return car


@router.get("/", response_model=List[CarProfileResponse])
def list_cars(db: Session = Depends(get_db)):
    """List saved car presets, oldest first."""
    return db.query(CarProfile).order_by(CarProfile.created_at, CarProfile.id).all()


@router.post("/", response_model=CarProfileResponse, status_code=status.HTTP_201_CREATED)
def create_car(payload: CarProfileCreate, db: Session = Depends(get_db)):
    """Save a new car preset."""
    car = CarProfile(**payload.model_dump())
    db.add(car)
    db.commit()
    db.refresh(car)
    return car


@router.get("/{car_id}", response_model=CarProfileResponse)
def get_car(car_id: int, db: Session = Depends(get_db)):
    """Get one car preset."""
    return get_car_or_404(car_id, db)


@router.put("/{car_id}", response_model=CarProfileResponse)
def update_car(car_id: int, payload: CarProfileUpdate, db: Session = Depends(get_db)):
    """Replace a car preset's name and specs."""
    car = get_car_or_404(car_id, db)
    for field, value in payload.model_dump().items():
        setattr(car, field, value)
    db.commit()
    db.refresh(car)
    return car


@router.delete("/{car_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_car(car_id: int, db: Session = Depends(get_db)):
    """Delete a car preset. Past comparisons keep their own copy of the specs."""
    car = get_car_or_404(car_id, db)
    db.delete(car)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
