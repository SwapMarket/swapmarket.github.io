import { test } from "@playwright/test";

import dict from "../../src/i18n/i18n";

// RSK is disabled and RBTC pairs are removed from this regtest's boltz.conf
// (see cb1f8d31, f6c33ce0 - contracts aren't deployed in this regtest
// commit), so there's nothing for the app to connect an EVM wallet for and
// the "Connect wallet" button stays disabled. Re-enable once RSK is back
test.describe.skip("EVM no browser wallet", () => {
    test("should show when no browser wallet is detected", async ({ page }) => {
        await page.goto("/");

        await page
            .locator(
                "div:nth-child(3) > .asset-wrap > .asset > .asset-selection",
            )
            .click();
        await page.getByTestId("select-RBTC").click();

        await page
            .getByRole("button", { name: dict.en.connect_wallet })
            .click();

        // Click it to make sure it exists
        await page
            .getByRole("heading", { name: dict.en.no_browser_wallet })
            .click();
    });
});
