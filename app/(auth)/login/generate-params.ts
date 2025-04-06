export function generateStaticParams() {
  return ['ja', 'en', 'zh', 'th'].map((locale) => ({ locale }));
}
