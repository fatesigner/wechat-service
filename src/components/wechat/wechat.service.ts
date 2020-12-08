// eslint-disable-next-line node/no-deprecated-api
import { createCipheriv, createDecipheriv, createHash, pseudoRandomBytes } from 'crypto';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { IWechatConfig, IWechatSignatureCheckParams } from './wechat.interface';

const { parseString, Builder } = require('xml2js');

class PKCS7 {
  /**
   * 删除补位
   * @param {String} text 解密后的明文
   */
  decode(text) {
    let pad = text[text.length - 1];
    if (pad < 1 || pad > 32) {
      pad = 0;
    }
    return text.slice(0, text.length - pad);
  }

  /**
   * 填充补位
   * @param {String} text 需要进行填充补位的明文
   */
  encode(text) {
    const blockSize = 32;
    const textLength = text.length;
    // 计算需要填充的位数
    const amountToPad = blockSize - (textLength % blockSize);
    const result = Buffer.alloc(amountToPad);
    result.fill(amountToPad);
    return Buffer.concat([text, result]);
  }
}

@Injectable()
export class WechatService {
  config: IWechatConfig;

  key: Buffer;
  iv: Buffer;
  pkcs7: PKCS7;

  constructor(@Inject('wechatConfig') @Optional() config?: IWechatConfig) {
    this.config = config;

    if (this.config.encodingAESKey) {
      const AESKey = Buffer.from(this.config.encodingAESKey + '=', 'base64');

      if (AESKey.length !== 32) {
        throw new Error('encodingAESKey invalid');
      }

      this.key = AESKey;
      this.iv = AESKey.slice(0, 16);

      this.pkcs7 = new PKCS7();
    }
  }

  getSignature(timestamp, nonce, encrypt) {
    const sha = createHash('sha1');
    const arr = [this.config.token, timestamp, nonce, encrypt].sort();
    sha.update(arr.join(''));
    return sha.digest('hex');
  }

  checkSignature(params: IWechatSignatureCheckParams): boolean {
    const sha1 = createHash('sha1');

    const arr = [this.config.token, params.timestamp, params.nonce].sort();

    return params.signature == sha1.update(arr.join('')).digest('base64');
  }

  async receiveMessage(signatureParams: IWechatSignatureCheckParams, receivedMessage: any) {
    // 待解密
    if (this.config.encodingAESKey && receivedMessage.Encrypt) {
      const xmlSource = this.decrypt(receivedMessage.Encrypt);
      // 转换为 json
      receivedMessage = await this.convertXMLtoJson(xmlSource.message);
    }

    // 待回复的消息
    const replyMessage = {
      ToUserName: receivedMessage.FromUserName, //	接收方帐号（收到的OpenID）
      FromUserName: receivedMessage.ToUserName, //	开发者微信号
      CreateTime: new Date().getTime(), //	消息创建时间 （整型）
      MsgType: 'text',
      Content: '已接收：11111111111111111111111111111'
    };

    // XML 构建器
    const builder = new Builder({
      headless: true,
      rootName: 'xml',
      explicitRoot: false,
      explicitArray: false,
      cdata: true,
      renderOpts: {
        pretty: true
      }
    });

    // 将消息转换为 XML 字符串
    const replyMessageXML = builder.buildObject(replyMessage).toString();

    // 发送给微信服务器
    const timestamp = new Date().getTime();
    const replyMessageEncrypt = this.encrypt(replyMessageXML);
    const res = builder.buildObject({
      ToUserName: replyMessage.FromUserName,
      Encrypt: replyMessageEncrypt,
      Nonce: signatureParams.nonce,
      TimeStamp: timestamp,
      MsgSignature: this.getSignature(timestamp, signatureParams.nonce, replyMessageEncrypt)
    });

    return res;
  }

  /**
   * 对密文进行解密
   * 密文结构：AES_Encrypt[random(16B) + msg_len(4B) + msg + $appId]
   * @param {String} text  待解密的密文
   */
  decrypt(text) {
    // 创建解密对象，AES采用CBC模式，数据采用PKCS#7填充；IV初始向量大小为16字节，取AESKey前16字节
    const decipher = createDecipheriv('aes-256-cbc', this.key, this.iv);

    // 是否取消自动填充
    decipher.setAutoPadding(false);

    let deciphered = Buffer.concat([decipher.update(text, 'base64'), decipher.final()]);

    deciphered = this.pkcs7.decode(deciphered);

    // 去除 16 位随机数
    const content = deciphered.slice(16);
    const length = content.slice(0, 4).readUInt32BE(0);

    return {
      message: content.slice(4, length + 4).toString(),
      appId: content.slice(length + 4).toString()
    };
  }

  /**
   * 对明文进行加密
   * 算法：Base64_Encode(AES_Encrypt[random(16B) + msg_len(4B) + msg + $appId])
   * @param {String} text    待加密明文文本
   */
  encrypt(text) {
    // 16B 随机字符串
    const randomString = pseudoRandomBytes(16);

    const msg = Buffer.from(text);
    // 获取4B的内容长度的网络字节序
    const msgLength = Buffer.alloc(4);
    msgLength.writeUInt32BE(msg.length, 0);

    const id = Buffer.from(this.config.appId);

    const bufMsg = Buffer.concat([randomString, msgLength, msg, id]);

    // 对明文进行补位操作
    const encoded = this.pkcs7.encode(bufMsg);

    // 创建加密对象，AES采用CBC模式，数据采用PKCS#7填充；IV初始向量大小为16字节，取AESKey前16字节
    const cipher = createCipheriv('aes-256-cbc', this.key, this.iv);
    cipher.setAutoPadding(false);

    const cipheredMsg = Buffer.concat([cipher.update(encoded), cipher.final()]);

    return cipheredMsg.toString('base64');
  }

  convertXMLtoJson(message: string): Promise<any> {
    return new Promise((resolve, reject) => {
      parseString(
        message,
        {
          explicitArray: false
        },
        (err, result) => {
          if (err) {
            console.error(`解密发生错误:`, err);
            reject(err);
          } else {
            resolve(result.xml);
          }
        }
      );
    });
  }
}
