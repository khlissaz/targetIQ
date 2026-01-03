import { Query } from '@nestjs/common';
import { Controller, Post, Body, Req, Get, Param, UseGuards } from '@nestjs/common';
import { ScrapingService } from './scraping.service';
import { ScrapingDto } from './dto/scraping.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('scraping')
export class ScrapingController {
  constructor(private readonly scrapingService: ScrapingService) {}

  @UseGuards(JwtAuthGuard)
  @Post('ingest')
  async ingest(@Body() dto: ScrapingDto, @Req() req) {
    const user = req.user; // passport-jwt validate returns user object
    console.log(" ingest scraping dto", dto);
    return this.scrapingService.ingest(dto, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('recent')
  async recent(@Req() req) {
    const user = req.user;
    const result = await this.scrapingService.getRecentScraping(user.userId);
    console.log("result recent scrapings", result);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/leads')
  async leads(@Param('id') id: string) {
    return this.scrapingService.getLeadsByScrapingId(id);
  }

  // Public endpoint for queued (unauthenticated) batches to be ingested later
  @Post('queued')
  async queuedIngest(@Body() dto: ScrapingDto) {
    // This endpoint intentionally does not require auth and will associate scraping with no user
    return this.scrapingService.ingestQueued(dto);
  }

  // Public endpoint to fetch a queued scraping by idempotencyKey (no auth)
  @Get('queued/by-idempotency-key')
  async getQueuedByIdempotencyKey(@Query('idempotencyKey') idempotencyKey: string) {
    if (!idempotencyKey) {
      return { error: 'idempotencyKey is required' };
    }
    const scraping = await this.scrapingService.findQueuedByIdempotencyKey(idempotencyKey);
    if (!scraping) {
      return { error: 'Not found' };
    }
    return scraping;
  }

} 
