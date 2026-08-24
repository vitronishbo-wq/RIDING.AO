/**
 * RIDING.ao - Google Workspace Chat Integration Service
 * 
 * Provides client-side Google Chat v1 API interactions:
 * - List Spaces (Rooms / Direct Messages)
 * - Fetch Messages within a Space
 * - Send Messages (with mandatory user confirmation)
 * - Create Operational Spaces (e.g., Luanda Central de Despacho)
 * - Manage in-memory OAuth tokens
 */

import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from './firebase';

export const CHAT_SCOPES = [
  'https://www.googleapis.com/auth/chat.spaces',
  'https://www.googleapis.com/auth/chat.spaces.readonly',
  'https://www.googleapis.com/auth/chat.spaces.create',
  'https://www.googleapis.com/auth/chat.messages',
  'https://www.googleapis.com/auth/chat.messages.readonly',
  'https://www.googleapis.com/auth/chat.messages.create',
  'https://www.googleapis.com/auth/chat.messages.reactions',
  'https://www.googleapis.com/auth/chat.messages.reactions.readonly',
  'https://www.googleapis.com/auth/chat.messages.reactions.create',
  'https://www.googleapis.com/auth/chat.memberships',
  'https://www.googleapis.com/auth/chat.memberships.readonly',
  'https://www.googleapis.com/auth/chat.customemojis',
  'https://www.googleapis.com/auth/chat.customemojis.readonly',
  'https://www.googleapis.com/auth/chat.users.readstate',
  'https://www.googleapis.com/auth/chat.users.readstate.readonly',
  'https://www.googleapis.com/auth/chat.users.spacesettings',
  'https://www.googleapis.com/auth/chat.admin.spaces',
  'https://www.googleapis.com/auth/chat.admin.spaces.readonly',
  'https://www.googleapis.com/auth/chat.admin.memberships',
  'https://www.googleapis.com/auth/chat.admin.memberships.readonly'
];

export interface ChatSpace {
  name: string; // "spaces/{spaceId}"
  displayName?: string;
  spaceType?: 'SPACE' | 'GROUP_CHAT' | 'DIRECT_MESSAGE';
  singleUserBotDm?: boolean;
  threaded?: boolean;
  spaceDetails?: {
    description?: string;
    guidelines?: string;
  };
}

export interface ChatMessage {
  name: string; // "spaces/{spaceId}/messages/{messageId}"
  sender?: {
    name: string;
    displayName?: string;
    avatarUrl?: string;
    type?: 'HUMAN' | 'BOT';
  };
  text: string;
  createTime?: string;
  formattedText?: string;
  thread?: {
    name: string;
  };
}

export interface SendChatMessageParams {
  spaceName: string; // e.g. "spaces/AAAA..."
  text: string;
  threadKey?: string;
}

export interface CreateSpaceParams {
  displayName: string;
  spaceType?: 'SPACE' | 'GROUP_CHAT';
  description?: string;
}

// In-memory token cache (strictly not stored in localStorage)
let cachedChatAccessToken: string | null = null;
let isSigningIn = false;

// Configure provider with Chat scopes
const chatGoogleProvider = new GoogleAuthProvider();
CHAT_SCOPES.forEach((scope) => {
  chatGoogleProvider.addScope(scope);
});
chatGoogleProvider.setCustomParameters({
  prompt: 'consent select_account'
});

export const signInWithGoogleChat = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, chatGoogleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Falha ao obter token de acesso do Google Workspace.');
    }
    cachedChatAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedChatAccessToken };
  } catch (error) {
    console.error('[Google Chat Auth Error]:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getChatAccessToken = (): string | null => {
  return cachedChatAccessToken;
};

export const setChatAccessToken = (token: string | null) => {
  cachedChatAccessToken = token;
};

export const logoutGoogleChat = async () => {
  await auth.signOut();
  cachedChatAccessToken = null;
};

/**
 * List Google Chat spaces accessible to the user
 */
export const listChatSpaces = async (pageSize = 20): Promise<ChatSpace[]> => {
  if (!cachedChatAccessToken) throw new Error('Não autenticado com o Google Chat.');

  const url = new URL('https://chat.googleapis.com/v1/spaces');
  url.searchParams.set('pageSize', String(pageSize));

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${cachedChatAccessToken}`
    }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Erro ao listar espaços do Google Chat: ${JSON.stringify(err)}`);
  }

  const data = await response.json();
  return data.spaces || [];
};

/**
 * List messages from a specific Google Chat space
 */
export const listChatMessages = async (spaceName: string, pageSize = 30): Promise<ChatMessage[]> => {
  if (!cachedChatAccessToken) throw new Error('Não autenticado com o Google Chat.');

  const url = new URL(`https://chat.googleapis.com/v1/${spaceName}/messages`);
  url.searchParams.set('pageSize', String(pageSize));

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${cachedChatAccessToken}`
    }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Erro ao listar mensagens do chat: ${JSON.stringify(err)}`);
  }

  const data = await response.json();
  return data.messages || [];
};

/**
 * Send a message to a Google Chat space
 * MANDATORY: Requires caller to confirm explicitly with the user
 */
export const sendChatMessage = async (params: SendChatMessageParams): Promise<ChatMessage> => {
  if (!cachedChatAccessToken) throw new Error('Não autenticado com o Google Chat.');

  const url = `https://chat.googleapis.com/v1/${params.spaceName}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cachedChatAccessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: params.text
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Falha ao enviar mensagem no Google Chat: ${JSON.stringify(err)}`);
  }

  return await response.json();
};

/**
 * Create a new space in Google Chat (e.g. for Luanda Operations / Driver Dispatch)
 * MANDATORY: Requires explicit user confirmation
 */
export const createChatSpace = async (params: CreateSpaceParams): Promise<ChatSpace> => {
  if (!cachedChatAccessToken) throw new Error('Não autenticado com o Google Chat.');

  const response = await fetch('https://chat.googleapis.com/v1/spaces', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cachedChatAccessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      displayName: params.displayName,
      spaceType: params.spaceType || 'SPACE',
      spaceDetails: {
        description: params.description || 'Canal operacional da plataforma RIDING.ao em Luanda'
      }
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Falha ao criar espaço no Google Chat: ${JSON.stringify(err)}`);
  }

  return await response.json();
};
