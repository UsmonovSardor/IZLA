import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env';
import { PrismaService } from '../../prisma/prisma.service';
import { VendorsService } from '../vendors/vendors.service';
import { localizedName, type Lang } from '../../common/i18n';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/** Frontend'ga qaytariladigan javob: matn + topilgan joylar + qo'llangan filtrlar + to'liq qidiruv havolasi. */
export interface AssistantReply {
  reply: string;
  vendors: Awaited<ReturnType<VendorsService['list']>>;
  filters: SearchFilters | null;
  searchUrl: string | null;
}

interface SearchFilters {
  q?: string;
  category?: string;
  district?: string;
  priceMin?: number;
  priceMax?: number;
  openNow?: boolean;
  minRating?: number;
  verified?: boolean;
  sort?: 'rating' | 'distance';
}

const SYSTEM_LANG_NOTE: Record<Lang, string> = {
  uz: "Foydalanuvchi bilan O'ZBEK tilida gaplash.",
  ru: 'Общайся с пользователем на РУССКОМ языке.',
  en: 'Talk to the user in ENGLISH.',
};

@Injectable()
export class AssistantService {
  private readonly client: Anthropic | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly vendors: VendorsService,
  ) {
    this.client = env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null;
  }

  get enabled(): boolean {
    return this.client != null;
  }

  /** Joriy kategoriya (slug→nom) va tumanlar ro'yxatini bazadan yuklaydi — tizim promti aniq qolishi uchun. */
  private async catalog(lang: Lang): Promise<{ categories: Array<{ slug: string; name: string }>; districts: string[] }> {
    const [cats, districtsRaw] = await Promise.all([
      this.prisma.category.findMany({
        select: { slug: true, name: true, nameRu: true, nameEn: true },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.vendor.findMany({
        where: { status: 'ACTIVE', district: { not: null } },
        select: { district: true },
        distinct: ['district'],
      }),
    ]);
    return {
      categories: cats.map((c) => ({ slug: c.slug, name: localizedName(c, lang) })),
      districts: districtsRaw.map((d) => d.district!).filter(Boolean).sort(),
    };
  }

  private tool(): Anthropic.Tool {
    return {
      name: 'search_vendors',
      description:
        "Izla katalogidan joy/xizmat qidiradi. Foydalanuvchi so'rovidagi shartlarni (kategoriya, tuman, narx, ish vaqti, reyting) mos filtrlarga aylantirib chaqir. Kamida bitta filtr yoki q berilishi kerak.",
      input_schema: {
        type: 'object',
        properties: {
          q: { type: 'string', description: 'Erkin matnli kalit (nom yoki xizmat, masalan "plomba", "massaj"). Kategoriya slug mos kelsa q bermay category ishlat.' },
          category: { type: 'string', description: 'Kategoriya slug — faqat berilgan ro\'yxatdan.' },
          district: { type: 'string', description: 'Toshkent tumani — faqat berilgan ro\'yxatdan (aniq yozilishi bilan).' },
          priceMin: { type: 'number', description: "Minimal narx (so'm)." },
          priceMax: { type: 'number', description: "Maksimal narx (so'm). \"arzon\" so'ralsa mos qiymat qo'y." },
          openNow: { type: 'boolean', description: 'Faqat hozir ochiq joylar.' },
          minRating: { type: 'number', description: 'Minimal reyting: 4 yoki 4.5.' },
          verified: { type: 'boolean', description: 'Faqat tasdiqlangan joylar.' },
          sort: { type: 'string', enum: ['rating', 'distance'], description: 'Saralash: reyting bo\'yicha.' },
        },
      },
    };
  }

  private buildSearchUrl(f: SearchFilters): string {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(f)) {
      if (v != null && v !== '') p.set(k, String(v));
    }
    const qs = p.toString();
    return qs ? `/qidiruv?${qs}` : '/qidiruv';
  }

  async chat(turns: ChatTurn[], lang: Lang = 'uz'): Promise<AssistantReply> {
    if (!this.client) {
      throw new ServiceUnavailableException('AI yordamchi hozircha o\'chiq (kalit sozlanmagan).');
    }

    const { categories, districts } = await this.catalog(lang);
    const catLines = categories.map((c) => `- ${c.slug} — ${c.name}`).join('\n');

    const system = [
      "Sen — Izla.uz platformasining AI yordamchisisan. Izla — O'zbekiston uchun ko'p-vendorli xizmatlar platformasi (klinikalar, go'zallik, restoran, fitnes, avto va h.k.), onlayn bron va to'lov bilan.",
      SYSTEM_LANG_NOTE[lang],
      'VAZIFANG: foydalanuvchiga kerakli joy/xizmatni topishga yordam berish. Joy qidirish kerak bo\'lsa — HAR DOIM search_vendors tool\'ini chaqir, o\'zingdan joy nomi to\'qib chiqarma.',
      'Faqat quyidagi kategoriya sluglaridan foydalan:',
      catLines,
      `Mavjud tumanlar: ${districts.join(', ')}.`,
      'QOIDALAR: qisqa va samimiy javob ber. Natijalarni tool qaytargandan keyin 1-2 jumlada xulosala — kartalar alohida ko\'rsatiladi, ularni qayta sanab chiqma. Agar hech narsa topilmasa, filtrlarni yumshatishni taklif qil. Salomlashuv yoki umumiy savolga qisqa javob ber va nima qila olishingni ayt (masalan: "Chilonzorda hozir ochiq stomatologiya toping").',
    ].join('\n');

    const messages: Anthropic.MessageParam[] = turns.map((t) => ({ role: t.role, content: t.content }));

    let vendors: AssistantReply['vendors'] = [];
    let filters: SearchFilters | null = null;

    // Tool-use tsikli — Claude filtrlarni tanlaydi, biz mavjud qidiruvni ishga tushiramiz.
    for (let step = 0; step < 4; step++) {
      const resp = await this.client.messages.create({
        model: env.ASSISTANT_MODEL,
        max_tokens: 1024,
        output_config: { effort: 'low' },
        system,
        tools: [this.tool()],
        messages,
      });

      if (resp.stop_reason === 'refusal') {
        return { reply: this.fallbackText(lang), vendors, filters, searchUrl: null };
      }

      if (resp.stop_reason !== 'tool_use') {
        const reply = resp.content
          .filter((b): b is Anthropic.TextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('\n')
          .trim();
        return {
          reply: reply || this.fallbackText(lang),
          vendors,
          filters,
          searchUrl: filters ? this.buildSearchUrl(filters) : null,
        };
      }

      messages.push({ role: 'assistant', content: resp.content });
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of resp.content) {
        if (block.type !== 'tool_use' || block.name !== 'search_vendors') continue;
        const input = (block.input ?? {}) as SearchFilters;
        filters = input;
        const found = await this.vendors.list({
          q: input.q,
          category: input.category,
          district: input.district,
          priceMin: input.priceMin,
          priceMax: input.priceMax,
          openNow: input.openNow,
          minRating: input.minRating,
          verified: input.verified,
          sort: input.sort ?? 'rating',
          take: 8,
          lang,
        });
        vendors = found.slice(0, 6);
        const summary = found.length
          ? found
              .slice(0, 8)
              .map((v) => `- ${v.name} · ${v.category?.name ?? ''} · ${v.district ?? ''} · reyting ${v.rating}`)
              .join('\n')
          : "(hech narsa topilmadi)";
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: `${found.length} ta natija:\n${summary}`,
        });
      }

      messages.push({ role: 'user', content: toolResults });
    }

    return {
      reply: this.fallbackText(lang),
      vendors,
      filters,
      searchUrl: filters ? this.buildSearchUrl(filters) : null,
    };
  }

  private fallbackText(lang: Lang): string {
    if (lang === 'ru') return 'Не удалось обработать запрос. Попробуйте переформулировать.';
    if (lang === 'en') return "I couldn't process that. Try rephrasing your request.";
    return "So'rovni qayta ishlab bo'lmadi. Iltimos, boshqacha ifodalab ko'ring.";
  }
}
