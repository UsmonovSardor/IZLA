import { Injectable, Logger } from '@nestjs/common';
import { env } from '../../config/env';

/**
 * Eskiz.uz SMS klienti. Token xotirada keshlanadi, 401'da qayta login.
 * Kredensiallar bo'lmasa — log rejimi (xabar konsolga chiqadi, jo'natilmaydi).
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger('SMS');
  private token: string | null = null;

  get enabled(): boolean {
    return Boolean(env.ESKIZ_EMAIL && env.ESKIZ_PASSWORD);
  }

  /** +998901234567 / 998... / 90-123-45-67 → 998901234567 */
  private normalize(phone: string): string | null {
    let d = phone.replace(/\D/g, '');
    if (d.length === 9) d = '998' + d; // 901234567
    if (d.startsWith('998') && d.length === 12) return d;
    return null;
  }

  private async login(): Promise<string | null> {
    try {
      const body = new URLSearchParams({ email: env.ESKIZ_EMAIL, password: env.ESKIZ_PASSWORD });
      const res = await fetch(`${env.ESKIZ_BASE}/auth/login`, { method: 'POST', body });
      const json = (await res.json()) as { data?: { token?: string } };
      this.token = json?.data?.token ?? null;
      return this.token;
    } catch (e) {
      this.logger.error(`Eskiz login xato: ${(e as Error).message}`);
      return null;
    }
  }

  /**
   * SMS jo'natadi. Best-effort — xatoni yutadi (chaqiruvchini bloklamaydi).
   * @returns jo'natilgan-jo'natilmagan (log rejimida ham true qaytadi).
   */
  async send(phone: string, message: string): Promise<boolean> {
    const mobile = this.normalize(phone);
    if (!mobile) {
      this.logger.warn(`SMS raqam yaroqsiz: ${phone}`);
      return false;
    }
    if (!this.enabled) {
      this.logger.log(`[SMS log rejimi] ${mobile}: ${message}`);
      return true;
    }
    try {
      if (!this.token) await this.login();
      const doSend = async () => {
        const body = new URLSearchParams({ mobile_phone: mobile, message, from: env.ESKIZ_FROM });
        return fetch(`${env.ESKIZ_BASE}/message/sms/send`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.token}` },
          body,
        });
      };
      let res = await doSend();
      if (res.status === 401) {
        await this.login();
        res = await doSend();
      }
      if (!res.ok) {
        this.logger.error(`Eskiz send HTTP ${res.status}: ${await res.text()}`);
        return false;
      }
      return true;
    } catch (e) {
      this.logger.error(`Eskiz send xato: ${(e as Error).message}`);
      return false;
    }
  }
}
