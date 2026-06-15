import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Role } from '../leonardo/leonardo.types';

@Injectable()
export class StorageService {
  private readonly uploadDir: string;

  constructor(private readonly config: ConfigService) {
    this.uploadDir = this.config.get<string>('UPLOAD_DIR') ?? join(process.cwd(), 'uploads');
  }

  async saveOriginal(buffer: Buffer, extension: string): Promise<string> {
    return this.saveFile('originals', buffer, extension);
  }

  async saveGenerated(buffer: Buffer, role: Role, extension: string): Promise<string> {
    const filename = `${Date.now()}-${uuidv4()}-${role}.${extension}`;
    const dir = join(this.uploadDir, 'generated');
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), buffer);
    return filename;
  }

  getGeneratedPath(filename: string): string {
    return join(this.uploadDir, 'generated', filename);
  }

  private async saveFile(subdir: string, buffer: Buffer, extension: string): Promise<string> {
    const filename = `${Date.now()}-${uuidv4()}.${extension}`;
    const dir = join(this.uploadDir, subdir);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), buffer);
    return filename;
  }
}
