import type { Locale } from "./locales";

// Small templated strings that interpolate a runtime value (an artist's
// name, a 1-based index) into an otherwise-translatable sentence. These
// don't fit a plain key->string dictionary lookup — word order around the
// interpolated value differs per language — so each gets its own function
// instead of naive string concatenation.

export function currentIndexTitle(locale: Locale, name: string) {
  switch (locale) {
    case "ja":
      return `${name}の最新インデックス`;
    case "zh":
      return `${name} 的最新档案`;
    default:
      return `${name.toUpperCase()}'S CURRENT INDEX`;
  }
}

export function notesFromTitle(locale: Locale, name: string) {
  switch (locale) {
    case "ja":
      return `${name}からのお知らせ`;
    case "zh":
      return `来自 ${name} 的分享`;
    default:
      return `NOTES FROM ${name.toUpperCase()}`;
  }
}

export function showProfilePhotoAria(locale: Locale, index: number) {
  switch (locale) {
    case "ja":
      return `写真${index}を表示`;
    case "zh":
      return `显示照片 ${index}`;
    default:
      return `Show profile photo ${index}`;
  }
}

export function profilePortraitAlt(locale: Locale, name: string, index: number) {
  switch (locale) {
    case "ja":
      return `${name}のプロフィール写真 ${index}`;
    case "zh":
      return `${name} 的形象照 ${index}`;
    default:
      return `${name}, profile portrait ${index}`;
  }
}

// "YYYY-MM-DD" + an already-localized weekday abbreviation (from
// dictionary.weekdayAbbrev) -> "9月15日(月)" / "9/15 (MON)" / "9月15日（周二）".
// Parsed as plain string slices, not `new Date()`, so this can't be thrown
// off by timezone conversion.
export function scheduleDateLabel(locale: Locale, isoDate: string, weekdayLabel: string) {
  const [, monthRaw, dayRaw] = isoDate.split("-");
  const month = Number.parseInt(monthRaw, 10);
  const day = Number.parseInt(dayRaw, 10);
  switch (locale) {
    case "ja":
      return `${month}月${day}日(${weekdayLabel})`;
    case "zh":
      return `${month}月${day}日（${weekdayLabel}）`;
    default:
      return `${month}/${day} (${weekdayLabel})`;
  }
}

export function cardPortraitAlt(locale: Locale, name: string) {
  switch (locale) {
    case "ja":
      return `${name}のプロフィール写真`;
    case "zh":
      return `${name} 的形象照`;
    default:
      return `${name}, profile portrait`;
  }
}

// --- Admin console dynamic notices ---

export function accountUpdatedNotice(locale: Locale, artistName: string) {
  switch (locale) {
    case "ja":
      return `${artistName} のアクセス権を更新しました。該当する場合、既存のセッションは無効化されました。`;
    case "zh":
      return `${artistName} 的访问权限已更新，相关的现有会话已失效。`;
    default:
      return `${artistName} access was updated. Existing sessions were invalidated when applicable.`;
  }
}

export function oneTimeCodeLabel(locale: Locale, displayName: string) {
  switch (locale) {
    case "ja":
      return `ワンタイムアクセスコード / ${displayName}`;
    case "zh":
      return `一次性访问码 / ${displayName}`;
    default:
      return `ONE-TIME ACCESS CODE / ${displayName}`;
  }
}

export function newDraftNotice(locale: Locale, artistName: string) {
  switch (locale) {
    case "ja":
      return `${artistName} の新しい下書きを準備しています。`;
    case "zh":
      return `正在准备 ${artistName} 的新草稿。`;
    default:
      return `Preparing a new ${artistName} draft.`;
  }
}

export function modelProfileSavedNotice(locale: Locale, name: string) {
  switch (locale) {
    case "ja":
      return `${name} のプロフィールを更新しました。`;
    case "zh":
      return `${name} 的资料已更新。`;
    default:
      return `${name} was updated.`;
  }
}

export function announcementSavedNotice(locale: Locale, title: string) {
  switch (locale) {
    case "ja":
      return `「${title}」を保存しました。`;
    case "zh":
      return `已保存「${title}」。`;
    default:
      return `${title} was saved.`;
  }
}

export function staffSignedInNotice(locale: Locale, displayName: string) {
  switch (locale) {
    case "ja":
      return `${displayName} は紐づいたプロフィールの出勤情報を管理できるようになりました。`;
    case "zh":
      return `${displayName} 现在可以管理绑定资料的出勤信息了。`;
    default:
      return `${displayName} can now manage attendance for the bound profile.`;
  }
}
