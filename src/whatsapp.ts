import P from "pino";
import {
  DisconnectReason,
  makeWALegacySocket,
  makeInMemoryStore,
  useSingleFileLegacyAuthState,
} from "@adiwajshing/baileys";
import { Boom } from "@hapi/boom";

const store = makeInMemoryStore({
  logger: P().child({ level: "debug", stream: "store" }),
});
store.readFromFile("./baileys_store.json");
// save every 10s
setInterval(() => {
  store.writeToFile("./baileys_store.json");
}, 10_000);

const { state, saveState } = useSingleFileLegacyAuthState("./auth_info.json");

export function connectToWhatsApp() {
  const sock = makeWALegacySocket({
    // logger: P({ level: "debug" }),
    printQRInTerminal: true,
    auth: state,
  });

  store.bind(sock.ev);

  // listen for when the auth credentials is updated
  sock.ev.on("creds.update", saveState);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      // reconnect if not logged out
      if (
        (lastDisconnect?.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut
      ) {
        connectToWhatsApp();
      } else {
        console.log("connection closed");
      }
    }

    console.log("connection update", update);
    // if (connection === "open") {
    //   const send = await sock.sendMessage("6281316554098@s.whatsapp.net", {
    //     text: "cek spam lagi bang hehe",
    //   });
    //   console.log("send", send.key.id);
    // }
  });

  // sock.ev.on("chats.set", ({ chats, isLatest }) => {
  //   console.log("cc", chats);
  // });

  // sock.ev.on("messages.upsert", async (m) => {
  //   console.log(JSON.stringify(m, undefined, 2));

  //   console.log("replying to", m.messages[0].key.remoteJid);
  //   await sock.sendMessage(m.messages[0].key.remoteJid!, {
  //     text: "Hello there!",
  //   });
  // });
  return sock;
}
// run in main file
