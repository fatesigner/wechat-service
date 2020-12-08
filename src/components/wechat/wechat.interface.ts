/**
 * 验证
 */
export interface IWechatSignatureCheckParams {
  echostr: string;
  signature: string;
  nonce: string;
  timestamp: string;
}

/**
 * 消息
 */
export interface IWechatMessageXmlData {
  /** 开发者微信号 e.g. `gh_019087f88815` */
  ToUserName: string;
  /** 发送方帐号（一个OpenID）e.g.: `o5w5awUl***5pIJKY` */
  FromUserName: string;
  /** 消息创建时间 （整型）e.g.`1595855711` */
  CreateTime: string;
  /** 消息类型，此处为 `event` */
  MsgType: string;
  /** 事件类型，subscribe(订阅)、unsubscribe(取消订阅) */
  Event: 'subscribe' | 'unsubscribe';
  /** 事件KEY值，目前无用 */
  EventKey: string;
  Content: string;
}

/**
 * 微信配置
 */
export interface IWechatConfig {
  // 公众号 appid
  appId: string;
  // 令牌
  token: string;
  // 消息加解密密钥
  encodingAESKey?: string;
}
