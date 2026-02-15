import { Controller, Get, Post, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { MacrosService } from './macros.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('macros')
export class MacrosController {
  constructor(private readonly macrosService: MacrosService) {}

  @Post()
  async create(@Request() req: any, @Body() body: Record<string, unknown>) {
    return this.macrosService.create(req.user.id, body);
  }

  @Get()
  async list(@Request() req: any) {
    return this.macrosService.findByUser(req.user.id);
  }

  @Get('runs/:runId')
  async getRunStatus(@Request() req: any, @Param('runId') runId: string) {
    const run = await this.macrosService.getRunStatus(runId);
    if (run.user_id !== req.user.id) throw new ForbiddenException('Not your macro run');
    return run;
  }

  @Get(':id')
  async get(@Request() req: any, @Param('id') id: string) {
    const macro = await this.macrosService.findById(id);
    if (macro.user_id !== req.user.id) throw new ForbiddenException('Not your macro');
    return macro;
  }

  @Post(':id/execute')
  async execute(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { session_id: string; pc_device_id: string; params?: Record<string, unknown> },
  ) {
    const macro = await this.macrosService.findById(id);
    if (macro.user_id !== req.user.id) throw new ForbiddenException('Not your macro');
    return this.macrosService.execute(id, req.user.id, body.session_id, body.pc_device_id, body.params);
  }
}
