from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class KPIOut(BaseModel):
    id: int
    company_id: int
    kpi_name: str
    kpi_value: Optional[float] = None
    period: Optional[str] = None
    kpi_type: Optional[int] = None
    entered_by: Optional[str] = None
    entered_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class KPICreate(BaseModel):
    kpi_name: str
    kpi_value: Optional[float] = None
    period: Optional[str] = None
