import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WechatModule } from './components/wechat/wechat.module';
import { LoggerModule } from './components/logger/logger.module';

@Module({
  imports: [WechatModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
