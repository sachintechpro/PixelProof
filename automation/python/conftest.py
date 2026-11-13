"""Shared pytest browser-failure evidence for PixelProof automation."""
import re
from pathlib import Path
import pytest

@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()
    if report.when != "call" or not report.failed:
        return
    driver = item.funcargs.get("browser")
    if driver is None:
        return
    directory = Path("artifacts/selenium-screenshots")
    directory.mkdir(parents=True, exist_ok=True)
    safe = re.sub(r"[^A-Za-z0-9_-]", "_", item.name)
    driver.save_screenshot(str(directory / (safe + ".png")))
