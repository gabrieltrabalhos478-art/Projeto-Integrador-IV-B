from pydantic import BaseModel, Field


class VaccinationPointOut(BaseModel):
    """Public representation of a vaccination point in Alagoas."""

    id: int
    city_id: int
    name: str
    address: str | None = None
    neighborhood: str | None = None
    phone: str | None = None
    opening_hours: str | None = None
    vaccines: list[str]


class VaccinationPointPayload(BaseModel):
    """Input payload for creating or updating a vaccination point."""

    city_id: int = Field(..., gt=0)
    name: str = Field(..., min_length=2, max_length=200)
    address: str | None = Field(default=None, max_length=300)
    neighborhood: str | None = Field(default=None, max_length=150)
    phone: str | None = Field(default=None, max_length=60)
    opening_hours: str | None = Field(default=None, max_length=200)
    vaccines: list[str] = Field(default_factory=list)
