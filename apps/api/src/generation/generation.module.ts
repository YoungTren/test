import { Module } from '@nestjs/common';
import { LeonardoModule } from '../leonardo/leonardo.module';
import { StorageModule } from '../storage/storage.module';
import { GenerationController } from './generation.controller';
import { GenerationService } from './generation.service';

@Module({
  imports: [LeonardoModule, StorageModule],
  controllers: [GenerationController],
  providers: [GenerationService],
})
export class GenerationModule {}
