import { Messages } from './i18n.tokens';

export const PT_BR_MESSAGES: Messages = {
  common: {
    save: 'Salvar', cancel: 'Cancelar', confirm: 'Confirmar',
    delete: 'Excluir', loading: 'Carregando...', noData: 'Nenhum dado encontrado',
  },
  errors: {
    unauthorized: 'Sessão expirada. Faça login novamente.',
    forbidden: 'Você não tem permissão para esta ação.',
    notFound: 'Recurso não encontrado.',
    conflict: 'Conflito: este recurso já existe ou foi modificado.',
    rateLimit: 'Muitas requisições. Aguarde antes de tentar novamente.',
    serverError: 'Erro interno. Por favor, tente novamente.',
  },
  tenant: {
    selectTenant: 'Selecione um Tenant',
    noTenantSelected: 'Nenhum tenant selecionado',
  },
};
