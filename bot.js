// Karnataka Aquarium WhatsApp Bot – FINAL (Deep Pets + Accessories + Recommendations)
const { google } = require("googleapis");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const Groq = require("groq-sdk");
const auth = new google.auth.GoogleAuth({
  keyFile: "service-account.json", // name of your JSON file
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;


const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


const userState = {};
const userData = {};
const lastBotMessage = {};


function send(msg, user, text) {
  lastBotMessage[user] = text;
  return msg.reply(text);
}


const client = new Client({
  authStrategy: new LocalAuth({ clientId: "karnataka-aquarium-bot" }),
  puppeteer: { headless: true, args: ["--no-sandbox"] },
  markOnlineOnConnect: false,
});

client.on("qr", qr => qrcode.generate(qr, { small: true }));
client.on("ready", () => console.log("🐠 Karnataka Aquarium Bot Ready"));

async function petAI(q) {
  const r = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: q }],
  });
  return r.choices[0].message.content;
}
async function saveOrderToSheet(order) {
  const values = [[
    new Date().toLocaleString(),
    order.user,
    order.item,
    order.qty,
    order.address,
    order.type
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Sheet1!A:F",
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

client.on("message", async msg => {
  try {
    if (msg.fromMe) return;
    // ✅ DEFINE text FIRST
    const text = msg.body.trim().toLowerCase();
    const user = msg.from;

if (text.startsWith("pet")) {
  const question = text.replace(/^pet\s*/, "");
  if (!question) {
    return msg.reply(
      "🐾 You can ask me anything about your pet 😊\n\nExample:\npet why my turtle is not eating"
    );
  }

  const ai = await petAI(question);
  return msg.reply(ai);
}

    // ---------- MENU (GLOBAL RESET)
    if (text === "menu") {
      userState[user] = "MAIN_MENU";
      userData[user] = {};
      return send(msg, user,
`👋🏼 Hello and welcome to *Karnataka Aquarium* 🐠✨

What would you like to explore today?

1️⃣ Pets  
2️⃣ Accessories  
3️⃣ Recommendations`);
    }


    if (["hi", "hello", "start"].includes(text)) {
      userState[user] = "MAIN_MENU";
      userData[user] = {};
      return send(msg, user,
`👋🏼 Hello and welcome to *Karnataka Aquarium* 🐠✨

Please take your time 😊  
What would you like to explore today?

1️⃣ Pets  
2️⃣ Accessories  
3️⃣ Recommendations`);
    }


    if (userState[user] === "MAIN_MENU") {
      if (text === "1") {
        userState[user] = "PET_CATEGORY";
        return send(msg, user,
`🐶🐍🐠 Lovely choice!

What type of pets are you interested in?

1️⃣ Fish  
2️⃣ Reptiles  
3️⃣ Birds  
4️⃣ Small mammals`);
      }

      if (text === "2") {
        userState[user] = "ACCESSORY_CATEGORY";
        return send(msg, user,
`🧰 Great choice!

What are you shopping for?

1️⃣ Pet Food  
2️⃣ Lighting  
3️⃣ Tanks & Filters`);
      }

      if (text === "3") {
        userState[user] = "RECOMMEND_TYPE";
        return send(msg, user,
`⭐ Customer favourites right now!

Would you like recommendations for:
1️⃣ Pets  
2️⃣ Accessories`);
      }
    }


    if (userState[user] === "PET_CATEGORY" && text === "2") {
      userState[user] = "TURTLES";
      return send(msg, user,
`🐢 *Wonderful choice!*

Please choose from our available turtles:

1️⃣ Golden Thread Turtle  
2️⃣ Red Eared Slider  
3️⃣ RES Albino`);
    }

    if (userState[user] === "TURTLES") {
      const turtles = {
        "1": "Golden Thread Turtle",
        "2": "Red Eared Slider",
        "3": "RES Albino",
      };

      if (!turtles[text]) {
        await msg.reply("Oops 😅 I didn’t quite understand that.");
        return msg.reply(lastBotMessage[user]);
      }

      userData[user].item = turtles[text];
      userData[user].type = "Pet";
      userState[user] = "ASK_QTY";
      return send(msg, user,
`👍 Perfect!

How many units would you like?  
(Please enter numbers only 😊)`);
    }


    if (userState[user] === "ACCESSORY_CATEGORY") {
      userState[user] = "ACCESSORY_ITEMS";
      userData[user].accessoryCategory = text;
      return send(msg, user,
`🧰 Available options:

1️⃣ Premium Pet Food  
2️⃣ UVB & Heat Lighting  
3️⃣ Aquarium Tanks & Filters  

Reply with the number to continue`);
    }

    if (userState[user] === "ACCESSORY_ITEMS") {
      const accessories = {
        "1": "Premium Pet Food",
        "2": "UVB & Heat Lighting",
        "3": "Aquarium Tanks & Filters",
      };

      if (!accessories[text]) {
        await msg.reply("Please choose 1, 2, or 3 😊");
        return msg.reply(lastBotMessage[user]);
      }

      userData[user].item = accessories[text];
      userData[user].type = "Accessory";
      userState[user] = "ASK_QTY";
      return send(msg, user,
`👍 Great choice!

How many units would you like to order?  
(Numbers only 😊)`);
    }

    if (userState[user] === "RECOMMEND_TYPE") {
      userState[user] = "RECOMMEND_ITEMS";
      userData[user].recommendType = text === "1" ? "Pet" : "Accessory";

      return send(msg, user,
userData[user].recommendType === "Pet"
? `🐾 Recommended pets:

1️⃣ Red Eared Slider  
2️⃣ Guppies  
3️⃣ Budgies`
: `🧰 Recommended accessories:

1️⃣ Turtle Pellets  
2️⃣ UVB Lighting Kit  
3️⃣ Aquarium Filter`);
    }

    if (userState[user] === "RECOMMEND_ITEMS") {
      const petRecs = {
        "1": "Red Eared Slider",
        "2": "Guppies",
        "3": "Budgies",
      };

      const accRecs = {
        "1": "Turtle Pellets",
        "2": "UVB Lighting Kit",
        "3": "Aquarium Filter",
      };

      const chosen =
        userData[user].recommendType === "Pet"
          ? petRecs[text]
          : accRecs[text];

      if (!chosen) {
        await msg.reply("Please choose 1, 2, or 3 😊");
        return msg.reply(lastBotMessage[user]);
      }

      userData[user].item = chosen;
      userData[user].type = userData[user].recommendType;
      userState[user] = "ASK_QTY";
      return send(msg, user,
`✨ Excellent choice!

How many units would you like?  
(Numbers only 😊)`);
    }


    if (userState[user] === "ASK_QTY") {
      if (!/^\d+$/.test(text)) {
        await msg.reply("Please enter a valid number only 😊");
        return msg.reply(lastBotMessage[user]);
      }

      userData[user].qty = parseInt(text, 10);
      userState[user] = "ASK_ADDRESS";
      return send(msg, user,
`📍 Thank you!

Please share the delivery location or address 🚚`);
    }

    if (userState[user] === "ASK_ADDRESS") {
      userData[user].address = msg.body;
      userState[user] = "CONFIRM";
      return send(msg, user,
`🧾 *Order Summary*

🛒 Item: ${userData[user].item}  
🔢 Quantity: ${userData[user].qty}  
📍 Address: ${userData[user].address}

Reply *YES* to confirm  
Reply *NO* to make changes`);
    }

    if (userState[user] === "CONFIRM") {
      if (text === "yes") {
        await saveOrderToSheet({
  user,
  item: userData[user].item,
  qty: userData[user].qty,
  address: userData[user].address,
  type: userData[user].type || "N/A",
});
        userState[user] = null;
        return msg.reply(
`🎉 *Order confirmed!*

Our team will contact you shortly for  
📞 payment and 🚚 delivery.

Thank you for choosing *Karnataka Aquarium* 🐠🐾`);
      }

      if (text === "no") {
        userState[user] = "MAIN_MENU";
        return send(msg, user,
`No worries 😊

What would you like to explore next?

1️⃣ Pets  
2️⃣ Accessories  
3️⃣ Recommendations`);
      }
    }


    if (lastBotMessage[user]) {
      await msg.reply("Oops 😅 I didn’t quite understand that.");
      return msg.reply(lastBotMessage[user]);
    }

  } catch (e) {
    console.error(e);
    msg.reply("⚠️ Something went wrong. Please try again.");
  }
});

console.log("Starting Karnataka Aquarium bot...");
client.initialize();
