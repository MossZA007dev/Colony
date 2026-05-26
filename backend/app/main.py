from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .ai_ant import router as ai_ant
from .config import get_settings
from .crew.router import router as crew_router
from .bridge.router import router as bridge_router
from .enterprise.router import router as enterprise_router
from .routes import auth, surveys, waitlist


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Colony API", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_origin_regex=settings.cors_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(ai_ant.router)
    app.include_router(auth.router)
    app.include_router(surveys.router)
    app.include_router(waitlist.router)
    app.include_router(crew_router)
    app.include_router(bridge_router)
    app.include_router(enterprise_router)

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
