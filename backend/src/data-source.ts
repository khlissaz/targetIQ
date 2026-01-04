import 'dotenv/config';
import { DataSource } from 'typeorm';
import { join } from 'path';
import { User } from './users/entities/user.entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [join(__dirname, '**/*.entity{.ts,.js}'), User],
  migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
  synchronize: false, // ⚠️ Turn this off when using migrations
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
