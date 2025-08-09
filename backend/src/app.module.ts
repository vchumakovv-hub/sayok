import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CallGateway } from './call.gateway';
import { Message } from './entities/message.entity';
import { Dialogue } from './entities/dialogue.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'sayok',
      entities: [Message, Dialogue],
      synchronize: true, // disable in production
    }),
    TypeOrmModule.forFeature([Message, Dialogue]),
  ],
  providers: [CallGateway],
})
export class AppModule {}
