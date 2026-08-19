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

// --- Admin console dynamic notices/audit-log strings ---

export function draftUpdatedDetail(locale: Locale, displayName: string) {
  switch (locale) {
    case "ja":
      return `${displayName}の仮プロフィールテキストを更新しました。`;
    case "zh":
      return `已更新 ${displayName} 的临时资料文案。`;
    default:
      return `Updated temporary profile copy for ${displayName}.`;
  }
}

export function submittedNotice(locale: Locale, revisionId: string, actorId: string) {
  switch (locale) {
    case "ja":
      return `リビジョン ${revisionId} をロックし、${actorId} が提出しました。続行するには reviewer-01 に切り替えてください。`;
    case "zh":
      return `修订版本 ${revisionId} 已锁定并由 ${actorId} 提交。请切换到 reviewer-01 继续。`;
    default:
      return `Revision ${revisionId} locked and submitted by ${actorId}. Switch to reviewer-01 to continue.`;
  }
}

export function submittedAuditDetail(locale: Locale, revisionId: string) {
  switch (locale) {
    case "ja":
      return `リビジョン ${revisionId} と3点のメディア素材を reviewer-01 のためにロックしました。`;
    case "zh":
      return `修订版本 ${revisionId} 及三份媒体素材已为 reviewer-01 锁定。`;
    default:
      return `Revision ${revisionId} and three media assets locked for reviewer-01.`;
  }
}

export function approvalBlockedDetail(locale: Locale, actorId: string) {
  switch (locale) {
    case "ja":
      return `${actorId} は提出済みの担当者と一致しています。`;
    case "zh":
      return `${actorId} 与记录中的提交者一致。`;
    default:
      return `${actorId} matches the recorded submitting identity.`;
  }
}

export function approvedNotice(locale: Locale, revisionId: string, actorId: string) {
  switch (locale) {
    case "ja":
      return `リビジョン ${revisionId} が ${actorId} により承認されました。公開はまだシミュレーションです。`;
    case "zh":
      return `修订版本 ${revisionId} 已由 ${actorId} 批准。发布仍为模拟状态。`;
    default:
      return `Revision ${revisionId} approved by ${actorId}. Publication remains simulated.`;
  }
}

export function approvedAuditDetail(locale: Locale, revisionId: string) {
  switch (locale) {
    case "ja":
      return `ガバナンス確認後、リビジョン ${revisionId} が独立して承認されました。`;
    case "zh":
      return `经治理审查后，修订版本 ${revisionId} 已被独立批准。`;
    default:
      return `Revision ${revisionId} approved independently after governance review.`;
  }
}

export function publishedNotice(locale: Locale, priorRevisionId: string, revisionId: string) {
  switch (locale) {
    case "ja":
      return `プローブの公開ポインタがリビジョン ${priorRevisionId} から ${revisionId} に移動しました。本番サイトは変更されていません。`;
    case "zh":
      return `试验发布指针已从修订版本 ${priorRevisionId} 移动到 ${revisionId}。生产站点未发生变化。`;
    default:
      return `Probe public pointer moved from revision ${priorRevisionId} to ${revisionId}. The production site was not changed.`;
  }
}

export function publishedAuditDetail(locale: Locale, priorRevisionId: string, revisionId: string) {
  switch (locale) {
    case "ja":
      return `公開ポインタがリビジョン ${priorRevisionId} から ${revisionId} に移動しました。`;
    case "zh":
      return `公开指针已从修订版本 ${priorRevisionId} 移动到 ${revisionId}。`;
    default:
      return `Public pointer moved from revision ${priorRevisionId} to ${revisionId}.`;
  }
}

export function rollbackNotice(locale: Locale, restoredRevisionId: string, removedRevisionId: string) {
  switch (locale) {
    case "ja":
      return `プローブの公開ポインタをリビジョン ${restoredRevisionId} に復元しました。リビジョン ${removedRevisionId} は承認済みのままです。`;
    case "zh":
      return `试验发布指针已恢复到修订版本 ${restoredRevisionId}。修订版本 ${removedRevisionId} 仍保持已批准状态。`;
    default:
      return `Probe public pointer restored to revision ${restoredRevisionId}. Revision ${removedRevisionId} remains approved.`;
  }
}

export function rollbackAuditDetail(locale: Locale, restoredRevisionId: string, removedRevisionId: string) {
  switch (locale) {
    case "ja":
      return `リビジョン ${restoredRevisionId} を復元しました。リビジョン ${removedRevisionId} は承認済みスナップショットのままです。`;
    case "zh":
      return `已恢复修订版本 ${restoredRevisionId}；修订版本 ${removedRevisionId} 仍是已批准的快照。`;
    default:
      return `Revision ${restoredRevisionId} restored; revision ${removedRevisionId} remains an approved snapshot.`;
  }
}

export function takedownNotice(locale: Locale, hiddenRevisionId: string) {
  switch (locale) {
    case "ja":
      return `緊急停止によりリビジョン ${hiddenRevisionId} をプロフィール・ディレクトリ・ギャラリー全体から非公開にしました。このセッションでの再公開はロックされています。`;
    case "zh":
      return `紧急下线已在资料页、名录与相册中隐藏修订版本 ${hiddenRevisionId}。本次会话已锁定，无法重新发布。`;
    default:
      return `Emergency takedown hid public revision ${hiddenRevisionId} across profile, directory and gallery. This session is closed to republishing.`;
  }
}

export function takedownAuditDetail(locale: Locale, hiddenRevisionId: string) {
  switch (locale) {
    case "ja":
      return `リビジョン ${hiddenRevisionId} を非表示にした後、公開ポインタをクリアしました。再公開はロックされています。`;
    case "zh":
      return `隐藏修订版本 ${hiddenRevisionId} 后，公开指针已被清除；重新发布已被锁定。`;
    default:
      return `Public pointer cleared after hiding revision ${hiddenRevisionId}; republishing is locked.`;
  }
}

export function roleChangedNotice(locale: Locale, actorId: string) {
  switch (locale) {
    case "ja":
      return `シミュレーション上の担当者が ${actorId} に変更されました。`;
    case "zh":
      return `模拟身份已切换为 ${actorId}。`;
    default:
      return `Simulated identity changed to ${actorId}.`;
  }
}

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

export function suppliedPhotoAlt(locale: Locale, displayName: string, index: number) {
  switch (locale) {
    case "ja":
      return `${displayName}、提供写真 ${index}`;
    case "zh":
      return `${displayName}，提供的照片 ${index}`;
    default:
      return `${displayName}, supplied view ${index}`;
  }
}

export function profilePreviewAlt(locale: Locale, displayName: string) {
  switch (locale) {
    case "ja":
      return `${displayName} のプロフィールプレビュー`;
    case "zh":
      return `${displayName} 的资料预览`;
    default:
      return `${displayName} profile preview`;
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
