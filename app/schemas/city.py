from pydantic import BaseModel


class CitySummary(BaseModel):
    """Summary representation of a municipality for list responses."""

    id: int
    name: str
    ibge_code: int


class CityDetail(BaseModel):
    """Detailed representation of a municipality including point count."""

    id: int
    name: str
    state: str = "AL"
    ibge_code: int
    vaccination_points_count: int
