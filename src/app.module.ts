import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailParserController } from './email-parser/email-parser.controller';
import { EmailParserService } from './email-parser/email-parser.service';

@Module({
  imports: [],
  controllers: [AppController, EmailParserController],
  providers: [AppService, EmailParserService],
})
export class AppModule {}
