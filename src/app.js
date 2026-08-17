require("dotenv").config();

const { chromium } = require("playwright");
const sendTelegram = require("./telegram");

function parseAmount(text) {
    return Number(
        String(text).replace(/[₹,\s]/g, "")
    );
}

const LIMIT = parseAmount(process.env.LIMIT || "1000000");

if (Number.isNaN(LIMIT)) {
    console.error("❌ LIMIT env var is not a valid number:", process.env.LIMIT);
    process.exit(1);
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


        await page.locator('input[name="pin"]').fill(process.env.PIN, {
            timeout: 60000
        });
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

        const p1Low = payoutP1 < LIMIT;
        const r1Low = payoutR1 < LIMIT;

        console.log(p1Low ? "🔴 PayoutP1 LOW" : "🟢 PayoutP1 Healthy");
        console.log(r1Low ? "🔴 PayoutR1 LOW" : "🟢 PayoutR1 Healthy");

        if (p1Low || r1Low) {

            await sendTelegram(
                `🚨 SKY8PAY BALANCE ALERT

${p1Low ? "🔴" : "🟢"} PayoutP1: ₹ ${payoutP1.toLocaleString("en-IN")}
${r1Low ? "🔴" : "🟢"} PayoutR1: ₹ ${payoutR1.toLocaleString("en-IN")}

Threshold:
₹ ${LIMIT.toLocaleString("en-IN")}`
            );

        } else {

            console.log("✅ Both balances healthy, no alert sent.");

        }

    }
    catch (err) {

        console.error("❌ SKY8PAY Balance Monitor Error:", err.message);

        await page.screenshot({
            path: "error.png",
            fullPage: true
        });

    }
    finally {

        await browser.close();

    }

})();