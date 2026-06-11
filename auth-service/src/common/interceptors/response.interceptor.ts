import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { RESPONSE_MESSAGE } from './response-message.decorator';

export interface Response<T> {
  statusCode: number;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private reflector: Reflector) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        const customMessage =
          this.reflector.get<string>(RESPONSE_MESSAGE, context.getHandler()) || 'Success';
        return {
          statusCode: context.switchToHttp().getResponse().statusCode,
          message: customMessage, // Or a dynamic message
          data: data,
        };
      }),
    );
  }
}
