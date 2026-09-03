import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PartnerService } from './partner.service';
import { PartnerBillingService } from './partner-billing.service';
import {
  CreateBankDto, CreateInsuranceProductDto, CreateInsurerDto, CreateMortgageProgramDto,
  CreateNasiyaProviderDto, LeadFilterDto, RegisterPartnerDto, SelectPartnerPlanDto, SimulateBillingDto,
  UpdateInsuranceProductDto, UpdateMortgageProgramDto, UpdateNasiyaProviderDto, UpdatePartnerDto,
} from './dto';
import { JwtAuthGuard, type AuthUser } from '../../common/jwt.guard';
import { CurrentUser } from '../../common/current-user.decorator';

/** Izla Biznes — homiy self-service portali. Hamma endpoint JWT + a'zolik tekshiruvi. */
@ApiTags('partner')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('partner')
export class PartnerController {
  constructor(
    private readonly partner: PartnerService,
    private readonly billing: PartnerBillingService,
  ) {}

  /** Yangi homiy kompaniyasini ro'yxatdan o'tkazish (onboarding). */
  @Post('register')
  register(@CurrentUser() user: AuthUser, @Body() dto: RegisterPartnerDto) {
    return this.partner.register(user.sub, dto);
  }

  /** Foydalanuvchi a'zo bo'lgan kompaniyalar. */
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.partner.me(user.sub);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.partner.get(user.sub, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdatePartnerDto) {
    return this.partner.update(user.sub, id, dto);
  }

  @Get(':id/dashboard')
  dashboard(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.partner.dashboard(user.sub, id);
  }

  @Get(':id/products')
  products(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.partner.products(user.sub, id);
  }

  @Get(':id/leads')
  leads(@CurrentUser() user: AuthUser, @Param('id') id: string, @Query() filter: LeadFilterDto) {
    return this.partner.leads(user.sub, id, filter);
  }

  // ─── Obuna / billing lifecycle ────────────────────────────────────────────
  /** Tarif tanlash: FREE darrov faollashadi, pullik → hisob-faktura yaratiladi. */
  @Post(':id/plan')
  selectPlan(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: SelectPartnerPlanDto) {
    return this.billing.subscribe(user.sub, id, dto.plan);
  }

  @Get(':id/billing')
  billingOverview(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.billing.overview(user.sub, id);
  }

  @Get(':id/invoices')
  invoices(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.billing.invoices(user.sub, id);
  }

  /** Hisob-fakturani to'lash (DEMO — real Payme/Click webhook ham shu natijani beradi). */
  @Post(':id/invoices/:invoiceId/pay')
  payInvoice(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('invoiceId') invoiceId: string) {
    return this.billing.payInvoiceDemo(user.sub, id, invoiceId);
  }

  /** DEMO: muddatni surib, lifecycle bosqichini darrov sinash (renew→dunning→suspend). */
  @Post(':id/billing/simulate')
  simulate(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: SimulateBillingDto) {
    return this.billing.simulate(user.sub, id, dto.daysPast);
  }

  // ─── Self-serve: bank + ipoteka dasturi boshqaruvi ───────────────────────
  @Get(':id/banks')
  banks(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.partner.myBanks(user.sub, id);
  }

  @Post(':id/banks')
  createBank(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: CreateBankDto) {
    return this.partner.createBank(user.sub, id, dto);
  }

  @Post(':id/mortgage-programs')
  createProgram(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: CreateMortgageProgramDto) {
    return this.partner.createMortgageProgram(user.sub, id, dto);
  }

  @Patch(':id/mortgage-programs/:programId')
  updateProgram(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('programId') programId: string, @Body() dto: UpdateMortgageProgramDto) {
    return this.partner.updateMortgageProgram(user.sub, id, programId, dto);
  }

  @Delete(':id/mortgage-programs/:programId')
  deleteProgram(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('programId') programId: string) {
    return this.partner.deleteMortgageProgram(user.sub, id, programId);
  }

  // ─── Self-serve: sug'urta ─────────────────────────────────────────────────
  @Get(':id/insurers')
  insurers(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.partner.myInsurers(user.sub, id);
  }

  @Post(':id/insurers')
  createInsurer(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: CreateInsurerDto) {
    return this.partner.createInsurer(user.sub, id, dto);
  }

  @Post(':id/insurance-products')
  createInsProduct(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: CreateInsuranceProductDto) {
    return this.partner.createInsuranceProduct(user.sub, id, dto);
  }

  @Patch(':id/insurance-products/:productId')
  updateInsProduct(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('productId') productId: string, @Body() dto: UpdateInsuranceProductDto) {
    return this.partner.updateInsuranceProduct(user.sub, id, productId, dto);
  }

  @Delete(':id/insurance-products/:productId')
  deleteInsProduct(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('productId') productId: string) {
    return this.partner.deleteInsuranceProduct(user.sub, id, productId);
  }

  // ─── Self-serve: nasiya ───────────────────────────────────────────────────
  @Post(':id/nasiya-providers')
  createProvider(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: CreateNasiyaProviderDto) {
    return this.partner.createNasiyaProvider(user.sub, id, dto);
  }

  @Patch(':id/nasiya-providers/:providerId')
  updateProvider(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('providerId') providerId: string, @Body() dto: UpdateNasiyaProviderDto) {
    return this.partner.updateNasiyaProvider(user.sub, id, providerId, dto);
  }

  @Delete(':id/nasiya-providers/:providerId')
  deleteProvider(@CurrentUser() user: AuthUser, @Param('id') id: string, @Param('providerId') providerId: string) {
    return this.partner.deleteNasiyaProvider(user.sub, id, providerId);
  }
}
