import type { ConversionResult } from './types';

export const CONVERT_PAGE_MESSAGE = 'web2markdown.convertPage';

export type ConvertPageResponse =
  | {
      ok: true;
      result: ConversionResult;
    }
  | {
      ok: false;
      error: string;
    };
