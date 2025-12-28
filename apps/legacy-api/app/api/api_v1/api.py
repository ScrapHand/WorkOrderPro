from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, tenants, work_orders, users, utils, pages, assets, inventory, pm_schedules

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(work_orders.router, prefix="/work-orders", tags=["work-orders"])
api_router.include_router(assets.router, prefix="/assets", tags=["assets"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(pm_schedules.router, prefix="/pm-schedules", tags=["pm-schedules"])
api_router.include_router(utils.router, prefix="/utils", tags=["utils"])
api_router.include_router(pages.router, prefix="/pages", tags=["pages"])
from app.api.api_v1.endpoints import debug
api_router.include_router(debug.router, prefix="/debug", tags=["debug"])
