import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PGlite } from '@electric-sql/pglite';
import { PrismaPGlite } from 'pglite-prisma-adapter';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

function isPgliteMode(url: string): boolean {
  return (
    url === 'pglite://local' ||
    url.startsWith('pglite://') ||
    url === 'local'
  );
}

function createDbContext(url: string) {
  if (isPgliteMode(url)) {
    const dataDir = path.join(process.cwd(), 'prisma', 'pglite-data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const pglite = new PGlite(dataDir);
    return {
      adapter: new PrismaPGlite(pglite),
      pool: null as Pool | null,
      pglite,
    };
  }
  const pool = new Pool({ connectionString: url });
  return {
    adapter: new PrismaPg(pool),
    pool,
    pglite: null as PGlite | null,
  };
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool | null;
  private pglite: PGlite | null;

  constructor() {
    const ctx = createDbContext(process.env.DATABASE_URL ?? 'pglite://local');
    super({ adapter: ctx.adapter });
    this.pool = ctx.pool;
    this.pglite = ctx.pglite;
  }

  async onModuleInit() {
    if (this.pglite) {
      this.logger.log('使用本地 PGlite 数据库（prisma/pglite-data）');
    } else {
      this.logger.log('使用 PostgreSQL 数据库');
    }
    await this.bootstrapSchema();
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    if (this.pool) {
      await this.pool.end();
    }
    if (this.pglite) {
      await this.pglite.close();
    }
  }

  private async bootstrapSchema() {
    const required = ['User', 'EmailVerification', 'History'];
    for (const table of required) {
      const exists = await this.tableExists(table);
      if (!exists) {
        await this.runMigrationSql();
        return;
      }
    }
  }

  private async tableExists(table: string): Promise<boolean> {
    try {
      await this.$queryRawUnsafe(`SELECT 1 FROM "${table}" LIMIT 1`);
      return true;
    } catch {
      return false;
    }
  }

  private async runMigrationSql() {
    this.logger.warn('正在初始化数据库表...');
    const migrationPath = path.join(
      process.cwd(),
      'prisma/migrations/20250619000000_init/migration.sql',
    );
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    if (this.pglite) {
      await this.pglite.exec(sql);
    } else {
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'));
      for (const statement of statements) {
        await this.$executeRawUnsafe(`${statement};`);
      }
    }
    this.logger.log('数据库表初始化完成');
  }
}
