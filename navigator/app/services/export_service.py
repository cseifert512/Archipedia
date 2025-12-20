"""
Export Service - Generate PDFs from boards using Playwright.
"""
import os
import asyncio
import logging
from typing import Optional, Literal
from datetime import datetime
import uuid

from ..config import settings

logger = logging.getLogger(__name__)

# Export storage directory
EXPORT_DIR = os.path.join(settings.data_dir, "exports")
os.makedirs(EXPORT_DIR, exist_ok=True)

# Check if Playwright is available
PLAYWRIGHT_AVAILABLE = False
try:
    from playwright.async_api import async_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    logger.warning("Playwright not available, PDF export disabled")


async def generate_pdf(
    board_id: str,
    frontend_url: str,
    mode: Literal["long", "slides"] = "long",
    format: Literal["letter", "a4", "16:9"] = "letter",
) -> Optional[str]:
    """
    Generate a PDF from a board using Playwright.
    
    Args:
        board_id: The board ID to export
        frontend_url: Base URL of the frontend (e.g., http://localhost:5173)
        mode: Export mode - 'long' for continuous document, 'slides' for 16:9 slides
        format: Page format - 'letter', 'a4', or '16:9'
    
    Returns:
        Path to the generated PDF file, or None if export failed
    """
    if not PLAYWRIGHT_AVAILABLE:
        logger.error("Playwright not available for PDF export")
        return None

    print_url = f"{frontend_url}/boards/{board_id}/print?mode={mode}&format={format}"
    output_filename = f"board_{board_id}_{mode}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    output_path = os.path.join(EXPORT_DIR, output_filename)

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()

            # Load the print page
            await page.goto(print_url, wait_until="networkidle")

            # Wait for fonts and images to load
            await page.wait_for_timeout(2000)

            # Configure PDF options based on format
            pdf_options = {
                "path": output_path,
                "print_background": True,
                "margin": {
                    "top": "0.5in",
                    "bottom": "0.5in",
                    "left": "0.5in",
                    "right": "0.5in",
                },
            }

            if format == "letter":
                pdf_options["format"] = "Letter"
            elif format == "a4":
                pdf_options["format"] = "A4"
            elif format == "16:9" or mode == "slides":
                # 16:9 slides at 1280x720
                pdf_options["width"] = "1280px"
                pdf_options["height"] = "720px"
                pdf_options["margin"] = {"top": "0", "bottom": "0", "left": "0", "right": "0"}

            await page.pdf(**pdf_options)
            await browser.close()

        logger.info(f"Generated PDF: {output_path}")
        return output_path

    except Exception as e:
        logger.error(f"Failed to generate PDF: {e}")
        return None


def get_export_url(filename: str) -> str:
    """Get the URL for downloading an exported file."""
    return f"/exports/{filename}"


def cleanup_old_exports(max_age_hours: int = 24):
    """Remove exports older than max_age_hours."""
    import time
    
    now = time.time()
    max_age_seconds = max_age_hours * 3600

    for filename in os.listdir(EXPORT_DIR):
        filepath = os.path.join(EXPORT_DIR, filename)
        if os.path.isfile(filepath):
            file_age = now - os.path.getmtime(filepath)
            if file_age > max_age_seconds:
                try:
                    os.remove(filepath)
                    logger.info(f"Removed old export: {filename}")
                except Exception as e:
                    logger.warning(f"Failed to remove old export {filename}: {e}")

