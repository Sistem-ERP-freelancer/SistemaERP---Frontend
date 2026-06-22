import { UpdateTenantEmpresaDto } from '@/types/tenant-empresa';
import { apiClient } from './api';

export interface SpedyTenantStatus {
  integracao_ativa: boolean;
  company_id: string | null;
  ambiente: 'homologacao' | 'producao';
  cadastro_automatico_disponivel: boolean;
  pode_ativar: boolean;
  send_email_to_customer: boolean;
}

export interface SpedyAtivarResult {
  tenant_codigo: string;
  company_id: string;
  ambiente: 'homologacao' | 'producao';
  message: string;
}

function formParaAtivarSpedy(
  form: UpdateTenantEmpresaDto,
  senhaCertificado?: string,
): FormData {
  const fd = new FormData();
  const append = (key: string, value: string | undefined | null) => {
    if (value != null && String(value).trim() !== '') {
      fd.append(key, String(value).trim());
    }
  };

  append('nomeFantasia', form.nomeFantasia || form.nome);
  append('razaoSocial', form.nome);
  append('documento', form.cnpj?.replace(/\D/g, ''));
  append('inscricaoEstadual', form.inscricaoEstadual);
  append('email', form.email);
  append('telefone', form.telefone?.replace(/\D/g, ''));
  append('cep', form.cep?.replace(/\D/g, ''));
  append('logradouro', form.logradouro);
  append('numero', form.numero);
  append('complemento', form.complemento);
  append('bairro', form.bairro);
  append('cidade', form.cidade);
  append('estado', form.estado);
  append('codigoIbge', form.codigoIbge?.replace(/\D/g, ''));
  if (form.regimeTributario) {
    fd.append('regimeTributario', form.regimeTributario);
  }
  append('cnae', form.cnae?.replace(/\D/g, ''));
  append('senhaCertificado', senhaCertificado);
  if (form.spedyAmbiente) {
    fd.append('ambiente', form.spedyAmbiente);
  }

  return fd;
}

export const spedyService = {
  obterStatus(): Promise<SpedyTenantStatus> {
    return apiClient.get<SpedyTenantStatus>('/tenant/me/spedy/status');
  },

  ativar(
    form: UpdateTenantEmpresaDto,
    certificado?: File,
    senhaCertificado?: string,
  ): Promise<SpedyAtivarResult> {
    const fd = formParaAtivarSpedy(form, senhaCertificado);
    if (certificado) {
      fd.append('certificado', certificado);
    }
    return apiClient.postForm<SpedyAtivarResult>('/tenant/me/spedy/ativar', fd);
  },
};
