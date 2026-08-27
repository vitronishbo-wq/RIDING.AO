import {
  AppPermission,
  SystemModule,
  UserIdentityProfile,
  BootstrapVaultInfo
} from '../types/architecture';

export const OFFICIAL_PERMISSIONS_CATALOG: Array<{
  id: AppPermission;
  name: string;
  category: 'trip' | 'wallet' | 'finance' | 'admin' | 'system';
  description: string;
}> = [
  { id: 'trip.request', name: 'Solicitar Corrida', category: 'trip', description: 'Cria novas ordens de transporte e estima tarifas em AOA' },
  { id: 'trip.accept', name: 'Aceitar Corrida', category: 'trip', description: 'Recebe despachos geográficos e confirma atendimento' },
  { id: 'trip.cancel', name: 'Cancelar Corrida', category: 'trip', description: 'Encerra solicitação antes ou durante a rota' },
  { id: 'wallet.read', name: 'Consultar Carteira', category: 'wallet', description: 'Visualiza saldo em Kwanzas e extrato pessoal' },
  { id: 'wallet.write', name: 'Movimentar Saldo', category: 'wallet', description: 'Realiza recargas e débitos de tarifas na carteira' },
  { id: 'finance.read', name: 'Auditar Finanças', category: 'finance', description: 'Acessa relatórios contábeis globais e transações EMIS' },
  { id: 'finance.write', name: 'Liquidação Financeira', category: 'finance', description: 'Executa repasses de motoristas e estornos' },
  { id: 'driver.manage', name: 'Gestão de Frotas', category: 'admin', description: 'Aprova CNH, valida vistorias de veículos e bloqueios' },
  { id: 'user.manage', name: 'Gestão de Passageiros', category: 'admin', description: 'Modera contas, bloqueia fraudes e ajusta níveis' },
  { id: 'system.logs', name: 'Logs Operacionais', category: 'system', description: 'Acompanha telemetria e latências de Cloud Run em tempo real' },
  { id: 'system.audit', name: 'Auditoria de Segurança', category: 'system', description: 'Rastreia elevação de privilégios e acessos sensíveis' },
  { id: 'system.config', name: 'Configuração do Sistema', category: 'system', description: 'Altera parâmetros de matching, SLAs e tarifas base' },
  { id: 'system.override', name: 'Override Constitucional', category: 'system', description: 'Comando supremo de infraestrutura e intervenção de emergência' }
];

export const SYSTEM_MODULES: SystemModule[] = [
  {
    id: 'module_trips_passenger',
    name: 'Módulo de Mobilidade (Passageiro)',
    description: 'Solicitação de viagens em Luanda, cálculo tarifário local e acompanhamento do motorista',
    category: 'mobility',
    requiredPermissions: ['trip.request'],
    badge: 'Passageiro'
  },
  {
    id: 'module_trips_driver',
    name: 'Cockpit do Motorista & GPS',
    description: 'Recepção de convites geográficos (15s SLA), GPS adaptativo e fechamento de corrida',
    category: 'mobility',
    requiredPermissions: ['trip.accept'],
    badge: 'Motorista'
  },
  {
    id: 'module_wallet',
    name: 'Carteira Digital (AOA)',
    description: 'Saldos pessoais, extrato de ganhos (85%) e métodos Multicaixa Express',
    category: 'finance',
    requiredPermissions: ['wallet.read'],
    badge: 'Finanças'
  },
  {
    id: 'module_finance_settlement',
    name: 'Controladoria & Liquidação EMIS',
    description: 'Relatórios contábeis, split de receitas 85/15 e conciliação bancária',
    category: 'finance',
    requiredPermissions: ['finance.read', 'finance.write'],
    badge: 'Financeiro'
  },
  {
    id: 'module_fleet_management',
    name: 'Gestão de Motoristas & Documentos',
    description: 'Aprovação de CNH, homologação de placas de Luanda e vistoria veicular',
    category: 'admin',
    requiredPermissions: ['driver.manage'],
    badge: 'Operações'
  },
  {
    id: 'module_user_management',
    name: 'Gestão de Usuários & Moderação',
    description: 'Atendimento a passageiros, resolução de disputas e controle de acesso',
    category: 'admin',
    requiredPermissions: ['user.manage'],
    badge: 'Suporte'
  },
  {
    id: 'module_system_telemetry',
    name: 'Telemetria & SLAs de Infraestrutura',
    description: 'Monitoramento em tempo real de latência de matching, Cloud Run e Firestore',
    category: 'admin',
    requiredPermissions: ['system.logs'],
    badge: 'Infra'
  },
  {
    id: 'module_founder_console',
    name: 'Founder Console & Auditoria Suprema',
    description: 'Controle irrestrito de segurança, parametrização global e auditoria inviolável',
    category: 'security',
    requiredPermissions: ['system.override', 'system.audit'],
    badge: 'Founder Exclusivo'
  }
];

export const PRESET_IDENTITIES: UserIdentityProfile[] = [
  {
    id: 'usr_anon',
    type: 'anonymous',
    name: 'Sessão Não Autenticada',
    emailMasked: 'visitante@public.ao',
    phoneMasked: '+244 9** *** ***',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    defaultPermissions: [],
    description: 'Sessão inicial anônima do Shell antes do login ou discovery.',
    sessionEpoch: 1
  },
  {
    id: 'usr_passenger_domingos',
    type: 'passenger',
    name: 'Domingos Neto',
    emailMasked: 'd*******o@gmail.com',
    phoneMasked: '+244 923 *** 200',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    defaultPermissions: ['trip.request', 'trip.cancel', 'wallet.read', 'wallet.write'],
    description: 'Passageiro frequente de Luanda (Talatona / Marginal / Aeroporto).',
    sessionEpoch: 1
  },
  {
    id: 'usr_driver_manuel',
    type: 'driver',
    name: 'Manuel Sebastião',
    emailMasked: 'm*****o@gobroaao.com',
    phoneMasked: '+244 923 *** 789',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    defaultPermissions: ['trip.accept', 'trip.cancel', 'wallet.read', 'wallet.write'],
    description: 'Motorista parceiro homologado (Hyundai i10 Grand, Placa LD-42-89-HZ).',
    sessionEpoch: 1
  },
  {
    id: 'usr_ops_claudia',
    type: 'ops',
    name: 'Cláudia Benguela',
    emailMasked: 'c*****a@gobroaao.com',
    phoneMasked: '+244 912 *** 554',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop',
    defaultPermissions: ['driver.manage', 'user.manage', 'system.logs'],
    description: 'Operadora da Central de Despacho e Suporte a Motoristas.',
    sessionEpoch: 1
  },
  {
    id: 'usr_admin_kizua',
    type: 'admin',
    name: 'Kizua Lourenço',
    emailMasked: 'k***a@gobroaao.com',
    phoneMasked: '+244 944 *** 112',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    defaultPermissions: ['driver.manage', 'user.manage', 'finance.read', 'finance.write', 'system.logs', 'system.audit', 'system.config'],
    description: 'Administrador de Operações e Finanças do RIDING.AO.',
    sessionEpoch: 1
  }
];

export const BOOTSTRAP_VAULT_INFO: BootstrapVaultInfo = {
  provider: 'Google Cloud Secret Manager',
  environment: 'production',
  status: 'injected_dynamically',
  zeroHardcodedSecretsVerified: true
};
