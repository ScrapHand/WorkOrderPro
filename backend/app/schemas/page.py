from typing import Optional, List, Dict, Any
from pydantic import BaseModel, UUID4

class PageBase(BaseModel):
    key: str # e.g. "dashboard"
    layout_json: Dict[str, Any] # The actual layout config

class PageCreate(PageBase):
    pass

class PageUpdate(PageBase):
    pass

class Page(PageBase):
    id: UUID4
    is_system_default: bool
    
    class Config:
        orm_mode = True
