import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

/**
 * Filtro global de excepciones con formato RFC 7807 (application/problem+json).
 */
@Catch()
export class ProblemFilter implements ExceptionFilter {
  private readonly logger = new Logger('ProblemFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const traceId = randomUUID();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = 'Internal Server Error';
    let detail: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      title = exception.message;
      if (typeof body === 'object' && body !== null) {
        const b = body as Record<string, unknown>;
        detail = Array.isArray(b.message) ? (b.message as string[]).join('; ') : (b.message as string);
      }
    } else if (exception instanceof Error) {
      detail = exception.message;
      this.logger.error(exception.message, exception.stack);
    }

    res.status(status).type('application/problem+json').json({
      type: 'about:blank',
      title,
      status,
      detail: detail ?? title,
      instance: req.url,
      traceId,
    });
  }
}
