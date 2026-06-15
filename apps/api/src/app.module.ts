import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { GenerationModule } from './generation/generation.module';
import { LeonardoModule } from './leonardo/leonardo.module';
import { StorageModule } from './storage/storage.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(__dirname, '..', '.env'),
        '.env',
        'apps/api/.env',
      ],
    }),
    LeonardoModule,
    StorageModule,
    UploadsModule,
    GenerationModule,
  ],
})
export class AppModule {}
