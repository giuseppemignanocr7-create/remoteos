import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  async register(@Request() req: any, @Body() body: { name: string; type: 'mobile' | 'pc'; fingerprint: string; public_key: string }) {
    return this.devicesService.create({ ...body, user_id: req.user.id });
  }

  @Get()
  async list(@Request() req: any) {
    return this.devicesService.findByUser(req.user.id);
  }

  @Delete(':id')
  async revoke(@Request() req: any, @Param('id') id: string) {
    const device = await this.devicesService.findById(id);
    if (device.user_id !== req.user.id) throw new ForbiddenException('Not your device');
    return this.devicesService.revoke(id);
  }
}
