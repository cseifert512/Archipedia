"""
Boards API Router - SQLite persistence for curation boards.
"""
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
import sqlite3
import os
import json
import uuid
import secrets
import string
from datetime import datetime, timezone
import logging
import asyncio

from ..config import settings
from ..services.export_service import generate_pdf, EXPORT_DIR, PLAYWRIGHT_AVAILABLE

logger = logging.getLogger(__name__)
router = APIRouter()

# ============ Database Setup ============

DB_PATH = os.path.join(settings.data_dir, "boards.db")


def get_db():
    """Get database connection."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize database tables."""
    conn = get_db()
    cursor = conn.cursor()

    # Boards table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS boards (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            subtitle TEXT,
            description TEXT,
            cover_image_url TEXT,
            layout_preset TEXT DEFAULT 'grid',
            page_format TEXT DEFAULT 'web',
            share_token TEXT UNIQUE NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)

    # Blocks table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS blocks (
            id TEXT PRIMARY KEY,
            board_id TEXT NOT NULL,
            type TEXT NOT NULL,
            position REAL NOT NULL,
            data TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
        )
    """)

    # Index for share token lookup
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_boards_share_token ON boards(share_token)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_blocks_board_id ON blocks(board_id)")

    conn.commit()
    conn.close()


# Initialize on module load
try:
    init_db()
except Exception as e:
    logger.warning(f"Failed to initialize boards database: {e}")


# ============ Pydantic Models ============

class ReferenceBlockData(BaseModel):
    project_id: str
    image_id: Optional[str] = None
    thumb_url_snapshot: str
    image_url_snapshot: Optional[str] = None
    title_snapshot: str
    architect_snapshot: Optional[str] = None
    location_snapshot: Optional[str] = None
    year_snapshot: Optional[int] = None
    source_url_snapshot: Optional[str] = None
    caption: Optional[str] = None
    tags: Optional[List[str]] = None
    added_from: Optional[Dict[str, Any]] = None


class TextBlockData(BaseModel):
    style: str  # h1, h2, body, quote
    text: str


class DividerBlockData(BaseModel):
    variant: str  # line, space-sm, space-lg


class BlockCreate(BaseModel):
    type: str  # reference, text, divider
    data: Dict[str, Any]
    position: Optional[float] = None


class BlockUpdate(BaseModel):
    data: Optional[Dict[str, Any]] = None
    position: Optional[float] = None


class BoardCreate(BaseModel):
    title: Optional[str] = "Untitled Board"
    subtitle: Optional[str] = None
    description: Optional[str] = None
    layout_preset: Optional[str] = "grid"
    page_format: Optional[str] = "web"


class BoardUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    description: Optional[str] = None
    cover_image_url: Optional[str] = None
    layout_preset: Optional[str] = None
    page_format: Optional[str] = None


class ReorderRequest(BaseModel):
    block_ids: List[str]


class BoardResponse(BaseModel):
    id: str
    title: str
    subtitle: Optional[str] = None
    description: Optional[str] = None
    cover_image_url: Optional[str] = None
    layout_preset: str
    page_format: str
    share_token: str
    blocks: List[Dict[str, Any]]
    created_at: str
    updated_at: str


class BoardListItem(BaseModel):
    id: str
    title: str
    subtitle: Optional[str] = None
    cover_image_url: Optional[str] = None
    block_count: int
    created_at: str
    updated_at: str


# ============ Utility Functions ============

def generate_id() -> str:
    """Generate a unique ID."""
    return str(uuid.uuid4())


def generate_share_token() -> str:
    """Generate a URL-safe share token."""
    chars = string.ascii_letters + string.digits
    # Remove confusing characters
    chars = chars.replace('l', '').replace('I', '').replace('O', '').replace('0', '')
    return ''.join(secrets.choice(chars) for _ in range(12))


def now_iso() -> str:
    """Get current ISO timestamp."""
    return datetime.now(timezone.utc).isoformat()


def board_row_to_dict(row: sqlite3.Row, blocks: List[Dict]) -> Dict:
    """Convert database row to response dict."""
    return {
        "id": row["id"],
        "title": row["title"],
        "subtitle": row["subtitle"],
        "description": row["description"],
        "cover_image_url": row["cover_image_url"],
        "layout_preset": row["layout_preset"],
        "page_format": row["page_format"],
        "share_token": row["share_token"],
        "blocks": blocks,
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def block_row_to_dict(row: sqlite3.Row) -> Dict:
    """Convert block row to dict."""
    return {
        "id": row["id"],
        "type": row["type"],
        "position": row["position"],
        "data": json.loads(row["data"]),
    }


# ============ API Endpoints ============

@router.post("/boards", response_model=BoardResponse)
async def create_board(body: BoardCreate):
    """Create a new board."""
    conn = get_db()
    cursor = conn.cursor()

    try:
        board_id = generate_id()
        share_token = generate_share_token()
        now = now_iso()

        cursor.execute("""
            INSERT INTO boards (id, title, subtitle, description, layout_preset, page_format, share_token, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            board_id,
            body.title,
            body.subtitle,
            body.description,
            body.layout_preset,
            body.page_format,
            share_token,
            now,
            now,
        ))

        conn.commit()

        return BoardResponse(
            id=board_id,
            title=body.title or "Untitled Board",
            subtitle=body.subtitle,
            description=body.description,
            cover_image_url=None,
            layout_preset=body.layout_preset or "grid",
            page_format=body.page_format or "web",
            share_token=share_token,
            blocks=[],
            created_at=now,
            updated_at=now,
        )

    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to create board: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/boards/{board_id}", response_model=BoardResponse)
