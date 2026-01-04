import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { CreditType } from './entities/credits.entity';
import { JwtAuthGuard } from 'src/auth/jwt.guard';

@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}
 
  @UseGuards(JwtAuthGuard)
  @Get('')
  getUserCredits(@Req() req: any) {
    const userId = req.user.userId;
    return this.creditsService.getUserCredits(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('scraping-limit')
    async getScrapingLimit(@Req() req: any) {
      const userId = req.user.userId;
      const result =  await this.creditsService.getScrapingLimit(userId);
      console.log("Scraping limit result:", result);
      return result;
    }

    @UseGuards(JwtAuthGuard)
    @Get('enrichment-limit')
    getEnrichmentLimit(@Req() req: any) {
        const userId = req.user.userId;
        return this.creditsService.getEnrichmentCredit(userId);
    }

  @Post('add')
  addCredits(@Body() body: { userId: string; type: CreditType; amount: number }) {
    return this.creditsService.addCredits({ id: body.userId } as any, body.type, body.amount);
  }

  @Post('deduct')
  deductCredits(@Body() body: { userId: string; type: CreditType; amount: number }) {
    return this.creditsService.deductCredits(body.userId, body.type, body.amount);
  }

  @Post('set')
  setCredits(@Body() body: { userId: string; type: CreditType; amount: number }) {
    return this.creditsService.setCredits(body.userId, body.type, body.amount);
  }
}
