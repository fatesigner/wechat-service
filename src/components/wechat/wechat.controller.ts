import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { IWechatMessageXmlData, IWechatSignatureCheckParams } from './wechat.interface';
import { WechatService } from './wechat.service';

@Controller()
export class WechatController {
  constructor(private readonly wechatService: WechatService) {}

  /**
   * 验证微信接口配置信息
   */
  @Get()
  checkSignature(@Query() query: IWechatSignatureCheckParams) {
    console.log('request______' + JSON.stringify(query));

    const result = this.wechatService.checkSignature(query);

    if (result) {
      return query.echostr;
    } else {
      return false;
    }
  }

  /**
   * 接收消息
   * @param query
   * @param data
   */
  @Post()
  async post(@Query() query: IWechatSignatureCheckParams, @Body('xml') data: any) {
    return this.wechatService.receiveMessage(query, data);
  }
}
