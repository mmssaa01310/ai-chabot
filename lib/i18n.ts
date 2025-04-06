// lib/i18n.ts

export async function getMessages(locale: string) {
    try {
      const messages = await import(`../messages/${locale}.json`);
      return messages.default;
    } catch {
      const fallback = await import(`../messages/ja.json`);
      return fallback.default;
    }
  }
  