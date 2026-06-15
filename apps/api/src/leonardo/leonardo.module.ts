import { Module } from '@nestjs/common';
import { LeonardoService } from './leonardo.service';

@Module({
  providers: [LeonardoService],
  exports: [LeonardoService],
})
export class LeonardoModule {}
