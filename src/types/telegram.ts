export type TelegramUser = {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: true;
  added_to_attachment_menu?: true;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
  can_connect_to_business?: boolean;
  has_main_web_app?: boolean;
  has_topics_enabled?: boolean;
  allows_users_to_create_topics?: boolean;
  can_manage_bots?: boolean;
  [key: string]: unknown;
};

export type TelegramChat = {
  id: number;
  type: "private" | "group" | "supergroup" | "channel" | string;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_forum?: true;
  is_direct_messages?: true;
  [key: string]: unknown;
};

export type TelegramMessage = {
  message_id: number;
  message_thread_id?: number;
  from?: TelegramUser;
  sender_chat?: TelegramChat;
  date: number;
  chat: TelegramChat;
  text?: string;
  [key: string]: unknown;
};

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
  business_message?: TelegramMessage;
  edited_business_message?: TelegramMessage;
  [key: string]: unknown;
};

export type TelegramGetUpdatesResponse =
  | {
      ok: true;
      result: TelegramUpdate[];
    }
  | {
      ok: false;
      description?: string;
      error_code?: number;
      parameters?: Record<string, unknown>;
    };

export type TelegramSendMessageResponse =
  | {
      ok: true;
      result: unknown;
    }
  | {
      ok: false;
      description?: string;
      error_code?: number;
      parameters?: Record<string, unknown>;
    };
