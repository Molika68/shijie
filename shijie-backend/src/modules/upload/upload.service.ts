import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private uploadDir: string;
  private s3: S3Client | null = null;

  constructor(private readonly config: ConfigService) {
    this.uploadDir = this.config.get('UPLOAD_DIR', './uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    const accountId = this.config.get('R2_ACCOUNT_ID');
    if (accountId) {
      this.s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: this.config.get('R2_ACCESS_KEY_ID', ''),
          secretAccessKey: this.config.get('R2_SECRET_ACCESS_KEY', ''),
        },
      });
    }
  }

  async saveFile(file: Express.Multer.File): Promise<string> {
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${uuidv4()}${ext}`;

    if (this.s3) {
      const bucket = this.config.get('R2_BUCKET_NAME', 'shijie');
      await this.s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: filename,
          Body: file.buffer,
          ContentType: file.mimetype || 'image/jpeg',
        }),
      );
      const publicBase = this.config.get('R2_PUBLIC_URL', '');
      return publicBase ? `${publicBase.replace(/\/$/, '')}/${filename}` : filename;
    }

    const filepath = path.join(this.uploadDir, filename);
    fs.writeFileSync(filepath, file.buffer);
    return this.toPublicUrl(`/uploads/${filename}`);
  }

  toPublicUrl(relativeOrAbsolute: string): string {
    if (relativeOrAbsolute.startsWith('http')) {
      return relativeOrAbsolute;
    }
    const base = this.config.get('APP_PUBLIC_URL', 'http://localhost:3000');
    return `${base.replace(/\/$/, '')}${relativeOrAbsolute.startsWith('/') ? '' : '/'}${relativeOrAbsolute}`;
  }

  getAbsolutePath(relativePath: string): string {
    return path.join(process.cwd(), relativePath.replace(/^\//, ''));
  }
}
