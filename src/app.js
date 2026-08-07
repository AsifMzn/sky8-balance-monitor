require("dotenv").config();

const { chromium } = require("playwright");
const sendTelegram = require("./telegram");
const { loadState, saveState } = require("./state");

const LIMIT = Number(process.env.LIMIT || 1000000);

function parseAmount(text) {
    return Number(
        text.replace(/[₹,\s]/g, "")
    );
}

(async () => {

    const browser = await chromium.launch({
        headless: true, // Change to false if you want to see the browser
        slowMo: 100
    });

    const page = await browser.newPage();

    try {

        console.log("🌐 Opening Website...");

        await page.goto(process.env.URL, {
            waitUntil: "networkidle"
        });

        console.log("🔑 Entering PIN...");

        await page.locator('input[name="pin"]').fill(process.env.PIN);

        console.log("🖱 Clicking Get Data...");

        await page.locator("button.btn-success").click();

        await page.waitForTimeout(2000);

        const table = page.locator("table").nth(1);

        const rows = table.locator("tr");

        const balances = {};

        const rowCount = await rows.count();

        for (let i = 1; i < rowCount; i++) {

            const cols = rows.nth(i).locator("td");

            if (await cols.count() !== 2)
                continue;

            const name = (await cols.nth(0).innerText()).trim();

            const value = (await cols.nth(1).innerText()).trim();

            balances[name] = value;
        }

        const payoutP1 = parseAmount(balances["PayoutP1"]);

        const payoutR1 = parseAmount(balances["PayoutR1"]);

        console.log("");
        console.log("===========================");
        console.log("CURRENT BALANCES");
        console.log("===========================");

        console.log("PayoutP1 :", payoutP1);

        console.log("PayoutR1 :", payoutR1);

        let state = loadState();

        // ---------------- P1 ----------------

        if (payoutP1 < LIMIT) {

            console.log("🔴 PayoutP1 LOW");

            if (!state.P1) {

                await sendTelegram(
                    `🚨 SKY8 BALANCE ALERT

🔴 PayoutP1

Current Balance:
₹ ${payoutP1.toLocaleString("en-IN")}

Threshold:
₹ ${LIMIT.toLocaleString("en-IN")}`
                );

                state.P1 = true;

            }

        } else {

            console.log("🟢 PayoutP1 Healthy");

            if (state.P1) {

                await sendTelegram(
                    `✅ SKY8 BALANCE RECOVERED

🟢 PayoutP1

Current Balance:
₹ ${payoutP1.toLocaleString("en-IN")}`
                );

                state.P1 = false;

            }

        }

        // ---------------- R1 ----------------

        if (payoutR1 < LIMIT) {

            console.log("🔴 PayoutR1 LOW");

            if (!state.R1) {

                await sendTelegram(
                    `🚨 SKY8 BALANCE ALERT

🔴 PayoutR1

Current Balance:
₹ ${payoutR1.toLocaleString("en-IN")}

Threshold:
₹ ${LIMIT.toLocaleString("en-IN")}`
                );

                state.R1 = true;

            }

        } else {

            console.log("🟢 PayoutR1 Healthy");

            if (state.R1) {

                await sendTelegram(
                    `✅ SKY8 BALANCE RECOVERED

🟢 PayoutR1

Current Balance:
₹ ${payoutR1.toLocaleString("en-IN")}`
                );

                state.R1 = false;

            }

        }

        saveState(state);

    }
    catch (err) {

        console.error(err);

        await page.screenshot({
            path: "error.png",
            fullPage: true
        });

        await sendTelegram(
            `❌ SKY8 Balance Monitor Failed

${err.message}`
        );

    }
    finally {

        await browser.close();

    }

})();