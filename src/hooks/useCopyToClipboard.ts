import { useState } from 'react';

type ClipboardWriter = (content: string) => void;

export function useCopyToClipboard<Key extends string | number>(): {
  copiedKey: Key | null;
  copyToClipboard: (key: Key, content: string, writer?: ClipboardWriter) => void;
} {
  const [copiedKey, setCopiedKey] = useState<Key | null>(null);

  const copyToClipboard = (key: Key, content: string, writer: ClipboardWriter = (value) => {
    navigator.clipboard.writeText(value);
  }) => {
    writer(content);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return { copiedKey, copyToClipboard };
}
