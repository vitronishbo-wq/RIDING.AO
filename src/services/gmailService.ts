/**
 * RIDING.ao - Google Workspace Gmail Integration Service
 * 
 * Implements client-side OAuth via Firebase Auth GoogleAuthProvider,
 * in-memory token management, and REST calls to the Gmail v1 API.
 * Includes explicit user confirmation triggers for email dispatch and mutation.
 */

import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from './firebase';

export const GMAIL_SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.insert',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing',
  'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
  'https://www.googleapis.com/auth/gmail.addons.current.message.action',
  'https://www.googleapis.com/auth/gmail.addons.current.message.metadata',
  'https://www.googleapis.com/auth/gmail.addons.current.message.readonly'
];

// Configure Google Auth Provider with full Gmail scopes
const googleProvider = new GoogleAuthProvider();
GMAIL_SCOPES.forEach((scope) => {
  googleProvider.addScope(scope);
});
googleProvider.setCustomParameters({
  prompt: 'consent select_account'
});

// In-memory token cache (strictly not stored in localStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  from?: string;
  to?: string;
  subject?: string;
  date?: string;
  labelIds?: string[];
  unread?: boolean;
}

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  bodyText: string;
  cc?: string;
}

/**
 * Initialize Auth listener to clear in-memory token on logout or load
 */
export const initGmailAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Trigger Google Sign In Popup with Gmail Scopes
 */
export const signInWithGoogleGmail = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Falha ao obter token de acesso do Google OAuth.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('[Gmail Auth Error]:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getGmailAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const logoutGmail = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

/**
 * Fetch authenticated user's Gmail profile
 */
export const fetchGmailProfile = async (): Promise<GmailProfile> => {
  if (!cachedAccessToken) throw new Error('Não autenticado com o Google Workspace.');
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: { Authorization: `Bearer ${cachedAccessToken}` }
  });
  if (!response.ok) {
    throw new Error(`Erro ao obter perfil do Gmail: ${response.statusText}`);
  }
  return await response.json();
};

/**
 * List messages with optional search query (e.g. "RIDING" or "Recibo")
 */
export const listGmailMessages = async (query = '', maxResults = 15): Promise<GmailMessageSummary[]> => {
  if (!cachedAccessToken) throw new Error('Não autenticado com o Google Workspace.');

  const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
  url.searchParams.set('maxResults', String(maxResults));
  if (query) {
    url.searchParams.set('q', query);
  }

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${cachedAccessToken}` }
  });

  if (!response.ok) {
    throw new Error(`Erro ao listar mensagens do Gmail: ${response.statusText}`);
  }

  const data = await response.json();
  const rawList: { id: string; threadId: string }[] = data.messages || [];

  // Fetch headers for each message concurrently
  const summaries = await Promise.all(
    rawList.slice(0, maxResults).map(async (item) => {
      try {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
          {
            headers: { Authorization: `Bearer ${cachedAccessToken}` }
          }
        );
        if (!detailRes.ok) return { id: item.id, threadId: item.threadId, snippet: '' };
        const detail = await detailRes.json();
        const headers = detail.payload?.headers || [];
        const from = headers.find((h: { name: string; value: string }) => h.name.toLowerCase() === 'from')?.value;
        const to = headers.find((h: { name: string; value: string }) => h.name.toLowerCase() === 'to')?.value;
        const subject = headers.find((h: { name: string; value: string }) => h.name.toLowerCase() === 'subject')?.value;
        const date = headers.find((h: { name: string; value: string }) => h.name.toLowerCase() === 'date')?.value;

        return {
          id: item.id,
          threadId: item.threadId,
          snippet: detail.snippet || '',
          from,
          to,
          subject: subject || '(Sem Assunto)',
          date,
          labelIds: detail.labelIds || [],
          unread: detail.labelIds?.includes('UNREAD')
        };
      } catch {
        return { id: item.id, threadId: item.threadId, snippet: '' };
      }
    })
  );

  return summaries;
};

/**
 * Send an email through the Gmail API
 * Note: Caller must confirm with the user before invoking this mutating action.
 */
export const sendGmailMessage = async (params: SendEmailParams): Promise<{ id: string; threadId: string }> => {
  if (!cachedAccessToken) throw new Error('Não autenticado com o Google Workspace.');

  // Build standard RFC 2822 email payload
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(params.subject)))}?=`;
  const messageParts = [
    `To: ${params.to}`,
    params.cc ? `Cc: ${params.cc}` : '',
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    params.bodyText
  ]
    .filter(Boolean)
    .join('\r\n');

  // Convert to base64url format
  const encodedMessage = btoa(unescape(encodeURIComponent(messageParts)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cachedAccessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: encodedMessage })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Falha ao enviar e-mail via Gmail API: ${JSON.stringify(errorData)}`);
  }

  return await response.json();
};
