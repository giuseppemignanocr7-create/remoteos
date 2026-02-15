import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Macro } from '../../entities/macro.entity';
import { MacroRun } from '../../entities/macro-run.entity';
import { MacrosService } from './macros.service';
import { MacrosController } from './macros.controller';
import { CommandsModule } from '../commands/commands.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [TypeOrmModule.forFeature([Macro, MacroRun]), CommandsModule, forwardRef(() => GatewayModule)],
  controllers: [MacrosController],
  providers: [MacrosService],
  exports: [MacrosService],
})
export class MacrosModule {}
