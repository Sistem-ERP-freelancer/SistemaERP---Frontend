import { CampoCnpjComConsulta } from '@/components/CampoCnpjComConsulta';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { formatCEP, formatTelefone, telefoneArmazenadoParaCampo } from '@/lib/validators';
import { cepService } from '@/services/cep.service';
import { ConsultaCnpjResponse } from '@/services/cnpj.service';
import { Tenant } from '@/services/tenants.service';
import {
  EMPRESA_FORM_PADRAO,
  tenantParaFormEmpresa,
  UpdateTenantEmpresaDto,
} from '@/types/tenant-empresa';
import {
  Building2,
  FileText,
  Globe,
  KeyRound,
  Loader2,
  MapPin,
  Receipt,
  Save,
  Search,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface EmpresaConfigSectionProps {
  tenantInfo?: Tenant;
  loading: boolean;
  error: unknown;
  canEdit: boolean;
  saving: boolean;
  onSave: (data: UpdateTenantEmpresaDto) => void;
}

export function EmpresaConfigSection({
  tenantInfo,
  loading,
  error,
  canEdit,
  saving,
  onSave,
}: EmpresaConfigSectionProps) {
  const [form, setForm] = useState<UpdateTenantEmpresaDto>(EMPRESA_FORM_PADRAO);
  const [buscandoCep, setBuscandoCep] = useState(false);

  useEffect(() => {
    if (tenantInfo) {
      setForm(tenantParaFormEmpresa(tenantInfo));
    }
  }, [tenantInfo]);

  const setField = <K extends keyof UpdateTenantEmpresaDto>(
    key: K,
    value: UpdateTenantEmpresaDto[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCnpjPreencher = (dados: ConsultaCnpjResponse) => {
    setForm((prev) => ({
      ...prev,
      nome: dados.razaoSocial || prev.nome,
      nomeFantasia: dados.nomeFantasia || prev.nomeFantasia,
      inscricaoEstadual: dados.inscricaoEstadual || prev.inscricaoEstadual,
      cep: dados.cep || prev.cep,
      logradouro: dados.logradouro || prev.logradouro,
      numero: dados.numero || prev.numero,
      bairro: dados.bairro || prev.bairro,
      cidade: dados.cidade || prev.cidade,
      estado: dados.uf || prev.estado,
      telefone: dados.telefones?.[0]
        ? telefoneArmazenadoParaCampo(dados.telefones[0])
        : prev.telefone,
    }));
    if (dados.cep) {
      void buscarCep(dados.cep);
    }
  };

  const buscarCep = async (cepInformado?: string) => {
    const cep = cepInformado || form.cep;
    if (!cep?.replace(/\D/g, '')) {
      toast.error('Informe um CEP válido.');
      return;
    }
    setBuscandoCep(true);
    try {
      const dados = await cepService.buscar(cep);
      setForm((prev) => ({
        ...prev,
        cep: dados.cep,
        logradouro: dados.logradouro || prev.logradouro,
        complemento: dados.complemento || prev.complemento,
        bairro: dados.bairro || prev.bairro,
        cidade: dados.cidade,
        estado: dados.estado,
        codigoIbge: dados.codigoIbge,
      }));
      toast.success('CEP encontrado.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao buscar CEP.');
    } finally {
      setBuscandoCep(false);
    }
  };

  const disabled = !canEdit || saving;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Carregando informações da empresa...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-6">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Não foi possível carregar as informações da empresa.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!tenantInfo) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Não foi possível obter os dados da empresa.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Empresa
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Dados cadastrais, endereço, fiscal e integração NF-e (Spedy)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="default"
            className={
              tenantInfo.status === 'ATIVO'
                ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
            }
          >
            {tenantInfo.status || 'ATIVO'}
          </Badge>
          {tenantInfo.subdominio && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" />
              {tenantInfo.subdominio}
            </span>
          )}
        </div>
      </div>

      {!canEdit && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4 text-sm text-amber-600 dark:text-amber-400">
            Apenas Administradores podem editar estes dados. Você está em modo de visualização.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Dados cadastrais
          </CardTitle>
          <CardDescription>Razão social, documentos e contato do emitente</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Razão social *</Label>
            <Input
              value={form.nome}
              onChange={(e) => setField('nome', e.target.value)}
              disabled={disabled}
              placeholder="Empresa LTDA"
            />
          </div>
          <div className="space-y-2">
            <Label>Nome fantasia</Label>
            <Input
              value={form.nomeFantasia}
              onChange={(e) => setField('nomeFantasia', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label>CNPJ</Label>
            {canEdit ? (
              <CampoCnpjComConsulta
                value={form.cnpj || ''}
                onChange={(v) => setField('cnpj', v)}
                onPreencherCampos={handleCnpjPreencher}
                tipoConsulta="geral"
              />
            ) : (
              <Input value={form.cnpj || '—'} disabled />
            )}
          </div>
          <div className="space-y-2">
            <Label>Inscrição estadual (IE)</Label>
            <Input
              value={form.inscricaoEstadual}
              onChange={(e) => setField('inscricaoEstadual', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label>CNAE</Label>
            <Input
              value={form.cnae}
              onChange={(e) => setField('cnae', e.target.value)}
              disabled={disabled}
              placeholder="4637-1/00"
            />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input
              value={telefoneArmazenadoParaCampo(form.telefone)}
              onChange={(e) => setField('telefone', formatTelefone(e.target.value))}
              disabled={disabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Endereço
          </CardTitle>
          <CardDescription>Endereço fiscal da empresa (emitente na NF-e)</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>CEP</Label>
            <div className="flex gap-2">
              <Input
                value={form.cep}
                onChange={(e) => setField('cep', formatCEP(e.target.value))}
                disabled={disabled}
                placeholder="00000-000"
                maxLength={9}
              />
              {canEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => void buscarCep()}
                  disabled={buscandoCep || saving}
                  title="Buscar CEP"
                >
                  {buscandoCep ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Código IBGE</Label>
            <Input
              value={form.codigoIbge}
              onChange={(e) => setField('codigoIbge', e.target.value.replace(/\D/g, ''))}
              disabled={disabled}
              placeholder="Preenchido pela busca de CEP"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Logradouro</Label>
            <Input
              value={form.logradouro}
              onChange={(e) => setField('logradouro', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label>Número</Label>
            <Input
              value={form.numero}
              onChange={(e) => setField('numero', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label>Complemento</Label>
            <Input
              value={form.complemento}
              onChange={(e) => setField('complemento', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label>Bairro</Label>
            <Input
              value={form.bairro}
              onChange={(e) => setField('bairro', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input
              value={form.cidade}
              onChange={(e) => setField('cidade', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label>UF</Label>
            <Input
              value={form.estado}
              onChange={(e) => setField('estado', e.target.value.toUpperCase().slice(0, 2))}
              disabled={disabled}
              maxLength={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Fiscal
          </CardTitle>
          <CardDescription>Padrões usados ao emitir NF-e de venda</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Regime tributário</Label>
            <Select
              value={form.regimeTributario}
              onValueChange={(v) =>
                setField('regimeTributario', v as UpdateTenantEmpresaDto['regimeTributario'])
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SIMPLES_NACIONAL">Simples Nacional</SelectItem>
                <SelectItem value="REGIME_NORMAL">Regime Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo de presença</Label>
            <Select
              value={form.presenceType}
              onValueChange={(v) => setField('presenceType', v)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="presence">Presencial (loja)</SelectItem>
                <SelectItem value="internet">Internet</SelectItem>
                <SelectItem value="homeDelivery">Entrega em domicílio</SelectItem>
                <SelectItem value="telephone">Telefone</SelectItem>
                <SelectItem value="others">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Natureza da operação</Label>
            <Input
              value={form.operationNature}
              onChange={(e) => setField('operationNature', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label>CFOP interno (mesmo estado)</Label>
            <Input
              value={form.cfopInterno}
              onChange={(e) => setField('cfopInterno', e.target.value.replace(/\D/g, ''))}
              disabled={disabled}
              maxLength={4}
            />
          </div>
          <div className="space-y-2">
            <Label>CFOP interestadual</Label>
            <Input
              value={form.cfopInterestadual}
              onChange={(e) => setField('cfopInterestadual', e.target.value.replace(/\D/g, ''))}
              disabled={disabled}
              maxLength={4}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
            <div>
              <Label className="text-sm font-medium">Consumidor final padrão</Label>
              <p className="text-xs text-muted-foreground">
                Corresponde ao campo isFinalCustomer da Spedy
              </p>
            </div>
            <Switch
              checked={!!form.isFinalCustomer}
              onCheckedChange={(v) => setField('isFinalCustomer', v)}
              disabled={disabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Integração NF-e (Spedy)
          </CardTitle>
          <CardDescription>Credenciais e ambiente para emissão de notas</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>API Key</Label>
            <Input
              type="password"
              value={form.spedyApiKey}
              onChange={(e) => setField('spedyApiKey', e.target.value)}
              disabled={disabled}
              placeholder={canEdit ? 'Cole a chave da Spedy' : '••••••••'}
            />
            {canEdit && (
              <p className="text-xs text-muted-foreground">
                Deixe em branco ou mantenha os pontos para não alterar a chave já salva.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Ambiente</Label>
            <Select
              value={form.spedyAmbiente}
              onValueChange={(v) =>
                setField('spedyAmbiente', v as UpdateTenantEmpresaDto['spedyAmbiente'])
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="homologacao">Homologação</SelectItem>
                <SelectItem value="producao">Produção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
            <div>
              <Label className="text-sm font-medium">Enviar DANFE por e-mail</Label>
              <p className="text-xs text-muted-foreground">Padrão ao emitir NF-e (sendEmailToCustomer)</p>
            </div>
            <Switch
              checked={!!form.sendEmailToCustomer}
              onCheckedChange={(v) => setField('sendEmailToCustomer', v)}
              disabled={disabled}
            />
          </div>
        </CardContent>
      </Card>

      {canEdit && (
        <div className="flex justify-end">
          <Button
            onClick={() => onSave(form)}
            disabled={saving || !form.nome?.trim()}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar empresa
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
