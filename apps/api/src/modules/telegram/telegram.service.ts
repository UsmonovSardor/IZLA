import { Injectable, Logger } from '@nestjs/common';
import { env } from '../../config/env';

const API = (method: string) => `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`;
const MINIAPP_URL = process.env.TELEGRAM_MINIAPP_URL ?? 'http://localhost:3000/tg';

interface TgUpdate {
  message?: { chat: { id: number }; text?: string; from?: { first_name?: string } };
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger('Telegram');

  async call(method: string, body: Record<string, unknown>) {
    if (!env.TELEGRAM_BOT_TOKEN) return { ok: false, error: 'no token' };
    const res = await fetch(API(method), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  // Telegram webhook update'ini qayta ishlaydi
  async handleUpdate(update: TgUpdate) {
    const msg = update.message;
    if (!msg?.text) return { ok: true };

    if (msg.text.startsWith('/start')) {
      const name = msg.from?.first_name ?? 'do‘st';
      await this.call('sendMessage', {
        chat_id: msg.chat.id,
        text: `Assalomu alaykum, ${name}! 👋\n\nIzla.uz — barcha xizmatlar bitta joyda. Klinika, salon, restoran, uy-joy… qidiring va navbatsiz bron qiling.\n\nQuyidagi tugma orqali ilovani oching 👇`,
        reply_markup: {
          inline_keyboard: [[{ text: '🔎 Izla ochish', web_app: { url: MINIAPP_URL } }]],
        },
      });
    }
    return { ok: true };
  }

  // Deploy'dan keyin bir marta chaqiriladi: webhook + menu tugma o'rnatish
  async setup(publicApiUrl: string) {
    const webhook = await this.call('setWebhook', { url: `${publicApiUrl}/telegram/webhook` });
    const menu = await this.call('setChatMenuButton', {
      menu_button: { type: 'web_app', text: 'Izla', web_app: { url: MINIAPP_URL } },
    });
    this.logger.log(`Webhook: ${JSON.stringify(webhook)} | Menu: ${JSON.stringify(menu)}`);
    return { webhook, menu };
  }
}
