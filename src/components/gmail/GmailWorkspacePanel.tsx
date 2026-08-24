import React, { useState, useEffect } from 'react';
import {
  signInWithGoogleGmail,
  logoutGmail,
  fetchGmailProfile,
  listGmailMessages,
  sendGmailMessage,
  GmailMessageSummary,
  GmailProfile
} from '../../services/gmailService';
import {
  Mail,
  Send,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  Shield,
  Clock,
  Sparkles,
  Inbox,
  LogOut
} from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { formatAOA } from '../../utils/geohashUtils';

export const GmailWorkspacePanel: React.FC = () => {
  const { activeTrip, financialTransactions } = useSystem();

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(false);
  const [profile, setProfile] = useState<GmailProfile | null>(null);

  // Email List State
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageSummary | null>(null);

  // Composer Form State
  const [recipient, setRecipient] = useState<string>('passageiro@riding.ao');
  const [subject, setSubject] = useState<string>('RIDING.ao - Recibo Oficial de Viagem em Luanda');
  const [bodyContent, setBodyContent] = useState<string>(
    `Olá,\n\nAgradecemos por viajar com a RIDING.ao em Luanda!\n\nDetalhes da Corrida:\n- Origem: Aeroporto 4 de Fevereiro\n- Destino: Marginal de Luanda\n- Tarifa: 4.200 AOA\n- Pagamento: Multicaixa Express (AppyPay GPO)\n\nAtenciosamente,\nEquipa Operacional RIDING.ao`
  );
  const [isSending, setIsSending] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Destructive / Mutating Action Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const handleLogin = async () => {
    setIsLoadingAuth(true);
    try {
      const res = await signInWithGoogleGmail();
      setIsAuthenticated(true);
      setStatusMessage(`Autenticado com sucesso no Google Workspace (${res.user.email})`);
      loadInbox();
      loadProfile();
    } catch (err) {
      console.error(err);
      setStatusMessage('Falha ao conectar com o Google Workspace.');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    await logoutGmail();
    setIsAuthenticated(false);
    setProfile(null);
    setMessages([]);
    setSelectedMessage(null);
    setStatusMessage('Sessão Google Workspace encerrada.');
  };

  const loadProfile = async () => {
    try {
      const prof = await fetchGmailProfile();
      setProfile(prof);
    } catch (e) {
      console.warn('Could not fetch profile:', e);
    }
  };

  const loadInbox = async (query = searchQuery) => {
    setIsLoadingMessages(true);
    try {
      const list = await listGmailMessages(query, 12);
      setMessages(list);
      if (list.length > 0 && !selectedMessage) {
        setSelectedMessage(list[0]);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setStatusMessage('Erro ao buscar mensagens do Gmail.');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Pre-fill Template Handlers
  const handleLoadReceiptTemplate = () => {
    const lastTx = financialTransactions[0];
    const amountStr = lastTx ? formatAOA(lastTx.amountAOA) : '4.200 AOA';
    const txId = lastTx?.merchantTransactionID || 'RIDING_trip_892102_01';

    setSubject(`RIDING.ao - Recibo da Corrida #${txId}`);
    setBodyContent(
      `Prezado(a) Passageiro(a),\n\nSegue o comprovativo oficial da sua viagem:\n\n• Código da Transação: ${txId}\n• Valor Pago: ${amountStr}\n• Método: Multicaixa Express (AppyPay Soberano)\n• Cidade: Luanda, Angola\n\nQualquer dúvida, responda diretamente a este e-mail.\n\nAtenciosamente,\nOperações RIDING.ao Luanda`
    );
  };

  const handleLoadDriverWelcomeTemplate = () => {
    setSubject('RIDING.ao - Boas-vindas à Frota de Luanda (85% de Repasse)');
    setBodyContent(
      `Prezado(a) Motorista parceiro(a),\n\nSeu cadastro no RIDING.ao foi verificado e aprovado com sucesso!\n\nCondições Operacionais:\n- 85% dos ganhos líquidos são seus (repasse direto).\n- 15% taxa de manutenção da plataforma.\n- Liquidação automática diária via Multicaixa.\n\nAbra o seu aplicativo e fique online quando desejar.\n\nAtenciosamente,\nGestão de Motoristas RIDING.ao`
    );
  };

  const handleTriggerSendWithConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !subject || !bodyContent) {
      setStatusMessage('Preencha todos os campos do e-mail.');
      return;
    }
    // MANDATORY USER CONFIRMATION MODAL
    setShowConfirmModal(true);
  };

  const handleConfirmSend = async () => {
    setShowConfirmModal(false);
    setIsSending(true);
    try {
      await sendGmailMessage({
        to: recipient,
        subject,
        bodyText: bodyContent
      });
      setStatusMessage(`✅ E-mail enviado com sucesso para ${recipient} via Gmail API!`);
      loadInbox();
    } catch (err) {
      console.error(err);
      setStatusMessage(`❌ Erro ao enviar e-mail: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-neutral-200 font-sans space-y-4">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">
                Integração Google Workspace & Gmail (RIDING.ao)
              </h2>
              <span className="bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                API v1
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono">
              Envio e Gestão Oficial de Recibos, Notificações de Pagamento e Comunicação com Usuários de Luanda
            </p>
          </div>
        </div>

        {/* Auth Control Header */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs font-mono">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-white">{profile?.emailAddress || 'Conectado'}</span>
              <button
                onClick={handleLogout}
                className="ml-2 text-neutral-400 hover:text-red-400 transition-colors p-1"
                title="Desconectar do Gmail"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Official Google Sign-In button styling */
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

      {/* Status Feedback Toast */}
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
            <Mail className="w-6 h-6 text-red-400" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-white">Conectar ao Google Workspace</h3>
            <p className="text-xs text-neutral-400">
              Autentique-se com sua conta Google para enviar recibos oficiais do RIDING.ao, despachar notificações e consultar a caixa de entrada de suporte.
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
          {/* Left Column: Messages List (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            {/* Search & Actions bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Pesquisar e-mails (ex.: Recibo, RIDING)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadInbox(searchQuery)}
                  className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono placeholder:text-neutral-500"
                />
              </div>
              <button
                onClick={() => loadInbox(searchQuery)}
                disabled={isLoadingMessages}
                className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs transition-colors"
                title="Recarregar Caixa de Entrada"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingMessages ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>

            {/* List */}
            <div className="border border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-800/80 bg-neutral-900/40 max-h-[500px] overflow-y-auto">
              {isLoadingMessages ? (
                <div className="p-6 text-center text-xs text-neutral-400 font-mono">
                  Carregando mensagens da conta Gmail...
                </div>
              ) : messages.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-500 font-mono">
                  Nenhuma mensagem encontrada para o filtro atual.
                </div>
              ) : (
                messages.map((msg) => {
                  const isSelected = selectedMessage?.id === msg.id;
                  return (
                    <div
                      key={msg.id}
                      onClick={() => setSelectedMessage(msg)}
                      className={`p-3 cursor-pointer transition-colors text-xs ${
                        isSelected ? 'bg-neutral-800/90 border-l-2 border-red-500' : 'hover:bg-neutral-900/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-white truncate max-w-[200px]">
                          {msg.from || 'Remetente Desconhecido'}
                        </span>
                        {msg.date && (
                          <span className="text-[10px] text-neutral-500 shrink-0 font-mono">
                            {new Date(msg.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <div className="text-neutral-300 font-medium truncate">{msg.subject}</div>
                      <div className="text-[11px] text-neutral-400 truncate mt-0.5">{msg.snippet}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Email Detail & Composer (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Quick Templates Strip */}
            <div className="flex items-center gap-2 flex-wrap text-xs bg-neutral-900/60 p-2 rounded-lg border border-neutral-800">
              <span className="text-neutral-400 font-mono text-[11px] flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-[#FFC107]" />
                Templates Oficiais:
              </span>
              <button
                type="button"
                onClick={handleLoadReceiptTemplate}
                className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] font-mono border border-neutral-700"
              >
                + Recibo Viagem RIDING
              </button>
              <button
                type="button"
                onClick={handleLoadDriverWelcomeTemplate}
                className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] font-mono border border-neutral-700"
              >
                + Boas-vindas Motorista
              </button>
            </div>

            {/* Email Composer Form */}
            <form
              onSubmit={handleTriggerSendWithConfirmation}
              className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-3.5 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                  <Send className="w-3.5 h-3.5 text-red-400" />
                  Novo E-mail Oficial (Gmail API)
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">Remetente: {profile?.emailAddress}</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 text-xs font-mono">
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Destinatário (Para:)</label>
                  <input
                    type="email"
                    required
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="ex.: passageiro@cliente.ao"
                    className="w-full bg-neutral-950 border border-neutral-700 text-white rounded p-1.5 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Assunto</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Assunto da mensagem"
                    className="w-full bg-neutral-950 border border-neutral-700 text-white rounded p-1.5 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Corpo da Mensagem</label>
                  <textarea
                    required
                    rows={6}
                    value={bodyContent}
                    onChange={(e) => setBodyContent(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 text-white rounded p-2 text-xs font-mono resize-y"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-neutral-500 font-mono">
                  * Ação de envio requer confirmação expressa do operador.
                </span>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Despachando...' : 'Enviar E-mail Oficial'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANDATORY EXPLICIT USER CONFIRMATION MODAL FOR DESTRUCTIVE / MUTATING ACTIONS */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-md w-full p-5 space-y-4 text-neutral-200 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Confirmar Envio de E-mail</h3>
                <p className="text-xs text-neutral-400">Esta ação enviará uma mensagem real pela API do Gmail.</p>
              </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-1.5 text-xs font-mono">
              <div>
                <span className="text-neutral-500">Destinatário:</span> <strong className="text-white">{recipient}</strong>
              </div>
              <div>
                <span className="text-neutral-500">Assunto:</span> <span className="text-neutral-200">{subject}</span>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400">
              Tem a certeza de que deseja autorizar o envio imediato desta mensagem em nome da sua conta Google Workspace?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSend}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-md"
              >
                Confirmar e Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
