import { Controller, Get, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('timeline')
  async timeline(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const l = limit ? parseInt(limit, 10) : 50;
    const o = offset ? parseInt(offset, 10) : 0;
    if (isNaN(l) || isNaN(o) || l < 1 || l > 500 || o < 0) {
      throw new BadRequestException('Invalid limit (1-500) or offset (>=0)');
    }
    return this.auditService.getTimeline(req.user.id, l, o);
  }

  @Get('verify')
  async verify(
    @Query('start') start: string,
    @Query('count') count: string,
  ) {
    const s = parseInt(start, 10);
    const c = parseInt(count, 10);
    if (isNaN(s) || isNaN(c) || s < 1 || c < 1 || c > 10000) {
      throw new BadRequestException('Invalid start (>=1) or count (1-10000)');
    }
    return this.auditService.verifyChain(s, c);
  }
}
