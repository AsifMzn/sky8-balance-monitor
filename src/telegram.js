require("dotenv").config();

const axios = require("axios");

async function sendTelegram(message) {
    try {

        await axios.post(
            `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
            {
                chat_id: process.env.CHAT_ID,
                text: message,
                parse_mode: "HTML"
            }
        );

        console.log("✅ Telegram Message Sent");

    } catch (err) {

        console.log("❌ Telegram Error");

        if (err.response) {
            console.log(err.response.data);
        } else {
            console.log(err.message);
        }
    }
}

module.exports = sendTelegram;