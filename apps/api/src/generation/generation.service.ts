import {
  BadRequestException,
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
} from '@nestjs/common';
import { LeonardoService } from '../leonardo/leonardo.service';
import { Role, ROLES } from '../leonardo/leonardo.types';
import { StorageService } from '../storage/storage.service';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Injectable()
export class GenerationService {
  constructor(
    private readonly leonardoService: LeonardoService,
    private readonly storageService: StorageService,
  ) {}

  async generate(image: Express.Multer.File, role: string, baseUrl: string) {
    this.validateFile(image);
    this.validateRole(role);

    const extension = this.extensionFromMime(image.mimetype);
    await this.storageService.saveOriginal(image.buffer, extension);

    try {
      const generatedBuffer = await this.leonardoService.generateImageFromPhoto(
        image.buffer,
        extension,
        role as Role,
      );

      const filename = await this.storageService.saveGenerated(
        generatedBuffer,
        role as Role,
        'jpg',
      );

      return {
        success: true as const,
        imageUrl: `${baseUrl}/api/uploads/generated/${filename}`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      if (message.includes('timeout')) {
        throw new GatewayTimeoutException('Generation timeout exceeded');
      }

      throw new BadGatewayException(`Leonardo AI error: ${message}`);
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Image file is required');
    }

    if (!ALLOWED_MIMES.has(file.mimetype)) {
      throw new BadRequestException('Invalid file format. Allowed: jpg, jpeg, png, webp');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds 10 MB limit');
    }
  }

  private validateRole(role: string): asserts role is Role {
    if (!ROLES.includes(role as Role)) {
      throw new BadRequestException('Invalid role. Allowed: miner, military_volunteer, farmer');
    }
  }

  private extensionFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    return map[mime] ?? 'jpg';
  }
}
