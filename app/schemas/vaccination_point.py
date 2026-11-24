from pydantic import BaseModel


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
