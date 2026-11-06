export type ApiResponseDto<T> = {
  readonly success: true;
  readonly data: T;
}
