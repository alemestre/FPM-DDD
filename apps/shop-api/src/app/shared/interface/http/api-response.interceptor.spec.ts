import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  type INestApplication,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ApiResponseInterceptor } from './api-response.interceptor';

@Controller('items')
class ItemsController {
  @Get()
  findAll(): { id: number }[] {
    return [{ id: 1 }];
  }

  @Get('empty')
  findNone(): { id: number }[] {
    return [];
  }

  @Get('invalid')
  fail(): never {
    throw new BadRequestException('Invalid item');
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(): void {
    return undefined;
  }
}

describe('ApiResponseInterceptor', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ItemsController],
      providers: [{ provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  it('wraps a successful result in the response envelope', async () => {
    const response = await fetch(`${baseUrl}/items`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: [{ id: 1 }] });
  });

  it('wraps an empty list', async () => {
    const response = await fetch(`${baseUrl}/items/empty`);

    expect(await response.json()).toEqual({ success: true, data: [] });
  });

  it('keeps an empty body on a 204 response', async () => {
    const response = await fetch(`${baseUrl}/items`, { method: 'DELETE' });

    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
  });

  it('does not wrap errors', async () => {
    const response = await fetch(`${baseUrl}/items/invalid`);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid item',
    });
  });
});
