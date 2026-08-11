import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AssistantService, type ChatTurn } from './assistant.service';
import { resolveLang } from '../../common/i18n';

interface ChatBody {
  messages: ChatTurn[];
  lang?: string;
}

@ApiTags('assistant')
@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Get('status')
  status() {
    return { enabled: this.assistant.enabled };
  }

  @Post('chat')
  chat(@Body() body: ChatBody, @Headers('accept-language') acceptLanguage?: string) {
    const lang = resolveLang(body?.lang, acceptLanguage);
    // Xavfsizlik: faqat user/assistant matnli navbatlar, oxirgi 12 tasi.
    const turns: ChatTurn[] = (body?.messages ?? [])
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
    return this.assistant.chat(turns, lang);
  }
}
