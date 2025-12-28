from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="WorkOrderPro API v2")

# CORS
origins = [
    "http://localhost:3000",
    "https://workorderpro.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .api.endpoints import work_orders

app.include_router(work_orders.router, prefix="/api/v2/work-orders", tags=["work-orders"])

@app.get("/")
def read_root():
    return {"message": "Welcome to WorkOrderPro API v2 (Golden Stack)"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
