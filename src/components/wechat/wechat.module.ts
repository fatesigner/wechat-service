import { Module } from '@nestjs/common';
import { WechatController } from './wechat.controller';
import { WechatService } from './wechat.service';

@Module({
  imports: [],
  controllers: [WechatController],
  providers: [
    WechatService,
    {
      provide: 'wechatConfig',
      useValue: {
        appId: 'wx696a2f50a1cc58cb',
        token: 'uWPXqcLorazKarpboqwYn7yXB',
        encodingAESKey: 'Gfl4UUI0XVwO3cIYz0qPF6v7F9yGqm2SvnqwYxg8zVr'
      }
    }
  ]
})
export class WechatModule {}