async def get_board(board_id: str, token: Optional[str] = Query(None)):
    """Get a board by ID. Requires token for unlisted boards."""
    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM boards WHERE id = ?", (board_id,))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Board not found")

        # Get blocks
        cursor.execute("""
            SELECT * FROM blocks WHERE board_id = ? ORDER BY position
        """, (board_id,))
        block_rows = cursor.fetchall()
        blocks = [block_row_to_dict(r) for r in block_rows]

        return BoardResponse(**board_row_to_dict(row, blocks))

    finally:
        conn.close()


@router.patch("/boards/{board_id}", response_model=BoardResponse)
async def update_board(board_id: str, body: BoardUpdate):
    """Update board properties."""
    conn = get_db()
    cursor = conn.cursor()

    try:
        # Check board exists
        cursor.execute("SELECT * FROM boards WHERE id = ?", (board_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Board not found")

        # Build update query
        updates = []
        values = []
        if body.title is not None:
            updates.append("title = ?")
            values.append(body.title)
        if body.subtitle is not None:
            updates.append("subtitle = ?")
            values.append(body.subtitle)
        if body.description is not None:
            updates.append("description = ?")
            values.append(body.description)
        if body.cover_image_url is not None:
            updates.append("cover_image_url = ?")
            values.append(body.cover_image_url)
        if body.layout_preset is not None:
            updates.append("layout_preset = ?")
            values.append(body.layout_preset)
        if body.page_format is not None:
            updates.append("page_format = ?")
            values.append(body.page_format)

        if updates:
            updates.append("updated_at = ?")
            values.append(now_iso())
            values.append(board_id)

            cursor.execute(f"""
                UPDATE boards SET {', '.join(updates)} WHERE id = ?
            """, values)
            conn.commit()

        # Fetch updated board
        cursor.execute("SELECT * FROM boards WHERE id = ?", (board_id,))
        row = cursor.fetchone()

        cursor.execute("SELECT * FROM blocks WHERE board_id = ? ORDER BY position", (board_id,))
        blocks = [block_row_to_dict(r) for r in cursor.fetchall()]

        return BoardResponse(**board_row_to_dict(row, blocks))

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to update board: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.delete("/boards/{board_id}")
async def delete_board(board_id: str):
    """Delete a board and all its blocks."""
    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM blocks WHERE board_id = ?", (board_id,))
        cursor.execute("DELETE FROM boards WHERE id = ?", (board_id,))
        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Board not found")

        return {"ok": True}

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to delete board: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# ============ Block Endpoints ============

@router.post("/boards/{board_id}/blocks")
async def add_block(board_id: str, body: BlockCreate):
    """Add a block to a board."""
    conn = get_db()
    cursor = conn.cursor()

    try:
        # Check board exists
        cursor.execute("SELECT id FROM boards WHERE id = ?", (board_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Board not found")

        # Get max position
        cursor.execute("SELECT MAX(position) FROM blocks WHERE board_id = ?", (board_id,))
        max_pos = cursor.fetchone()[0] or 0
        position = body.position if body.position is not None else max_pos + 1

        block_id = generate_id()
        now = now_iso()

        cursor.execute("""
            INSERT INTO blocks (id, board_id, type, position, data, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            block_id,
            board_id,
            body.type,
            position,
            json.dumps(body.data),
            now,
        ))

        # Update board timestamp
        cursor.execute("UPDATE boards SET updated_at = ? WHERE id = ?", (now, board_id))

        # Update cover image if first reference block
        if body.type == "reference" and body.data.get("thumb_url_snapshot"):
            cursor.execute("SELECT cover_image_url FROM boards WHERE id = ?", (board_id,))
            if not cursor.fetchone()["cover_image_url"]:
                cursor.execute(
                    "UPDATE boards SET cover_image_url = ? WHERE id = ?",
                    (body.data["thumb_url_snapshot"], board_id)
                )

        conn.commit()

        return {
            "id": block_id,
            "type": body.type,
            "position": position,
            "data": body.data,
        }

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to add block: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.patch("/boards/{board_id}/blocks/{block_id}")
async def update_block(board_id: str, block_id: str, body: BlockUpdate):
    """Update a block."""
    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM blocks WHERE id = ? AND board_id = ?", (block_id, board_id))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Block not found")

        updates = []
        values = []

        if body.data is not None:
            # Merge with existing data
            existing_data = json.loads(row["data"])
            existing_data.update(body.data)
            updates.append("data = ?")
            values.append(json.dumps(existing_data))

        if body.position is not None:
            updates.append("position = ?")
            values.append(body.position)

        if updates:
            values.append(block_id)
            cursor.execute(f"""
                UPDATE blocks SET {', '.join(updates)} WHERE id = ?
            """, values)

            # Update board timestamp
            cursor.execute("UPDATE boards SET updated_at = ? WHERE id = ?", (now_iso(), board_id))
            conn.commit()

        # Fetch updated block
        cursor.execute("SELECT * FROM blocks WHERE id = ?", (block_id,))
        row = cursor.fetchone()
        return block_row_to_dict(row)

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to update block: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.delete("/boards/{board_id}/blocks/{block_id}")
async def delete_block(board_id: str, block_id: str):
    """Delete a block."""
    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM blocks WHERE id = ? AND board_id = ?", (block_id, board_id))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Block not found")

        cursor.execute("UPDATE boards SET updated_at = ? WHERE id = ?", (now_iso(), board_id))
        conn.commit()

        return {"ok": True}

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to delete block: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.post("/boards/{board_id}/reorder")
async def reorder_blocks(board_id: str, body: ReorderRequest):
    """Reorder blocks in a board."""
    conn = get_db()
    cursor = conn.cursor()

    try:
        # Update positions based on order in list
        for idx, block_id in enumerate(body.block_ids):
            cursor.execute("""
                UPDATE blocks SET position = ? WHERE id = ? AND board_id = ?
            """, (idx, block_id, board_id))

        cursor.execute("UPDATE boards SET updated_at = ? WHERE id = ?", (now_iso(), board_id))
        conn.commit()

        return {"ok": True}

    except Exception as e:
        conn.rollback()
        logger.error(f"Failed to reorder blocks: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# ============ Share Token Endpoint ============

@router.get("/b/{share_token}", response_model=BoardResponse)
async def get_board_by_token(share_token: str):
    """Get a board by its share token."""
    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM boards WHERE share_token = ?", (share_token,))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Board not found")

        cursor.execute("""
            SELECT * FROM blocks WHERE board_id = ? ORDER BY position
        """, (row["id"],))
        blocks = [block_row_to_dict(r) for r in cursor.fetchall()]

        return BoardResponse(**board_row_to_dict(row, blocks))

    finally:
        conn.close()


# ============ List Boards Endpoint ============

@router.get("/boards", response_model=List[BoardListItem])
async def list_boards(limit: int = 50, offset: int = 0):
    """List all boards."""
    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT b.*, COUNT(bl.id) as block_count
            FROM boards b
            LEFT JOIN blocks bl ON b.id = bl.board_id
            GROUP BY b.id
            ORDER BY b.updated_at DESC
            LIMIT ? OFFSET ?
        """, (limit, offset))

        boards = []
        for row in cursor.fetchall():
            boards.append(BoardListItem(
                id=row["id"],
                title=row["title"],
                subtitle=row["subtitle"],
                cover_image_url=row["cover_image_url"],
                block_count=row["block_count"],
                created_at=row["created_at"],
                updated_at=row["updated_at"],
            ))

        return boards

    finally:
        conn.close()


# ============ Export Endpoints ============

class ExportRequest(BaseModel):
    mode: Literal["long", "slides"] = "long"
    format: Literal["letter", "a4", "16:9"] = "letter"
    frontend_url: str = "http://localhost:5173"


class ExportResponse(BaseModel):
    ok: bool
    download_url: Optional[str] = None
    error: Optional[str] = None


@router.post("/boards/{board_id}/export", response_model=ExportResponse)
async def export_board(board_id: str, body: ExportRequest):
    """
    Export a board to PDF.
    
    This uses Playwright to render the print-optimized view and generate a PDF.
    """
    if not PLAYWRIGHT_AVAILABLE:
        return ExportResponse(
            ok=False,
            error="PDF export is not available. Playwright is not installed."
        )

    # Check board exists
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM boards WHERE id = ?", (board_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Board not found")
    finally:
        conn.close()

    try:
        pdf_path = await generate_pdf(
            board_id=board_id,
            frontend_url=body.frontend_url,
            mode=body.mode,
            format=body.format,
        )

        if pdf_path:
            filename = os.path.basename(pdf_path)
            return ExportResponse(
                ok=True,
                download_url=f"/exports/{filename}"
            )
        else:
            return ExportResponse(
                ok=False,
                error="Failed to generate PDF"
            )

    except Exception as e:
        logger.error(f"Export failed: {e}")
        return ExportResponse(
            ok=False,
            error=str(e)
        )


@router.get("/exports/{filename}")
async def download_export(filename: str):
    """Download an exported PDF file."""
    # Sanitize filename to prevent path traversal
    safe_filename = os.path.basename(filename)
    filepath = os.path.join(EXPORT_DIR, safe_filename)

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Export not found")

    return FileResponse(
        filepath,
        media_type="application/pdf",
        filename=safe_filename,
    )

