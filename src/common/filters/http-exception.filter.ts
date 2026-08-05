import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
  } from '@nestjs/common';
  import { Request, Response } from 'express';
  
  //Filtro de excepciones HTTP para NestJs
  //Sirve para capturar excpeciones que no se manejan en otra parte del código y que tengan la misma estructura
  @Catch()
  export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
  
      const status =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
    
      const exceptionResponse =
       exception instanceof HttpException 
       ? exception.getResponse() 
       : 'Internal Server Error';

       const message =
         typeof exceptionResponse === 'string'
              ? exceptionResponse
              : ((exceptionResponse as Record <string, unknown>).message ?? 
               exceptionResponse);

       response.status(status).json({ 
        statusCode: status,
        message: message,
        timestamp: new Date().toISOString(),
        path: request.url });

        }
  } 