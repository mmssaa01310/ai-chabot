// src/i18n/routing.ts
import {defineRouting} from 'next-intl/routing';
 
export const routing = defineRouting({
  // 対応するすべてのロケール
  locales: ['ja', 'en', 'zh', 'th'],

  // 該当なしの場合のデフォルトロケール
  defaultLocale: 'ja'
});
