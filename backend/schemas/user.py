import json
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    username: str
    full_name: Optional[str] = None
    role: str = "analyst"


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
    tab_permissions: Optional[List[str]] = None  # None = don't change; [] = reset to role defaults


class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: Optional[datetime] = None
    tab_permissions: Optional[List[str]] = None

    @field_validator('tab_permissions', mode='before')
    @classmethod
    def parse_perms(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return None
        return v

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str
