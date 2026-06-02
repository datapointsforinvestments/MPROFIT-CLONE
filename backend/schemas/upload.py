from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime


class UploadPreviewResponse(BaseModel):
    company_name: Optional[str] = None
    fincode: Optional[int] = None
    mode: str  # "created" | "updated"
    model_type: str
    years_found: List[str] = []
    total_years: int = 0
    fields_extracted: int = 0
    dcf_seeded: bool = False
    dcf_seed_values: Dict[str, Any] = {}
    warnings: List[str] = []
    errors: List[str] = []
    # Carry parse result for confirm step (stored server-side in session or re-parsed)
    parse_token: Optional[str] = None


class UploadConfirmRequest(BaseModel):
    parse_token: str
    quarter: Optional[str] = None


class UploadOut(BaseModel):
    id: int
    company_id: Optional[int] = None
    filename: Optional[str] = None
    uploaded_by: Optional[str] = None
    uploaded_at: Optional[datetime] = None
    status: Optional[str] = None
    years_imported: Optional[int] = None
    errors: Optional[str] = None
    quarter: Optional[str] = None
    model_type: Optional[str] = None
    stored_path: Optional[str] = None

    model_config = {"from_attributes": True}
