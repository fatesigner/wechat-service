import { Inject, Injectable, Logger, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger extends Logger {
  log(message: string) {
    /* your implementation */
  }

  error(message: string, trace: string) {
    // add your tailored logic here
    super.error(message, trace);
  }

  warn(message: string) {
    /* your implementation */
  }

  debug(message: string) {
    /* your implementation */
  }

  verbose(message: string) {
    /* your implementation */
  }
}

/**
 * logger decorator
 * @param bubble
 * @constructor
 */
export function AppLogs(bubble = true) {
  const injectLogger = Inject(AppLogger);

  return (target: any, propertyKey: string, propertyDescriptor: PropertyDescriptor) => {
    injectLogger(target, 'logger'); // this is the same as using constructor(private readonly logger: LoggerService) in a class

    // get original method
    const originalMethod = propertyDescriptor.value;

    // redefine descriptor value within own function block
    propertyDescriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        const logger: AppLogger = this.logger;

        logger.setContext(target.constructor.name);
        logger.error(error.message, error.stack);

        // rethrow error, so it can bubble up
        if (bubble) {
          throw error;
        }
      }
    };
  };
}
