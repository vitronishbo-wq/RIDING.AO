import React, { useState, useEffect } from 'react';
import {
  signInWithGoogleChat,
  logoutGoogleChat,
  listChatSpaces,
  listChatMessages,
  sendChatMessage,
  createChatSpace,
  ChatSpace,
  ChatMessage
} from '../../services/chatService';
import {
  MessageSquare,
  Send,
  RefreshCw,
  Plus,
  Users,
  AlertTriangle,
  CheckCircle2,
  Radio,
  Compass,
  Zap,
  LogOut,
  Hash,
  ShieldCheck,
  Building,
  Bell
} from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { formatAOA } from '../../utils/geohashUtils';

export const GoogleChatWorkspacePanel: React.FC = () => {
  const { financialTransactions, activeTrip } = useSystem();

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(false);

  // Spaces State
  const [spaces, setSpaces] = useState<ChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<ChatSpace | null>(null);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState<boolean>(false);

  // Messages State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [messageInput, setMessageInput] = useState<string>('');
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);

  // Status & Feedback Toast
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Modal State for Confirmations
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    details: string;
    confirmText: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  // Create Space Form State
  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState<boolean>(false);
  const [newSpaceName, setNewSpaceName] = useState<string>('RIDING.ao - Despacho Luanda');
  const [newSpaceDesc, setNewSpaceDesc] = useState<string>('Canal oficial de despacho de corridas e suporte a motoristas parceiros');
  const [isCreatingSpace, setIsCreatingSpace] = useState<boolean>(false);

  const handleLogin = async () => {
    setIsLoadingAuth(true);
    try {
      const res = await signInWithGoogleChat();
      setIsAuthenticated(true);
      setUserEmail(res.user.email);
      setStatusMessage(`Autenticado com sucesso no Google Chat (${res.user.email})`);
      loadSpaces();
    } catch (err) {
      console.error('Google Chat login error:', err);
      setStatusMessage('Falha ao autenticar com o Google Chat.');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogleChat();
    setIsAuthenticated(false);
    setUserEmail(null);
    setSpaces([]);
    setSelectedSpace(null);
    setMessages([]);
    setStatusMessage('Sessão do Google Chat encerrada.');
  };

  const loadSpaces = async () => {
    setIsLoadingSpaces(true);
    try {
      const list = await listChatSpaces();
      setSpaces(list);
      if (list.length > 0 && !selectedSpace) {
        setSelectedSpace(list[0]);
        loadMessages(list[0].name);
      }
    } catch (err) {
      console.error('Error fetching spaces:', err);
      setStatusMessage('Erro ao carregar espaços do Google Chat.');
    } finally {
      setIsLoadingSpaces(false);
    }
  };

  const loadMessages = async (spaceName: string) => {
    setIsLoadingMessages(true);
    try {
      const msgs = await listChatMessages(spaceName);
      setMessages(msgs);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setStatusMessage('Erro ao carregar mensagens do espaço.');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSelectSpace = (space: ChatSpace) => {
    setSelectedSpace(space);
    loadMessages(space.name);
  };

  // Dispatch Quick Templates
  const handleApplyTemplate = (type: 'incident' | 'traffic' | 'settlement') => {
    const lastTx = financialTransactions[0];
    const amountFormatted = lastTx ? formatAOA(lastTx.amountAOA) : '4.200 AOA';

    if (type === 'traffic') {
      setMessageInput(
        `🚨 [ALERTA DE TRÁFEGO - LUANDA] Congestionamento intenso na Av. Deolinda Rodrigues sentido Viana. Recomenda-se desvio pela Via Expressa / Talatona para os motoristas online.`
      );
    } else if (type === 'incident') {
      setMessageInput(
        `⚠️ [INCIDENTE OPERACIONAL] Corrida solicitada com tempo de espera superior a 5 minutos na Zona 1 (Ingombota). Priorizar despacho para viaturas próximas.`
      );
    } else if (type === 'settlement') {
      setMessageInput(
        `💰 [FECHAMENTO DIÁRIO DE LIQUIDAÇÃO] Lote de repasse de 85% dos ganhos aos motoristas processado com sucesso via Multicaixa Express / AppyPay. Total liquidado: ${amountFormatted}.`
      );
    }
  };

  // Trigger Send with Mandatory Confirmation Dialog
  const handleTriggerSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpace) {
      setStatusMessage('Selecione um espaço do Google Chat primeiro.');
      return;
    }
    if (!messageInput.trim()) return;

    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Envio de Mensagem no Google Chat',
      description: 'Esta ação enviará uma mensagem em tempo real para o canal selecionado.',
      details: `Espaço: ${selectedSpace.displayName || selectedSpace.name}\nMensagem: "${messageInput}"`,
      confirmText: 'Enviar Mensagem',
      onConfirm: async () => {
        setIsSendingMessage(true);
        try {
          await sendChatMessage({
            spaceName: selectedSpace.name,
            text: messageInput
          });
          setMessageInput('');
          setStatusMessage('✅ Mensagem enviada com sucesso no Google Chat!');
          loadMessages(selectedSpace.name);
        } catch (err) {
          console.error(err);
          setStatusMessage(`❌ Erro ao enviar mensagem: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
          setIsSendingMessage(false);
          setConfirmModal(null);
        }
      }
    });
  };

  // Trigger Create Space with Mandatory Confirmation Dialog
  const handleTriggerCreateSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim()) return;

    setConfirmModal({
      isOpen: true,
      title: 'Criar Novo Espaço no Google Chat',
      description: 'Será criado um novo espaço de conversa no seu Google Workspace.',
      details: `Nome: ${newSpaceName}\nDescrição: ${newSpaceDesc}`,
      confirmText: 'Criar Espaço',
      onConfirm: async () => {
        setIsCreatingSpace(true);
        try {
          const created = await createChatSpace({
            displayName: newSpaceName,
            description: newSpaceDesc
          });
          setShowCreateSpaceModal(false);
          setStatusMessage(`✅ Espaço "${newSpaceName}" criado com sucesso!`);
          loadSpaces();
          setSelectedSpace(created);
        } catch (err) {
          console.error(err);
          setStatusMessage(`❌ Erro ao criar espaço: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
          setIsCreatingSpace(false);
          setConfirmModal(null);
        }
      }
    });
  };

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-neutral-200 font-sans space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">
                Central de Mensageria Google Chat (RIDING.ao)
              </h2>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                Workspace API v1
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono">
              Comunicação em Tempo Real, Alertas de Frota em Luanda e Despacho Operacional
            </p>
          </div>
        </div>

        {/* Auth Control Header */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs font-mono">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-white">{userEmail || 'Conectado'}</span>
              <button
                onClick={handleLogout}
                className="ml-2 text-neutral-400 hover:text-red-400 transition-colors p-1"
                title="Desconectar do Google Chat"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Official Google Sign-in Button */
            <button
              onClick={handleLogin}
              disabled={isLoadingAuth}
              className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-900 rounded-lg text-xs font-medium font-sans shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isLoadingAuth ? 'Conectando...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast Feedback */}
      {statusMessage && (
        <div className="p-2.5 bg-neutral-900 border border-emerald-500/50 text-emerald-300 rounded text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-neutral-500 hover:text-white text-[10px]">
            Fechar
          </button>
        </div>
      )}

      {/* Main Workspace Body */}
      {!isAuthenticated ? (
        <div className="py-12 px-4 text-center bg-neutral-900/40 border border-neutral-800 rounded-xl space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400">
            <MessageSquare className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-white">Conectar ao Google Chat</h3>
            <p className="text-xs text-neutral-400">
              Autentique-se com sua conta corporativa Google Workspace para gerenciar espaços operacionais do RIDING.ao, despachar notificações e coordenar a frota de Luanda.
            </p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={handleLogin}
              disabled={isLoadingAuth}
              className="flex items-center gap-2.5 px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-900 rounded-lg text-xs font-semibold shadow-md transition-all active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Spaces Browser (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-emerald-400" />
                Espaços Operacionais ({spaces.length})
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowCreateSpaceModal(true)}
                  className="p-1 bg-[#005A2B] hover:bg-[#004722] text-white rounded text-xs flex items-center gap-1 font-mono px-2 py-0.5"
                  title="Criar novo espaço operacional"
                >
                  <Plus className="w-3 h-3" />
                  <span>Novo</span>
                </button>
                <button
                  onClick={loadSpaces}
                  disabled={isLoadingSpaces}
                  className="p-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs"
                  title="Recarregar Espaços"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSpaces ? 'animate-spin text-emerald-400' : ''}`} />
                </button>
              </div>
            </div>

            <div className="border border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-800/80 bg-neutral-900/40 max-h-[500px] overflow-y-auto">
              {isLoadingSpaces ? (
                <div className="p-6 text-center text-xs text-neutral-400 font-mono">
                  Carregando espaços do Google Chat...
                </div>
              ) : spaces.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-500 font-mono space-y-2">
                  <p>Nenhum espaço encontrado no Google Workspace.</p>
                  <button
                    onClick={() => setShowCreateSpaceModal(true)}
                    className="px-2.5 py-1 bg-[#005A2B] text-white rounded text-[11px]"
                  >
                    Criar Canal "Despacho Luanda"
                  </button>
                </div>
              ) : (
                spaces.map((space) => {
                  const isSelected = selectedSpace?.name === space.name;
                  return (
                    <div
                      key={space.name}
                      onClick={() => handleSelectSpace(space)}
                      className={`p-3 cursor-pointer transition-colors text-xs ${
                        isSelected ? 'bg-neutral-800/90 border-l-2 border-emerald-500' : 'hover:bg-neutral-900/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="font-semibold text-white truncate flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{space.displayName || space.name.replace('spaces/', 'Espaço ')}</span>
                        </div>
                        <span className="text-[9px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded font-mono">
                          {space.spaceType || 'SPACE'}
                        </span>
                      </div>
                      {space.spaceDetails?.description && (
                        <div className="text-[11px] text-neutral-400 truncate">
                          {space.spaceDetails.description}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Chat Feed & Dispatch Controls (8 cols) */}
          <div className="lg:col-span-8 space-y-3">
            {/* Active Space Header */}
            <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-bold text-white font-mono">
                  {selectedSpace ? (selectedSpace.displayName || selectedSpace.name) : 'Selecione um Espaço'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => selectedSpace && loadMessages(selectedSpace.name)}
                  disabled={!selectedSpace || isLoadingMessages}
                  className="p-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs flex items-center gap-1 px-2 font-mono"
                  title="Atualizar mensagens"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingMessages ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>Atualizar</span>
                </button>
              </div>
            </div>

            {/* Quick Templates Bar */}
            <div className="flex items-center gap-2 flex-wrap text-xs bg-neutral-900/60 p-2 rounded-lg border border-neutral-800">
              <span className="text-neutral-400 font-mono text-[11px] flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-[#FFC107]" />
                Despacho Rápido:
              </span>
              <button
                type="button"
                onClick={() => handleApplyTemplate('traffic')}
                className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 rounded text-[11px] font-mono border border-neutral-700"
              >
                + Alerta Tráfego Luanda
              </button>
              <button
                type="button"
                onClick={() => handleApplyTemplate('incident')}
                className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-rose-300 rounded text-[11px] font-mono border border-neutral-700"
              >
                + Alerta Incidente/Fila
              </button>
              <button
                type="button"
                onClick={() => handleApplyTemplate('settlement')}
                className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-emerald-300 rounded text-[11px] font-mono border border-neutral-700"
              >
                + Liquidação 85% Motoristas
              </button>
            </div>

            {/* Messages Feed */}
            <div className="border border-neutral-800 rounded-xl p-3 bg-neutral-900/30 min-h-[220px] max-h-[300px] overflow-y-auto space-y-2 font-sans">
              {isLoadingMessages ? (
                <div className="text-center py-8 text-xs text-neutral-500 font-mono">
                  Carregando fluxo de mensagens...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-xs text-neutral-500 font-mono">
                  Nenhuma mensagem no espaço selecionado. Seja o primeiro a despachar!
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={msg.name || idx} className="bg-neutral-900/80 border border-neutral-800/80 rounded-lg p-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-white flex items-center gap-1 font-mono">
                        <Users className="w-3 h-3 text-emerald-400" />
                        {msg.sender?.displayName || 'Operador RIDING.ao'}
                      </span>
                      {msg.createTime && (
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {new Date(msg.createTime).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-200 whitespace-pre-wrap">{msg.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Composer */}
            <form onSubmit={handleTriggerSendMessage} className="space-y-2">
              <div className="relative">
                <textarea
                  rows={3}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Escreva a mensagem ou comunicado operacional para o canal..."
                  className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-xl p-3 text-xs font-mono placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-neutral-500 font-mono">
                  * Requer confirmação de envio via Google Chat API.
                </span>
                <button
                  type="submit"
                  disabled={!selectedSpace || !messageInput.trim() || isSendingMessage}
                  className="px-4 py-1.5 bg-[#005A2B] hover:bg-[#004722] text-white rounded-lg text-xs font-medium font-mono flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-[#FFC107]" />
                  <span>{isSendingMessage ? 'Enviando...' : 'Despachar Mensagem'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANDATORY USER CONFIRMATION MODAL FOR DESTRUCTIVE/MUTATING ACTIONS */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-md w-full p-5 space-y-4 text-neutral-200 shadow-2xl animate-in zoom-in-95 font-sans">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{confirmModal.title}</h3>
                <p className="text-xs text-neutral-400">{confirmModal.description}</p>
              </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs font-mono whitespace-pre-wrap text-neutral-300">
              {confirmModal.details}
            </div>

            <p className="text-[11px] text-neutral-400 font-sans">
              Tem certeza de que deseja autorizar a execução desta ação através da API do Google Chat?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => confirmModal.onConfirm()}
                className="px-4 py-1.5 bg-[#005A2B] hover:bg-[#004722] text-white rounded-lg text-xs font-bold shadow-md"
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SPACE MODAL */}
      {showCreateSpaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <form
            onSubmit={handleTriggerCreateSpace}
            className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-md w-full p-5 space-y-4 text-neutral-200 shadow-2xl animate-in zoom-in-95 font-sans"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Criar Espaço Operacional</h3>
                <p className="text-xs text-neutral-400">Novo canal no Google Chat para despachos e frota</p>
              </div>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-neutral-400 block mb-1">Nome do Espaço</label>
                <input
                  type="text"
                  required
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  placeholder="ex.: RIDING.ao - Despacho Luanda"
                  className="w-full bg-neutral-950 border border-neutral-700 text-white rounded-lg p-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Descrição</label>
                <textarea
                  rows={3}
                  value={newSpaceDesc}
                  onChange={(e) => setNewSpaceDesc(e.target.value)}
                  placeholder="Finalidade do espaço..."
                  className="w-full bg-neutral-950 border border-neutral-700 text-white rounded-lg p-2 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateSpaceModal(false)}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isCreatingSpace || !newSpaceName.trim()}
                className="px-4 py-1.5 bg-[#005A2B] hover:bg-[#004722] text-white rounded-lg text-xs font-bold shadow-md"
              >
                {isCreatingSpace ? 'Criando...' : 'Avançar para Confirmação'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
