# Playwright MCP Server

Official browser automation for testing and web scraping.

## Installation

```bash
npx gicm-stack add mcp/playwright
```

## Features

- Web page navigation
- Screenshot capture
- Form filling
- JavaScript execution
- E2E testing
- dApp UI testing

## Usage

```javascript
// Navigate and screenshot
await page.goto('https://app.uniswap.org')
await page.screenshot({ path: 'uniswap.png' })

// Test wallet connection
await page.click('[data-testid="connect-wallet"]')
await page.waitForSelector('.wallet-modal')
```

## Tools

- `playwright_navigate` - Go to URL
- `playwright_screenshot` - Capture page
- `playwright_click` - Click element
- `playwright_fill` - Fill form

## GitHub

https://github.com/microsoft/playwright-mcp

---

**Version:** 1.0.0
