"""PixelProof browser and API QA evidence.

Tests use a local, isolated demo server. Never point mutating tests at the
public shared Render environment. Sample data and payment tokens only.
"""
import os
import re
from pathlib import Path

import pytest
import requests
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait, Select

BASE = os.environ.get("PIXELPROOF_BASE_URL", "http://127.0.0.1:3000").rstrip("/")


@pytest.fixture
def browser():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1280,900")
    driver = webdriver.Chrome(options=options)
    driver.set_page_load_timeout(30)
    yield driver
    driver.quit()


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()
    if report.when == "call" and report.failed:
        driver = item.funcargs.get("browser")
        if driver:
            out = Path("artifacts/selenium-screenshots")
            out.mkdir(parents=True, exist_ok=True)
            driver.save_screenshot(str(out / (re.sub(r"[^a-zA-Z0-9_-]", "_", item.name) + ".png")))


def wait_for(browser, locator, timeout=20):
    return WebDriverWait(browser, timeout).until(EC.presence_of_element_located(locator))


def test_api_health_and_catalog_have_real_responses():
    """Backend + contract smoke: inspect actual HTTP status and payload."""
    health = requests.get(BASE + "/api/health", timeout=15)
    assert health.status_code == 200, health.text
    assert health.json().get("ok") is True

    catalog = requests.get(BASE + "/api/products", timeout=15)
    assert catalog.status_code == 200, catalog.text
    products = catalog.json().get("products", [])
    assert isinstance(products, list) and len(products) > 0
    assert all("id" in p and "price" in p for p in products)


def test_admin_requires_authenticated_session():
    """Negative API security + browser login page."""
    denied = requests.get(BASE + "/api/admin/overview", timeout=15)
    assert denied.status_code == 401, denied.text

    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    with webdriver.Chrome(options=options) as driver:
        driver.get(BASE + "/#/admin")
        form = wait_for(driver, (By.ID, "admin-login-form"))
        assert form.is_displayed()
        assert "demo" in driver.page_source.lower()


def test_storefront_cart_journey(browser):
    """Genuine UI journey: storefront to cart, no sample order created."""
    browser.get(BASE + "/#/store")
    selector = '.product-card .small-add:not([disabled])'
    add = WebDriverWait(browser, 20).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, selector))
    )
    browser.execute_script('arguments[0].scrollIntoView({block:"center",behavior:"instant"});', add)
    add = WebDriverWait(browser, 10).until(EC.element_to_be_clickable((By.CSS_SELECTOR, selector)))
    add.click()
    WebDriverWait(browser, 10).until(
        lambda d: int(d.find_element(By.CSS_SELECTOR, ".count-bubble").text or "0") >= 1
    )
    browser.find_element(By.CSS_SELECTOR, '[data-action="cart"]').click()
    drawer = wait_for(browser, (By.CSS_SELECTOR, ".drawer"))
    assert drawer.is_displayed()
    assert "Subtotal" in drawer.text


def test_quality_workbench_exposes_traceable_cases(browser):
    """Real DOM assertions for six QA tabs, case design and preserved runner."""
    browser.get(BASE + "/#/quality")
    lab = wait_for(browser, (By.ID, "qa-lifecycle"))
    assert lab.is_displayed()
    assert len(browser.find_elements(By.CSS_SELECTOR, "#qa-lifecycle [data-ql-tab]")) == 6
    assert browser.find_elements(By.CSS_SELECTOR, "[data-qa-all]")
    browser.find_element(By.CSS_SELECTOR, '[data-ql-tab="cases"]').click()
    assert "TC-03" in browser.find_element(By.ID, "ql-body").text
    browser.find_element(By.CSS_SELECTOR, '[data-ql-tab="manual"]').click()
    assert browser.find_elements(By.ID, "ql-manual-form")
    assert "Not run" in browser.find_element(By.ID, "ql-body").text


def test_mobile_qa_tabs_remain_in_page(browser):
    """Small-screen usability: tab controls do not extend beyond viewport."""
    browser.set_window_size(390, 844)
    browser.get(BASE + "/#/quality")
    wait_for(browser, (By.ID, "qa-lifecycle"))
    tabs = browser.find_elements(By.CSS_SELECTOR, "#qa-lifecycle [data-ql-tab]")
    assert len(tabs) == 6
    width = browser.execute_script("return document.documentElement.clientWidth")
    for tab in tabs:
        rect = tab.rect
        assert rect["x"] >= -2, (tab.text, rect)
        assert rect["x"] + rect["width"] <= width + 2, (tab.text, rect, width)


def test_manual_execution_is_recorded_not_assumed(browser):
    """Write a genuine browser-local QA record and inspect reporting evidence."""
    browser.get(BASE + "/#/quality")
    wait_for(browser, (By.ID, "qa-lifecycle"))
    browser.find_element(By.CSS_SELECTOR, '[data-ql-tab="manual"]').click()
    form = wait_for(browser, (By.ID, "ql-manual-form"))
    Select(form.find_element(By.NAME, "status")).select_by_visible_text("Passed")
    form.find_element(By.NAME, "actual").send_keys(
        "Test-only manual verdict: inspected requirements and expected outcome."
    )
    form.find_element(By.CSS_SELECTOR, 'button[type="submit"]').click()
    WebDriverWait(browser, 10).until(
        lambda d: "Manual execution recorded" in d.find_element(By.ID, "ql-notice").text
    )
    browser.find_element(By.CSS_SELECTOR, '[data-ql-tab="reports"]').click()
    report = browser.find_element(By.ID, "ql-body").text
    assert "TC-03" in report
    assert "Passed" in report
    assert "tester-entered" in report.lower()
