import {
  WAConnectionState,
  WAMessageStatus,
  WAProto,
} from "@adiwajshing/baileys";

export interface GetConnection {
  connection: WAConnectionState;
  qr?: string | undefined;
}

export interface SingleSendMessagePayload {
  phone: string;
  message: string;
}

export interface MultipleSendMessagePayload {
  phones: string[];
  message: string;
}

export interface SingleMessageResponse {
  phone: string;
  messageId: string | null | undefined;
}

export interface SingleMessageDetailResponse extends SingleMessageResponse {
  detail: {
    status: string;
    sendAt: number | Long.Long;
    changeStatusAt: number | Long.Long;
  };
}

export interface MultipleSendMessageResponse {
  data: SingleMessageResponse[];
}

export interface GetSingleMessageQuery {
  phone: string;
  messageId: string;
}
