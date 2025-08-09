import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // You can enable CORS or other middleware here if needed
  await app.listen(3000);
  console.log(`Server is running on http://localhost:3000`);
}

bootstrap();
