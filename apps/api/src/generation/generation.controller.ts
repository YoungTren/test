import {
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { memoryStorage } from 'multer';
import { GenerationService } from './generation.service';

@Controller('generate')
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async generate(
    @UploadedFile() image: Express.Multer.File,
    @Body('role') role: string,
    @Req() req: Request,
  ) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.generationService.generate(image, role, baseUrl);
  }
}
