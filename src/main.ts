import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const bodyParser = require('body-parser');
require('body-parser-xml')(bodyParser);

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: false
  });

  app.use(
    bodyParser.xml({
      xmlParseOptions: {
        // 始终返回数组。默认情况下只有数组元素数量大于 1 是才返回数组。
        explicitArray: false
      }
    })
  );

  await app.listen(3000);
}
bootstrap();
