import { WAMessageStatus } from "@adiwajshing/baileys";
import express, { Request, Response, Express } from "express";
import { createJid } from "./helper";
import {
  GetConnection,
  GetSingleMessageQuery,
  MultipleSendMessagePayload,
  MultipleSendMessageResponse,
  SingleMessageDetailResponse,
  SingleMessageResponse,
  SingleSendMessagePayload,
} from "./types";
import { connectToWhatsApp } from "./whatsapp";

const app: Express = express();
const port: number = 4000;

app.use(express.json());

let waConnect = connectToWhatsApp();

/**
 * Nomor sample :
 * Azure : 6281316554098
 * Ardiansyah : 6289671113323
 */

let bulkList: SingleMessageResponse[] = [];

// untuk koneksi buka tutup trus gan

// endpoint sederhana untuk menampilkan teks 'Hello Express Node.js'
app.get("/connection", async (req: Request, res: Response) => {
  let response: GetConnection = {
    connection: "close",
  };
  switch (waConnect.state.connection) {
    case "close":
      response = {
        connection: "close",
        qr: waConnect.state.qr,
      };
      waConnect = connectToWhatsApp();
      break;
    case "open":
      response = {
        connection: "open",
      };
      break;
    case "connecting":
      response = {
        connection: "connecting",
      };
      break;
    default:
      break;
  }
  res.status(200).json(response);
});

app.post("/send", async (req: Request, res: Response) => {
  const { phone, message }: SingleSendMessagePayload = req.body;
  const sendMessage = await waConnect.sendMessage(createJid(phone), {
    text: message,
  });

  res.send({ messageId: sendMessage.key.id });
});

const sendBulkHandler = (
  phones: string[],
  message: string
): Promise<SingleMessageResponse[]> => {
  const send = phones.map(async (phone, idx) => {
    const execute = await waConnect.sendMessage(createJid(phone), {
      text: message,
    });

    return {
      phone,
      messageId: execute.key.id,
    };
  });

  return Promise.all(send);
};

app.post("/send-bulk", async (req: Request, res: Response) => {
  try {
    const { phones, message }: MultipleSendMessagePayload = req.body;
    const sendMessages = await sendBulkHandler(phones, message);

    let response: MultipleSendMessageResponse = {
      data: sendMessages,
    };

    bulkList = [...bulkList, ...response.data];

    res.send({ response });
  } catch (error) {
    console.log("err", error);
    res.send({ error });
  }
});

const getBulkInfo = async (
  data: SingleMessageResponse[]
): Promise<SingleMessageDetailResponse[]> => {
  const getMessages = data.map(async (item) => {
    const execute = await waConnect.loadMessageFromWA(
      createJid(item.phone),
      `${item.messageId}`
    );

    return {
      ...item,
      detail: {
        status: WAMessageStatus[execute.status],
        sendAt: execute.messageTimestamp,
        changeStatusAt: execute.messageC2STimestamp,
      },
    };
  });

  return Promise.all(getMessages);
};

app.get("/bulk-info", async (req, res) => {
  try {
    const getData = await getBulkInfo(bulkList);

    let response = {
      data: getData,
    };

    res.send(response);
  } catch (error) {
    console.log("err", error);
    res.send({ error });
  }
});

app.get("/message-info", async (req: Request, res: Response) => {
  const { query } = req;

  const { phone, messageId }: any = query;

  const getMessage = await waConnect.loadMessageFromWA(
    createJid(phone),
    messageId
  );

  console.log(getMessage.status);

  res.send({ phone, messageId, detail: getMessage });
});

// mulai server express
app.listen(port, () => {
  console.log(`[server] server dimulai di http://localhost:${port} ⚡`);
});
