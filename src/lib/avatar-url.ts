export function getAvatarSrc(url?: string | null): string | null {
   if (!url) return null;
   try {
      const parsed = new URL(url, "http://avatar.local");
      const filename = parsed.pathname.match(/^\/(?:static\/uploads\/avatars|api\/avatar|api\/v1\/usuarios\/avatar)\/([a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp))$/i)?.[1];
      return filename ? `/api/avatar/${filename}${parsed.search}` : null;
   } catch { return null; }
}
