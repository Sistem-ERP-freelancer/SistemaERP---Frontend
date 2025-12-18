import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cleanDocument, formatCNPJ, formatCPF, formatCEP, formatTelefone } from "@/lib/validators";
import {
  CreateFornecedorDto,
  fornecedoresService,
} from "@/services/fornecedores.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Ban,
  Building2,
  Calendar,
  Check,
  CheckCircle,
  Circle,
  Edit,
  Eye,
  FileText,
  Filter,
  Hash,
  Loader2,
  Mail,
  Mail as MailIcon,
  MapPin,
  MapPin as MapPinIcon,
  Phone,
  Phone as PhoneIcon,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Truck,
  User,
  User as UserIcon,
  Users,
  XCircle,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";

const Fornecedores = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filtrosDialogOpen, setFiltrosDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFornecedorId, setSelectedFornecedorId] = useState<number | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [editCurrentStep, setEditCurrentStep] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [newFornecedor, setNewFornecedor] = useState<CreateFornecedorDto>({
    nome_fantasia: "",
    nome_razao: "",
    tipoFornecedor: "PESSOA_JURIDICA",
    statusFornecedor: "ATIVO",
    cpf_cnpj: "",
    inscricao_estadual: "",
  });
  const [enderecos, setEnderecos] = useState<
    Array<{
      cep: string;
      logradouro: string;
      numero: string;
      complemento: string;
      bairro: string;
      cidade: string;
      estado: string;
      referencia: string;
    }>
  >([
    {
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      referencia: "",
    },
  ]);
  const [contatos, setContatos] = useState<
    Array<{
      telefone: string;
      email: string;
      nomeContato: string;
      observacao: string;
    }>
  >([
    {
      telefone: "",
      email: "",
      nomeContato: "",
      observacao: "",
    },
  ]);
  const [filtrosAvancados, setFiltrosAvancados] = useState({
    tipoFornecedor: "",
    statusFornecedor: "",
    cidade: "",
    estado: "",
    telefone: "",
    email: "",
    nomeContato: "",
  });

  // Estados para edição
  const [editNewFornecedor, setEditNewFornecedor] = useState<CreateFornecedorDto>({
    nome_fantasia: "",
    nome_razao: "",
    tipoFornecedor: "PESSOA_JURIDICA",
    statusFornecedor: "ATIVO",
    cpf_cnpj: "",
    inscricao_estadual: "",
  });
  const [editEnderecos, setEditEnderecos] = useState<
    Array<{
      id?: number;
      cep: string;
      logradouro: string;
      numero: string;
      complemento: string;
      bairro: string;
      cidade: string;
      estado: string;
      referencia: string;
    }>
  >([
    {
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      referencia: "",
    },
  ]);
  const [editContatos, setEditContatos] = useState<
    Array<{
      id?: number;
      telefone: string;
      email: string;
      nomeContato: string;
      observacao: string;
      ativo?: boolean;
    }>
  >([
    {
      telefone: "",
      email: "",
      nomeContato: "",
      observacao: "",
      ativo: true,
    },
  ]);

  // Buscar estatísticas
  const { data: estatisticas, isLoading: isLoadingEstatisticas } = useQuery({
    queryKey: ["fornecedores-estatisticas"],
    queryFn: () => fornecedoresService.getEstatisticas(),
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    retry: false,
  });

  // Verificar se há filtros ativos
  const temFiltrosAtivos = Object.values(filtrosAvancados).some(
    (val) => val !== ""
  );

  // Buscar fornecedores - usa busca avançada se houver filtros, busca simples se houver termo, senão lista todos
  const { 
    data: fornecedoresResponse, 
    isLoading: isLoadingFornecedores 
  } = useQuery({
    queryKey: ["fornecedores", searchTerm, filtrosAvancados, currentPage],
    queryFn: async () => {
      try {
        if (temFiltrosAtivos) {
          // Usa busca avançada quando há filtros
          const response = await fornecedoresService.buscarAvancado({
            termo: searchTerm.trim() || undefined,
            ...filtrosAvancados,
            page: currentPage,
            limit: pageSize,
          });
          return response;
        } else if (searchTerm.trim()) {
          // Usa endpoint de busca quando há termo
          const response = await fornecedoresService.buscar(searchTerm, {
            page: currentPage,
            limit: pageSize,
          });
          return response;
        } else {
          // Lista todos quando não há termo nem filtros
          const response = await fornecedoresService.listar({
            page: currentPage,
            limit: pageSize,
          });
          return response;
        }
      } catch (error: any) {
        console.error("Erro ao buscar fornecedores:", error);
        if (import.meta.env.DEV) {
          console.error("Detalhes do erro:", {
            message: error?.message,
            response: error?.response?.data,
            status: error?.response?.status,
          });
        }
        return {
          data: [],
          fornecedores: [],
          total: 0,
          page: 1,
          limit: pageSize,
          totalPages: 0,
        };
      }
    },
    retry: false,
  });

  // Extrair fornecedores - pode vir em data, fornecedores, ou ser um array direto
  let fornecedores: any[] = [];
  let totalFornecedores = 0;
  
  if (fornecedoresResponse) {
    // Se for array direto
    if (Array.isArray(fornecedoresResponse)) {
      fornecedores = fornecedoresResponse;
      totalFornecedores = fornecedoresResponse.length;
    } 
    // Se tiver propriedade data
    else if (Array.isArray(fornecedoresResponse.data)) {
      fornecedores = fornecedoresResponse.data;
      totalFornecedores = fornecedoresResponse.total || fornecedoresResponse.data.length;
    }
    // Se tiver propriedade fornecedores
    else if (Array.isArray(fornecedoresResponse.fornecedores)) {
      fornecedores = fornecedoresResponse.fornecedores;
      totalFornecedores = fornecedoresResponse.total || fornecedoresResponse.fornecedores.length;
    }
  }
  
  const totalPages = fornecedoresResponse?.totalPages || Math.ceil(totalFornecedores / pageSize);
  const queryClient = useQueryClient();

  // Debug: Log da resposta em desenvolvimento
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("📦 [Fornecedores Debug] ==========");
      console.log("📦 Resposta completa:", fornecedoresResponse);
      console.log("📦 Tipo da resposta:", typeof fornecedoresResponse);
      console.log("📦 É array?", Array.isArray(fornecedoresResponse));
      if (fornecedoresResponse && !Array.isArray(fornecedoresResponse)) {
        console.log("📦 Keys da resposta:", Object.keys(fornecedoresResponse));
      }
      console.log("📦 Fornecedores extraídos:", fornecedores);
      console.log("📦 Quantidade:", fornecedores.length);
      console.log("📦 Total:", totalFornecedores);
      console.log("📦 Total de páginas:", totalPages);
      console.log("📦 ==============================");
    }
  }, [fornecedoresResponse, fornecedores, totalFornecedores, totalPages]);

  // Resetar página quando o termo de busca ou filtros avançados mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtrosAvancados]);

  const resetForm = () => {
    setCurrentStep(1);
    setNewFornecedor({
      nome_fantasia: "",
      nome_razao: "",
      tipoFornecedor: "PESSOA_JURIDICA",
      statusFornecedor: "ATIVO",
      cpf_cnpj: "",
      inscricao_estadual: "",
    });
    setEnderecos([
      {
        cep: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
        referencia: "",
      },
    ]);
    setContatos([
      {
        telefone: "",
        email: "",
        nomeContato: "",
        observacao: "",
      },
    ]);
  };

  // Mutation para criar fornecedor
  const createFornecedorMutation = useMutation({
    mutationFn: async (data: CreateFornecedorDto) => {
      return await fornecedoresService.criar(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      queryClient.invalidateQueries({
        queryKey: ["fornecedores-estatisticas"],
      });
      toast.success("Fornecedor cadastrado com sucesso!");
      resetForm();
      setDialogOpen(false);
    },
    onError: (error: unknown) => {
      const errorMessage = (
        error as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      toast.error(errorMessage || "Erro ao cadastrar fornecedor");
    },
  });

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validação específica por tipo
      if (newFornecedor.tipoFornecedor === "PESSOA_JURIDICA") {
        if (
          !newFornecedor.nome_fantasia ||
          !newFornecedor.nome_razao ||
          !newFornecedor.cpf_cnpj
        ) {
          toast.error(
            "Preencha os campos obrigatórios (Nome Fantasia, Razão Social e CNPJ)"
          );
          return;
        }
      } else {
        if (!newFornecedor.nome_razao || !newFornecedor.cpf_cnpj) {
          toast.error("Preencha os campos obrigatórios (Nome e CPF)");
          return;
        }
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreate = () => {
    // Garantir que nome_fantasia esteja preenchido
    // Para Pessoa Física, usar nome_razao se nome_fantasia estiver vazio
    const nomeFantasia =
      newFornecedor.nome_fantasia ||
      (newFornecedor.tipoFornecedor === "PESSOA_FISICA"
        ? newFornecedor.nome_razao
        : "");

    // Validação final antes de criar
    if (newFornecedor.tipoFornecedor === "PESSOA_JURIDICA") {
      if (
        !newFornecedor.nome_fantasia ||
        !newFornecedor.nome_razao ||
        !newFornecedor.cpf_cnpj
      ) {
        toast.error(
          "Preencha os campos obrigatórios (Nome Fantasia, Razão Social e CNPJ)"
        );
        return;
      }
    } else {
      if (!newFornecedor.nome_razao || !newFornecedor.cpf_cnpj) {
        toast.error("Preencha os campos obrigatórios (Nome e CPF)");
        return;
      }
    }

    // Validar nome_fantasia
    if (!nomeFantasia || nomeFantasia.trim().length === 0) {
      toast.error("O nome fantasia é obrigatório");
      return;
    }

    if (nomeFantasia.length > 255) {
      toast.error("O nome fantasia deve ter no máximo 255 caracteres");
      return;
    }

    // Preparar dados de endereços (filtrar endereços vazios)
    const enderecosValidos = enderecos.filter(
      (end) =>
        end.cep ||
        end.logradouro ||
        end.numero ||
        end.bairro ||
        end.cidade ||
        end.estado
    );

    // Preparar dados de contatos (filtrar contatos vazios)
    const contatosValidos = contatos.filter(
      (cont) => cont.telefone || cont.email || cont.nomeContato
    );

    // Mapear contatos para o formato da API (snake_case)
    const contatosFormatados = contatosValidos.map((cont) => ({
      nome_contato: cont.nomeContato || undefined,
      email: cont.email || undefined,
      telefone: cont.telefone || undefined,
      observacao: cont.observacao || undefined,
      ativo: true,
    }));

    // Preparar payload completo
    const payload = {
      ...newFornecedor,
      nome_fantasia: nomeFantasia,
      enderecos: enderecosValidos.length > 0 ? enderecosValidos : undefined,
      contato: contatosFormatados.length > 0 ? contatosFormatados : undefined,
    };

    createFornecedorMutation.mutate(payload);
  };

  const handleView = (id: number) => {
    setSelectedFornecedorId(id);
    setViewDialogOpen(true);
  };

  const handleEdit = (id: number) => {
    setSelectedFornecedorId(id);
    setEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setSelectedFornecedorId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedFornecedorId) {
      deleteFornecedorMutation.mutate(selectedFornecedorId);
    }
  };

  // Query para buscar fornecedor por ID (para visualização e edição)
  const { data: selectedFornecedor, isLoading: isLoadingFornecedor } = useQuery({
    queryKey: ["fornecedor", selectedFornecedorId],
    queryFn: async () => {
      if (!selectedFornecedorId) return null;
      return await fornecedoresService.buscarPorId(selectedFornecedorId);
    },
    enabled: !!selectedFornecedorId && (viewDialogOpen || editDialogOpen),
    retry: false,
  });

  // Mutation para atualizar status do fornecedor
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number;
      status: "ATIVO" | "INATIVO" | "BLOQUEADO";
    }) => {
      return await fornecedoresService.atualizar(id, { statusFornecedor: status });
    },
    onSuccess: async (data) => {
      // Invalidar todas as queries relacionadas
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["fornecedores"],
          exact: false,
        }),
        queryClient.invalidateQueries({
          queryKey: ["fornecedor", data.id],
        }),
      ]);
      
      // Buscar estatísticas atualizadas diretamente e atualizar o cache
      try {
        const novasEstatisticas = await fornecedoresService.getEstatisticas();
        queryClient.setQueryData(
          ["fornecedores-estatisticas"],
          novasEstatisticas
        );
      } catch (error) {
        // Se falhar, pelo menos invalidar para forçar refetch
        queryClient.invalidateQueries({
          queryKey: ["fornecedores-estatisticas"],
          exact: true,
        });
      }
      
      toast.success(`Status do fornecedor atualizado para ${data.statusFornecedor}!`);
      setUpdatingStatusId(null);
    },
    onError: (error: unknown) => {
      setUpdatingStatusId(null);
      const isErrorWithResponse = (
        err: unknown
      ): err is {
        response?: { status?: number; data?: { message?: string | string[] } };
        message?: string;
      } => {
        return typeof err === "object" && err !== null;
      };

      if (isErrorWithResponse(error)) {
        const errorResponse = error.response?.data;
        const errorMessage =
          errorResponse?.message ||
          (Array.isArray(errorResponse?.message)
            ? errorResponse.message.join(", ")
            : null) ||
          error.message ||
          "Erro ao atualizar status do fornecedor";

        if (error.response?.status === 403) {
          toast.error(
            "Você não tem permissão para atualizar o status. Apenas ADMIN ou GERENTE podem realizar esta ação."
          );
        } else if (error.response?.status === 400) {
          toast.error(
            typeof errorMessage === "string"
              ? errorMessage
              : "Status inválido ou fornecedor não encontrado"
          );
        } else {
          toast.error(
            typeof errorMessage === "string"
              ? errorMessage
              : "Erro ao atualizar status do fornecedor"
          );
        }
      } else {
        toast.error("Erro ao atualizar status do fornecedor");
      }
    },
  });

  // Handler para atualizar status
  const handleStatusChange = (id: number, novoStatus: "ATIVO" | "INATIVO" | "BLOQUEADO") => {
    setUpdatingStatusId(id);
    updateStatusMutation.mutate({ id, status: novoStatus });
  };

  // Mutation para deletar fornecedor
  const deleteFornecedorMutation = useMutation({
    mutationFn: async (id: number) => {
      return await fornecedoresService.deletar(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["fornecedores"],
        exact: false,
      });
      await queryClient.invalidateQueries({
        queryKey: ["fornecedores-estatisticas"],
      });
      toast.success("Fornecedor excluído com sucesso!");
      setDeleteDialogOpen(false);
      setSelectedFornecedorId(null);
    },
    onError: (error: unknown) => {
      const errorMessage = (
        error as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      toast.error(errorMessage || "Erro ao excluir fornecedor");
    },
  });

  // Mutation para atualizar fornecedor
  const updateFornecedorMutation = useMutation({
    mutationFn: async (data: Partial<CreateFornecedorDto>) => {
      if (!selectedFornecedorId) throw new Error("ID do fornecedor não encontrado");
      return await fornecedoresService.atualizar(selectedFornecedorId, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["fornecedores"],
        exact: false,
      });
      await queryClient.invalidateQueries({
        queryKey: ["fornecedor", selectedFornecedorId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["fornecedores-estatisticas"],
      });
      toast.success("Fornecedor atualizado com sucesso!");
      setEditDialogOpen(false);
      setSelectedFornecedorId(null);
    },
    onError: (error: unknown) => {
      const errorMessage = (
        error as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      toast.error(errorMessage || "Erro ao atualizar fornecedor");
    },
  });

  // Carregar dados do fornecedor selecionado no formulário de edição
  useEffect(() => {
    if (selectedFornecedor && editDialogOpen) {
      setEditNewFornecedor({
        nome_fantasia: selectedFornecedor.nome_fantasia || "",
        nome_razao: selectedFornecedor.nome_razao || "",
        tipoFornecedor: selectedFornecedor.tipoFornecedor,
        statusFornecedor: selectedFornecedor.statusFornecedor,
        cpf_cnpj: selectedFornecedor.cpf_cnpj || "",
        inscricao_estadual: selectedFornecedor.inscricao_estadual || "",
      });
      if (selectedFornecedor.enderecos && selectedFornecedor.enderecos.length > 0) {
        setEditEnderecos(
          selectedFornecedor.enderecos.map((end) => ({
            id: end.id,
            cep: end.cep || "",
            logradouro: end.logradouro || "",
            numero: end.numero || "",
            complemento: end.complemento || "",
            bairro: end.bairro || "",
            cidade: end.cidade || "",
            estado: end.estado || "",
            referencia: end.referencia || "",
          }))
        );
      } else {
        setEditEnderecos([
          {
            cep: "",
            logradouro: "",
            numero: "",
            complemento: "",
            bairro: "",
            cidade: "",
            estado: "",
            referencia: "",
          },
        ]);
      }
      if (selectedFornecedor.contato && selectedFornecedor.contato.length > 0) {
        setEditContatos(
          selectedFornecedor.contato.map((cont: any) => ({
            id: cont.id,
            telefone: cont.telefone || "",
            email: cont.email || "",
            nomeContato: cont.nomeContato || cont.nome_contato || "",
            observacao: cont.observacao || "",
            ativo: cont.ativo !== undefined ? cont.ativo : true,
          }))
        );
      } else {
        setEditContatos([
          {
            telefone: "",
            email: "",
            nomeContato: "",
            observacao: "",
            ativo: true,
          },
        ]);
      }
      setEditCurrentStep(1);
    }
  }, [selectedFornecedor, editDialogOpen]);

  const handleAplicarFiltros = () => {
    setFiltrosDialogOpen(false);
    setCurrentPage(1); // Resetar para primeira página ao aplicar filtros
    // A query será atualizada automaticamente pelo React Query
  };

  const handleLimparFiltros = () => {
    setFiltrosAvancados({
      tipoFornecedor: "",
      statusFornecedor: "",
      cidade: "",
      estado: "",
      telefone: "",
      email: "",
      nomeContato: "",
    });
    setFiltrosDialogOpen(false);
    setCurrentPage(1); // Resetar para primeira página ao limpar filtros
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll para o topo da tabela
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fornecedores</h1>
            <p className="text-muted-foreground">Gerencie seus fornecedores</p>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                resetForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="gradient" className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Fornecedor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Truck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl">
                        Novo Fornecedor
                      </DialogTitle>
                      <DialogDescription className="mt-1">
                        Passo {currentStep} de 3
                      </DialogDescription>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Progress value={(currentStep / 3) * 100} className="h-2" />
                </div>
              </DialogHeader>

              <div className="space-y-6 pt-4">
                {/* Passo 1: Informações Básicas */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    {/* Tipo de Fornecedor */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">
                        Tipo de Fornecedor
                      </Label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() =>
                            setNewFornecedor({
                              ...newFornecedor,
                              tipoFornecedor: "PESSOA_JURIDICA",
                              cpf_cnpj:
                                newFornecedor.tipoFornecedor === "PESSOA_FISICA"
                                  ? ""
                                  : newFornecedor.cpf_cnpj,
                              // Limpar nome_fantasia ao mudar para PJ (usuário deve preencher)
                              nome_fantasia:
                                newFornecedor.tipoFornecedor === "PESSOA_FISICA"
                                  ? ""
                                  : newFornecedor.nome_fantasia,
                            })
                          }
                          className={`relative p-6 rounded-lg border-2 transition-all ${
                            newFornecedor.tipoFornecedor === "PESSOA_JURIDICA"
                              ? "border-primary bg-primary/5"
                              : "border-border bg-card hover:border-primary/50"
                          }`}
                        >
                          {newFornecedor.tipoFornecedor ===
                            "PESSOA_JURIDICA" && (
                            <div className="absolute top-3 right-3">
                              <Check className="w-5 h-5 text-primary" />
                            </div>
                          )}
                          <div className="flex flex-col items-center gap-3">
                            <Building2
                              className={`w-8 h-8 ${
                                newFornecedor.tipoFornecedor ===
                                "PESSOA_JURIDICA"
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                            <div className="text-center">
                              <p
                                className={`font-semibold ${
                                  newFornecedor.tipoFornecedor ===
                                  "PESSOA_JURIDICA"
                                    ? "text-primary"
                                    : "text-foreground"
                                }`}
                              >
                                Pessoa Jurídica
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                CNPJ
                              </p>
                            </div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setNewFornecedor({
                              ...newFornecedor,
                              tipoFornecedor: "PESSOA_FISICA",
                              cpf_cnpj:
                                newFornecedor.tipoFornecedor ===
                                "PESSOA_JURIDICA"
                                  ? ""
                                  : newFornecedor.cpf_cnpj,
                              // Limpar nome_fantasia ao mudar para PF (será preenchido automaticamente)
                              nome_fantasia: "",
                            })
                          }
                          className={`relative p-6 rounded-lg border-2 transition-all ${
                            newFornecedor.tipoFornecedor === "PESSOA_FISICA"
                              ? "border-primary bg-primary/5"
                              : "border-border bg-card hover:border-primary/50"
                          }`}
                        >
                          {newFornecedor.tipoFornecedor === "PESSOA_FISICA" && (
                            <div className="absolute top-3 right-3">
                              <Check className="w-5 h-5 text-primary" />
                            </div>
                          )}
                          <div className="flex flex-col items-center gap-3">
                            <User
                              className={`w-8 h-8 ${
                                newFornecedor.tipoFornecedor === "PESSOA_FISICA"
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                            <div className="text-center">
                              <p
                                className={`font-semibold ${
                                  newFornecedor.tipoFornecedor ===
                                  "PESSOA_FISICA"
                                    ? "text-primary"
                                    : "text-foreground"
                                }`}
                              >
                                Pessoa Física
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                CPF
                              </p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Nome Fantasia - Apenas para Pessoa Jurídica */}
                    {newFornecedor.tipoFornecedor === "PESSOA_JURIDICA" && (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          Nome Fantasia *
                        </Label>
                        <Input
                          placeholder="Nome Fantasia da Empresa"
                          value={newFornecedor.nome_fantasia}
                          onChange={(e) =>
                            setNewFornecedor({
                              ...newFornecedor,
                              nome_fantasia: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}

                    {/* Nome / Razão Social */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        {newFornecedor.tipoFornecedor === "PESSOA_JURIDICA"
                          ? "Razão Social"
                          : "Nome"}{" "}
                        *
                      </Label>
                      <Input
                        placeholder={
                          newFornecedor.tipoFornecedor === "PESSOA_JURIDICA"
                            ? "Razão Social da Empresa"
                            : "Nome do fornecedor"
                        }
                        value={newFornecedor.nome_razao}
                        onChange={(e) => {
                          const nomeRazao = e.target.value;
                          setNewFornecedor({
                            ...newFornecedor,
                            nome_razao: nomeRazao,
                            // Para Pessoa Física, preencher nome_fantasia automaticamente
                            nome_fantasia:
                              newFornecedor.tipoFornecedor === "PESSOA_FISICA"
                                ? nomeRazao
                                : newFornecedor.nome_fantasia,
                          });
                        }}
                      />
                    </div>

                    {/* CPF/CNPJ */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-muted-foreground" />
                        {newFornecedor.tipoFornecedor === "PESSOA_FISICA"
                          ? "CPF"
                          : "CNPJ"}{" "}
                        *
                      </Label>
                      <Input
                        placeholder={
                          newFornecedor.tipoFornecedor === "PESSOA_FISICA"
                            ? "000.000.000-00"
                            : "00.000.000/0000-00"
                        }
                        value={newFornecedor.cpf_cnpj}
                        onChange={(e) => {
                          const value = e.target.value;
                          const cleaned = cleanDocument(value);
                          const tipo = newFornecedor.tipoFornecedor;
                          const maxLength = tipo === "PESSOA_FISICA" ? 11 : 14;
                          const limited = cleaned.slice(0, maxLength);
                          let formatted = limited;
                          if (
                            tipo === "PESSOA_FISICA" &&
                            limited.length === 11
                          ) {
                            formatted = formatCPF(limited);
                          } else if (
                            tipo === "PESSOA_JURIDICA" &&
                            limited.length === 14
                          ) {
                            formatted = formatCNPJ(limited);
                          } else if (limited.length > 0) {
                            if (tipo === "PESSOA_FISICA") {
                              formatted = limited
                                .replace(
                                  /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
                                  "$1.$2.$3-$4"
                                )
                                .replace(/^(\d{3})(\d{3})(\d{3})$/, "$1.$2.$3")
                                .replace(/^(\d{3})(\d{3})$/, "$1.$2")
                                .replace(/^(\d{3})$/, "$1");
                            } else {
                              formatted = limited
                                .replace(
                                  /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
                                  "$1.$2.$3/$4-$5"
                                )
                                .replace(
                                  /^(\d{2})(\d{3})(\d{3})(\d{4})$/,
                                  "$1.$2.$3/$4"
                                )
                                .replace(/^(\d{2})(\d{3})(\d{3})$/, "$1.$2.$3")
                                .replace(/^(\d{2})(\d{3})$/, "$1.$2")
                                .replace(/^(\d{2})$/, "$1");
                            }
                          }
                          setNewFornecedor({
                            ...newFornecedor,
                            cpf_cnpj: formatted,
                          });
                        }}
                      />
                      {/* Mensagem de validação em tempo real - apenas tamanho */}
                      {newFornecedor.tipoFornecedor === "PESSOA_JURIDICA" &&
                        cleanDocument(newFornecedor.cpf_cnpj || "").length >
                          0 &&
                        cleanDocument(newFornecedor.cpf_cnpj || "").length !==
                          14 && (
                          <p className="text-xs text-destructive mt-1">
                            CNPJ deve ter 14 dígitos.
                          </p>
                        )}
                      {newFornecedor.tipoFornecedor === "PESSOA_FISICA" &&
                        cleanDocument(newFornecedor.cpf_cnpj || "").length >
                          0 &&
                        cleanDocument(newFornecedor.cpf_cnpj || "").length !==
                          11 && (
                          <p className="text-xs text-destructive mt-1">
                            CPF deve ter 11 dígitos.
                          </p>
                        )}
                    </div>

                    {/* Inscrição Estadual - Apenas para Pessoa Jurídica */}
                    {newFornecedor.tipoFornecedor === "PESSOA_JURIDICA" && (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-muted-foreground" />
                          Inscrição Estadual
                        </Label>
                        <Input
                          placeholder="000.000.000.000"
                          value={newFornecedor.inscricao_estadual || ""}
                          onChange={(e) =>
                            setNewFornecedor({
                              ...newFornecedor,
                              inscricao_estadual: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}

                    {/* Status Inicial */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">
                        Status Inicial
                      </Label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() =>
                            setNewFornecedor({
                              ...newFornecedor,
                              statusFornecedor: "ATIVO",
                            })
                          }
                          className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                            newFornecedor.statusFornecedor === "ATIVO"
                              ? "border-primary bg-primary/5"
                              : "border-border bg-card hover:border-primary/50"
                          }`}
                        >
                          <Circle
                            className={`w-4 h-4 ${
                              newFornecedor.statusFornecedor === "ATIVO"
                                ? "text-green-500 fill-green-500"
                                : "text-muted-foreground"
                            }`}
                          />
                          <span
                            className={`font-medium ${
                              newFornecedor.statusFornecedor === "ATIVO"
                                ? "text-primary"
                                : "text-foreground"
                            }`}
                          >
                            Ativo
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setNewFornecedor({
                              ...newFornecedor,
                              statusFornecedor: "INATIVO",
                            })
                          }
                          className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                            newFornecedor.statusFornecedor === "INATIVO"
                              ? "border-primary bg-primary/5"
                              : "border-border bg-card hover:border-primary/50"
                          }`}
                        >
                          <Circle
                            className={`w-4 h-4 ${
                              newFornecedor.statusFornecedor === "INATIVO"
                                ? "text-muted-foreground fill-muted-foreground"
                                : "text-muted-foreground"
                            }`}
                          />
                          <span
                            className={`font-medium ${
                              newFornecedor.statusFornecedor === "INATIVO"
                                ? "text-primary"
                                : "text-foreground"
                            }`}
                          >
                            Inativo
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Passo 2: Endereços */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <MapPinIcon className="w-5 h-5 text-primary" />
                        Endereços
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setEnderecos([
                            ...enderecos,
                            {
                              cep: "",
                              logradouro: "",
                              numero: "",
                              complemento: "",
                              bairro: "",
                              cidade: "",
                              estado: "",
                              referencia: "",
                            },
                          ])
                        }
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Endereço
                      </Button>
                    </div>

                    {enderecos.map((endereco, index) => (
                      <div
                        key={index}
                        className="space-y-4 p-4 border rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-semibold">
                            Endereço {index + 1}
                          </Label>
                          {enderecos.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setEnderecos(
                                  enderecos.filter((_, i) => i !== index)
                                )
                              }
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>CEP *</Label>
                              <Input
                                placeholder="00000-000"
                                value={endereco.cep}
                                onChange={(e) => {
                                  const formatted = formatCEP(e.target.value);
                                  const newEnderecos = [...enderecos];
                                  newEnderecos[index].cep = formatted;
                                  setEnderecos(newEnderecos);
                                }}
                                maxLength={9}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Logradouro *</Label>
                              <Input
                                placeholder="Rua, Avenida, etc."
                                value={endereco.logradouro}
                                onChange={(e) => {
                                  const newEnderecos = [...enderecos];
                                  newEnderecos[index].logradouro = e.target.value;
                                  setEnderecos(newEnderecos);
                                }}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Número *</Label>
                              <Input
                                placeholder="123"
                                value={endereco.numero}
                                onChange={(e) => {
                                  const newEnderecos = [...enderecos];
                                  newEnderecos[index].numero = e.target.value;
                                  setEnderecos(newEnderecos);
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Complemento</Label>
                              <Input
                                placeholder="Apto, Sala, etc."
                                value={endereco.complemento}
                                onChange={(e) => {
                                  const newEnderecos = [...enderecos];
                                  newEnderecos[index].complemento =
                                    e.target.value;
                                  setEnderecos(newEnderecos);
                                }}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Bairro *</Label>
                              <Input
                                placeholder="Nome do bairro"
                                value={endereco.bairro}
                                onChange={(e) => {
                                  const newEnderecos = [...enderecos];
                                  newEnderecos[index].bairro = e.target.value;
                                  setEnderecos(newEnderecos);
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Cidade *</Label>
                              <Input
                                placeholder="Nome da cidade"
                                value={endereco.cidade}
                                onChange={(e) => {
                                  const newEnderecos = [...enderecos];
                                  newEnderecos[index].cidade = e.target.value;
                                  setEnderecos(newEnderecos);
                                }}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Estado (UF) *</Label>
                              <Input
                                placeholder="SP"
                                maxLength={2}
                                value={endereco.estado}
                                onChange={(e) => {
                                  const newEnderecos = [...enderecos];
                                  newEnderecos[index].estado =
                                    e.target.value.toUpperCase();
                                  setEnderecos(newEnderecos);
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Referência</Label>
                              <Input
                                placeholder="Ponto de referência"
                                value={endereco.referencia}
                                onChange={(e) => {
                                  const newEnderecos = [...enderecos];
                                  newEnderecos[index].referencia = e.target.value;
                                  setEnderecos(newEnderecos);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Passo 3: Contatos */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <PhoneIcon className="w-5 h-5 text-primary" />
                        Contatos
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setContatos([
                          ...contatos,
                          {
                            telefone: "",
                            email: "",
                            nomeContato: "",
                            observacao: "",
                          },
                        ])
                        }
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Contato
                      </Button>
                    </div>

                    {contatos.map((contato, index) => (
                      <div
                        key={index}
                        className="space-y-4 p-4 border rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-semibold">
                            Contato {index + 1}
                          </Label>
                          {contatos.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setContatos(
                                  contatos.filter((_, i) => i !== index)
                                )
                              }
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="flex items-center gap-2">
                                <PhoneIcon className="w-4 h-4 text-muted-foreground" />
                                Telefone *
                              </Label>
                              <Input
                                placeholder="(00) 00000-0000"
                                value={contato.telefone}
                                onChange={(e) => {
                                  const formatted = formatTelefone(e.target.value);
                                  const newContatos = [...contatos];
                                  newContatos[index].telefone = formatted;
                                  setContatos(newContatos);
                                }}
                                maxLength={15}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="flex items-center gap-2">
                                <MailIcon className="w-4 h-4 text-muted-foreground" />
                                E-mail
                              </Label>
                              <Input
                                type="email"
                                placeholder="exemplo@email.com"
                                value={contato.email}
                                onChange={(e) => {
                                  const newContatos = [...contatos];
                                  newContatos[index].email = e.target.value;
                                  setContatos(newContatos);
                                }}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <UserIcon className="w-4 h-4 text-muted-foreground" />
                              Nome do Contato
                            </Label>
                            <Input
                              placeholder="Nome do responsável"
                              value={contato.nomeContato}
                              onChange={(e) => {
                                const newContatos = [...contatos];
                                newContatos[index].nomeContato = e.target.value;
                                setContatos(newContatos);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Observação</Label>
                            <Input
                              placeholder="Observações sobre o contato"
                              value={contato.observacao}
                              onChange={(e) => {
                                const newContatos = [...contatos];
                                newContatos[index].observacao = e.target.value;
                                setContatos(newContatos);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Botões de Navegação */}
                <div className="flex gap-3 pt-4 border-t">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreviousStep}
                      className="flex-1"
                    >
                      Voltar
                    </Button>
                  )}
                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      variant="gradient"
                      onClick={handleNextStep}
                      className="flex-1"
                    >
                      Continuar
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="gradient"
                      onClick={handleCreate}
                      disabled={createFornecedorMutation.isPending}
                      className="flex-1"
                    >
                      {createFornecedorMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Cadastrando...
                        </>
                      ) : (
                        "Finalizar Cadastro"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setFiltrosDialogOpen(true)}
              style={
                temFiltrosAtivos
                  ? { borderColor: "var(--primary)", borderWidth: "2px" }
                  : {}
              }
            >
              <Filter className="w-4 h-4" />
              Filtros
              {temFiltrosAtivos && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {
                    Object.values(filtrosAvancados).filter((v) => v !== "")
                      .length
                  }
                </span>
              )}
            </Button>
            <Sheet open={filtrosDialogOpen} onOpenChange={setFiltrosDialogOpen}>
              <SheetContent
                side="right"
                className="w-[400px] sm:w-[540px] overflow-y-auto"
              >
                <SheetHeader className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Filter className="w-5 h-5 text-primary" />
                    </div>
                    <SheetTitle className="text-xl">
                      Filtros Avançados
                    </SheetTitle>
                  </div>
                  <SheetDescription>Refine sua busca</SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                  {/* Tipo de Fornecedor */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Tipo de Fornecedor
                    </Label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setFiltrosAvancados({
                            ...filtrosAvancados,
                            tipoFornecedor: "",
                          })
                        }
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                          !filtrosAvancados.tipoFornecedor
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-foreground border-border hover:bg-secondary"
                        }`}
                      >
                        <Circle
                          className={`w-4 h-4 ${
                            !filtrosAvancados.tipoFornecedor
                              ? "text-primary-foreground"
                              : "text-muted-foreground"
                          }`}
                        />
                        <span className="text-sm font-medium">Todos</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFiltrosAvancados({
                            ...filtrosAvancados,
                            tipoFornecedor: "PESSOA_JURIDICA",
                          })
                        }
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                          filtrosAvancados.tipoFornecedor === "PESSOA_JURIDICA"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-foreground border-border hover:bg-secondary"
                        }`}
                      >
                        <Building2
                          className={`w-4 h-4 ${
                            filtrosAvancados.tipoFornecedor ===
                            "PESSOA_JURIDICA"
                              ? "text-primary-foreground"
                              : "text-muted-foreground"
                          }`}
                        />
                        <span className="text-sm font-medium">
                          Pessoa Jurídica
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFiltrosAvancados({
                            ...filtrosAvancados,
                            tipoFornecedor: "PESSOA_FISICA",
                          })
                        }
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                          filtrosAvancados.tipoFornecedor === "PESSOA_FISICA"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-foreground border-border hover:bg-secondary"
                        }`}
                      >
                        <User
                          className={`w-4 h-4 ${
                            filtrosAvancados.tipoFornecedor === "PESSOA_FISICA"
                              ? "text-primary-foreground"
                              : "text-muted-foreground"
                          }`}
                        />
                        <span className="text-sm font-medium">
                          Pessoa Física
                        </span>
                      </button>
                    </div>
                  </div>

                  <Separator />

                  {/* Status */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Status</Label>
                    <RadioGroup
                      value={filtrosAvancados.statusFornecedor || "none"}
                      onValueChange={(value) =>
                        setFiltrosAvancados({
                          ...filtrosAvancados,
                          statusFornecedor: value === "none" ? "" : value,
                        })
                      }
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="none" id="status-all" />
                        <Label
                          htmlFor="status-all"
                          className="flex items-center gap-2 cursor-pointer flex-1"
                        >
                          <Circle className="w-3 h-3 text-primary" />
                          <span>Todos</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ATIVO" id="status-ativo" />
                        <Label
                          htmlFor="status-ativo"
                          className="flex items-center gap-2 cursor-pointer flex-1"
                        >
                          <Circle className="w-3 h-3 text-green-500" />
                          <span>Ativo</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="INATIVO" id="status-inativo" />
                        <Label
                          htmlFor="status-inativo"
                          className="flex items-center gap-2 cursor-pointer flex-1"
                        >
                          <Circle className="w-3 h-3 text-muted-foreground" />
                          <span>Inativo</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="BLOQUEADO"
                          id="status-bloqueado"
                        />
                        <Label
                          htmlFor="status-bloqueado"
                          className="flex items-center gap-2 cursor-pointer flex-1"
                        >
                          <Circle className="w-3 h-3 text-red-500" />
                          <span>Bloqueado</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Separator />

                  {/* Localização */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      LOCALIZAÇÃO
                    </h3>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label
                          htmlFor="cidade"
                          className="flex items-center gap-2"
                        >
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          Cidade
                        </Label>
                        <Input
                          id="cidade"
                          placeholder="Ex: São Paulo"
                          value={filtrosAvancados.cidade}
                          onChange={(e) =>
                            setFiltrosAvancados({
                              ...filtrosAvancados,
                              cidade: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="estado">Estado</Label>
                        <Input
                          id="estado"
                          placeholder="UF"
                          value={filtrosAvancados.estado}
                          onChange={(e) =>
                            setFiltrosAvancados({
                              ...filtrosAvancados,
                              estado: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Contato */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      CONTATO
                    </h3>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label
                          htmlFor="telefone"
                          className="flex items-center gap-2"
                        >
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          Telefone
                        </Label>
                        <Input
                          id="telefone"
                          placeholder="(00) 00000-0000"
                          value={filtrosAvancados.telefone}
                          onChange={(e) =>
                            setFiltrosAvancados({
                              ...filtrosAvancados,
                              telefone: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="email"
                          className="flex items-center gap-2"
                        >
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          E-mail
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="exemplo@email.com"
                          value={filtrosAvancados.email}
                          onChange={(e) =>
                            setFiltrosAvancados({
                              ...filtrosAvancados,
                              email: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="nomeContato"
                          className="flex items-center gap-2"
                        >
                          <User className="w-4 h-4 text-muted-foreground" />
                          Nome do Contato
                        </Label>
                        <Input
                          id="nomeContato"
                          placeholder="Nome do responsável"
                          value={filtrosAvancados.nomeContato}
                          onChange={(e) =>
                            setFiltrosAvancados({
                              ...filtrosAvancados,
                              nomeContato: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Botões de ação */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleAplicarFiltros}
                      className="flex-1"
                      variant="gradient"
                    >
                      Aplicar Filtros
                    </Button>
                    <Button
                      onClick={handleLimparFiltros}
                      variant="outline"
                      className="flex-1"
                    >
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CNPJ..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          {isLoadingEstatisticas ? (
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl p-5 border border-border"
                >
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                </motion.div>
              ))}
            </>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
                className="bg-card rounded-xl p-5 border border-border hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">
                  {estatisticas?.total || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-xl p-5 border border-border hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-green-500 mb-1">
                  {estatisticas?.ativos || 0}
                </p>
                <p className="text-sm text-muted-foreground">Ativos</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-xl p-5 border border-border hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-muted/10">
                    <XCircle className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-muted-foreground mb-1">
                  {estatisticas?.inativos || 0}
                </p>
                <p className="text-sm text-muted-foreground">Inativos</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-xl p-5 border border-border hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <Ban className="w-5 h-5 text-red-500" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-red-500 mb-1">
                  {estatisticas?.bloqueados || 0}
                </p>
                <p className="text-sm text-muted-foreground">Bloqueados</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card rounded-xl p-5 border border-border hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-cyan/10">
                    <Calendar className="w-5 h-5 text-cyan" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-cyan mb-1">
                  {estatisticas?.novosNoMes || 0}
                </p>
                <p className="text-sm text-muted-foreground">Novos (mês)</p>
              </motion.div>
            </>
          )}
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-sidebar text-sidebar-foreground">
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    Nome
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    CNPJ
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    E-mail
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    Telefone
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoadingFornecedores ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Carregando fornecedores...
                      </div>
                    </td>
                  </tr>
                ) : fornecedores.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Nenhum fornecedor encontrado
                    </td>
                  </tr>
                ) : (
                  fornecedores.map((fornecedor) => (
                    <tr
                      key={fornecedor.id}
                      className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-foreground">
                        {fornecedor.nome_fantasia || fornecedor.nome_razao || "-"}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {fornecedor.cpf_cnpj || "-"}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {fornecedor.contato && fornecedor.contato.length > 0
                            ? fornecedor.contato[0].email || "-"
                            : "-"}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {fornecedor.contato && fornecedor.contato.length > 0
                            ? fornecedor.contato[0].telefone || "-"
                            : "-"}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Select
                          value={fornecedor.statusFornecedor}
                          onValueChange={(value) => {
                            if (value !== fornecedor.statusFornecedor) {
                              handleStatusChange(fornecedor.id, value as "ATIVO" | "INATIVO" | "BLOQUEADO");
                            }
                          }}
                          disabled={updatingStatusId === fornecedor.id}
                        >
                          <SelectTrigger
                            className={`h-7 w-[140px] text-xs font-medium rounded-full border-0 shadow-none hover:opacity-80 transition-opacity ${
                              fornecedor.statusFornecedor === "ATIVO"
                                ? "bg-cyan/10 text-cyan"
                                : fornecedor.statusFornecedor === "INATIVO"
                                ? "bg-muted text-muted-foreground"
                                : "bg-red-500/10 text-red-500"
                            }`}
                          >
                            <SelectValue>
                              {updatingStatusId === fornecedor.id ? (
                                <div className="flex items-center gap-2">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Atualizando...</span>
                                </div>
                              ) : (
                                fornecedor.statusFornecedor === "ATIVO"
                                  ? "Ativo"
                                  : fornecedor.statusFornecedor === "INATIVO"
                                  ? "Inativo"
                                  : "Bloqueado"
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ATIVO">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-cyan"></span>
                                Ativo
                              </div>
                            </SelectItem>
                            <SelectItem value="INATIVO">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-muted-foreground"></span>
                                Inativo
                              </div>
                            </SelectItem>
                            <SelectItem value="BLOQUEADO">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                Bloqueado
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <button 
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            onClick={() => handleView(fornecedor.id)}
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button 
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            onClick={() => handleEdit(fornecedor.id)}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button
                            className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                            onClick={() => handleDelete(fornecedor.id)}
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="border-t border-border p-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          handlePageChange(currentPage - 1);
                        }
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {/* Primeira página */}
                  {currentPage > 3 && (
                    <>
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(1);
                          }}
                          className="cursor-pointer"
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                      {currentPage > 4 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                    </>
                  )}

                  {/* Páginas ao redor da atual */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                    )
                    .map((page, index, array) => {
                      // Adicionar ellipsis se houver gap
                      const prevPage = array[index - 1];
                      const showEllipsisBefore =
                        index > 0 && page - prevPage > 1;

                      return (
                        <React.Fragment key={page}>
                          {showEllipsisBefore && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(page);
                              }}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        </React.Fragment>
                      );
                    })}

                  {/* Última página */}
                  {currentPage < totalPages - 2 && (
                    <>
                      {currentPage < totalPages - 3 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(totalPages);
                          }}
                          className="cursor-pointer"
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) {
                          handlePageChange(currentPage + 1);
                        }
                      }}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              
              {/* Info de paginação */}
              <div className="text-center text-sm text-muted-foreground mt-4">
                Mostrando {fornecedores.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} a{" "}
                {Math.min(currentPage * pageSize, totalFornecedores)} de{" "}
                {totalFornecedores} fornecedores
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal de Visualização */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Visualizar Fornecedor
            </DialogTitle>
            <DialogDescription>
              Informações completas do fornecedor
            </DialogDescription>
          </DialogHeader>

          {isLoadingFornecedor ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : selectedFornecedor ? (
            <div className="space-y-8 mt-6">
              {/* Informações Básicas */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" />
                  Informações Básicas
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  {selectedFornecedor.nome_fantasia && (
                    <div className="space-y-3">
                      <Label className="text-sm text-muted-foreground">
                        Nome Fantasia
                      </Label>
                      <p className="font-medium text-base">
                        {selectedFornecedor.nome_fantasia}
                      </p>
                    </div>
                  )}
                  <div className="space-y-3">
                    <Label className="text-sm text-muted-foreground">
                      {selectedFornecedor.tipoFornecedor === "PESSOA_JURIDICA"
                        ? "Razão Social"
                        : "Nome"}
                    </Label>
                    <p className="font-medium text-base">
                      {selectedFornecedor.nome_razao}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm text-muted-foreground">
                      CPF/CNPJ
                    </Label>
                    <p className="font-medium text-base">
                      {selectedFornecedor.cpf_cnpj || "-"}
                    </p>
                  </div>
                  {selectedFornecedor.inscricao_estadual && (
                    <div className="space-y-3">
                      <Label className="text-sm text-muted-foreground">
                        Inscrição Estadual
                      </Label>
                      <p className="font-medium text-base">
                        {selectedFornecedor.inscricao_estadual}
                      </p>
                    </div>
                  )}
                  <div className="space-y-3">
                    <Label className="text-sm text-muted-foreground">
                      Tipo
                    </Label>
                    <p className="font-medium text-base">
                      {selectedFornecedor.tipoFornecedor === "PESSOA_FISICA"
                        ? "Pessoa Física"
                        : "Pessoa Jurídica"}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground">
                        Status
                      </Label>
                      <span
                        className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium ${
                          selectedFornecedor.statusFornecedor === "ATIVO"
                            ? "bg-green-500/10 text-green-500"
                            : selectedFornecedor.statusFornecedor === "INATIVO"
                            ? "bg-muted text-muted-foreground"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {selectedFornecedor.statusFornecedor}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Endereços */}
              {selectedFornecedor.enderecos &&
                selectedFornecedor.enderecos.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Endereços ({selectedFornecedor.enderecos.length})
                    </h3>
                    <div className="space-y-3">
                      {selectedFornecedor.enderecos.map((endereco, index) => (
                        <div
                          key={index}
                          className="p-4 border rounded-lg space-y-2"
                        >
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                CEP
                              </Label>
                              <p>{endereco.cep || "-"}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Logradouro
                              </Label>
                              <p>{endereco.logradouro || "-"}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Número
                              </Label>
                              <p>{endereco.numero || "-"}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Complemento
                              </Label>
                              <p>{endereco.complemento || "-"}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Bairro
                              </Label>
                              <p>{endereco.bairro || "-"}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Cidade
                              </Label>
                              <p>{endereco.cidade || "-"}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Estado
                              </Label>
                              <p>{endereco.estado || "-"}</p>
                            </div>
                            {endereco.referencia && (
                              <div className="col-span-2">
                                <Label className="text-xs text-muted-foreground">
                                  Referência
                                </Label>
                                <p>{endereco.referencia}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Contatos */}
              {selectedFornecedor.contato &&
                selectedFornecedor.contato.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Phone className="w-5 h-5 text-primary" />
                      Contatos ({selectedFornecedor.contato.length})
                    </h3>
                    <div className="space-y-3">
                      {selectedFornecedor.contato.map((contato, index) => (
                        <div
                          key={index}
                          className="p-4 border rounded-lg space-y-2"
                        >
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Telefone
                              </Label>
                              <p>{contato.telefone || "-"}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                E-mail
                              </Label>
                              <p>{contato.email || "-"}</p>
                            </div>
                            {(contato.nomeContato ||
                              (contato as any).nome_contato) && (
                              <div>
                                <Label className="text-xs text-muted-foreground">
                                  Nome do Contato
                                </Label>
                                <p>
                                  {contato.nomeContato ||
                                    (contato as any).nome_contato}
                                </p>
                              </div>
                            )}
                            {contato.observacao && (
                              <div className="col-span-2">
                                <Label className="text-xs text-muted-foreground">
                                  Observação
                                </Label>
                                <p>{contato.observacao}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Datas */}
              {(selectedFornecedor.criandoEm || selectedFornecedor.atualizadoEm) && (
                <div className="space-y-2 pt-4 border-t">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Informações do Sistema
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedFornecedor.criandoEm && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Criado em
                        </Label>
                        <p>
                          {new Date(selectedFornecedor.criandoEm).toLocaleString(
                            "pt-BR"
                          )}
                        </p>
                      </div>
                    )}
                    {selectedFornecedor.atualizadoEm && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Atualizado em
                        </Label>
                        <p>
                          {new Date(
                            selectedFornecedor.atualizadoEm
                          ).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Fornecedor não encontrado
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Excluir Fornecedor
            </DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O fornecedor será permanentemente excluído.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedFornecedor && (
              <p className="text-sm text-muted-foreground">
                Tem certeza que deseja excluir o fornecedor{" "}
                <span className="font-semibold text-foreground">
                  {selectedFornecedor.nome_fantasia || selectedFornecedor.nome_razao}
                </span>
                ?
              </p>
            )}
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedFornecedorId(null);
              }}
              className="flex-1"
              disabled={deleteFornecedorMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteFornecedorMutation.isPending}
              className="flex-1"
            >
              {deleteFornecedorMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setSelectedFornecedorId(null);
            setEditCurrentStep(1);
            setEditNewFornecedor({
              nome_fantasia: "",
              nome_razao: "",
              tipoFornecedor: "PESSOA_JURIDICA",
              statusFornecedor: "ATIVO",
              cpf_cnpj: "",
              inscricao_estadual: "",
            });
            setEditEnderecos([
              {
                cep: "",
                logradouro: "",
                numero: "",
                complemento: "",
                bairro: "",
                cidade: "",
                estado: "",
                referencia: "",
              },
            ]);
            setEditContatos([
              {
                telefone: "",
                email: "",
                nomeContato: "",
                observacao: "",
                ativo: true,
              },
            ]);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold">
                  Editar Fornecedor
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Atualize as informações do fornecedor
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedFornecedor) {
                      setEditNewFornecedor({
                        nome_fantasia: selectedFornecedor.nome_fantasia || "",
                        nome_razao: selectedFornecedor.nome_razao || "",
                        tipoFornecedor: selectedFornecedor.tipoFornecedor,
                        statusFornecedor: selectedFornecedor.statusFornecedor,
                        cpf_cnpj: selectedFornecedor.cpf_cnpj || "",
                        inscricao_estadual: selectedFornecedor.inscricao_estadual || "",
                      });
                      if (selectedFornecedor.enderecos && selectedFornecedor.enderecos.length > 0) {
                        setEditEnderecos(
                          selectedFornecedor.enderecos.map((end) => ({
                            id: end.id,
                            cep: end.cep || "",
                            logradouro: end.logradouro || "",
                            numero: end.numero || "",
                            complemento: end.complemento || "",
                            bairro: end.bairro || "",
                            cidade: end.cidade || "",
                            estado: end.estado || "",
                            referencia: end.referencia || "",
                          }))
                        );
                      }
                      if (selectedFornecedor.contato && selectedFornecedor.contato.length > 0) {
                        setEditContatos(
                          selectedFornecedor.contato.map((cont: any) => ({
                            id: cont.id,
                            telefone: cont.telefone || "",
                            email: cont.email || "",
                            nomeContato: cont.nomeContato || cont.nome_contato || "",
                            observacao: cont.observacao || "",
                            ativo: cont.ativo !== undefined ? cont.ativo : true,
                          }))
                        );
                      }
                    }
                  }}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restaurar
                </Button>
              </div>
            </div>
          </DialogHeader>

          {isLoadingFornecedor ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : selectedFornecedor ? (
            <div className="space-y-8 pt-6">
              {/* Seção: Informações Básicas */}
              <div className="bg-card border rounded-lg p-6 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Truck className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      Informações Básicas
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Dados principais do fornecedor
                    </p>
                  </div>
                </div>
                <div className="space-y-8">
                  {/* Tipo de Fornecedor */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Tipo de Fornecedor
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          setEditNewFornecedor({
                            ...editNewFornecedor,
                            tipoFornecedor: "PESSOA_JURIDICA",
                            cpf_cnpj:
                              editNewFornecedor.tipoFornecedor === "PESSOA_FISICA"
                                ? ""
                                : editNewFornecedor.cpf_cnpj,
                            nome_fantasia:
                              editNewFornecedor.tipoFornecedor === "PESSOA_FISICA"
                                ? ""
                                : editNewFornecedor.nome_fantasia,
                          })
                        }
                        className={`relative p-6 rounded-lg border-2 transition-all ${
                          editNewFornecedor.tipoFornecedor === "PESSOA_JURIDICA"
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card hover:border-primary/50"
                        }`}
                      >
                        {editNewFornecedor.tipoFornecedor === "PESSOA_JURIDICA" && (
                          <div className="absolute top-3 right-3">
                            <Check className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <div className="flex flex-col items-center gap-3">
                          <Building2
                            className={`w-8 h-8 ${
                              editNewFornecedor.tipoFornecedor === "PESSOA_JURIDICA"
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                          <div className="text-center">
                            <p className="font-semibold">Pessoa Jurídica</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              CNPJ
                            </p>
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setEditNewFornecedor({
                            ...editNewFornecedor,
                            tipoFornecedor: "PESSOA_FISICA",
                            cpf_cnpj:
                              editNewFornecedor.tipoFornecedor === "PESSOA_JURIDICA"
                                ? ""
                                : editNewFornecedor.cpf_cnpj,
                            nome_fantasia: "",
                          })
                        }
                        className={`relative p-6 rounded-lg border-2 transition-all ${
                          editNewFornecedor.tipoFornecedor === "PESSOA_FISICA"
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card hover:border-primary/50"
                        }`}
                      >
                        {editNewFornecedor.tipoFornecedor === "PESSOA_FISICA" && (
                          <div className="absolute top-3 right-3">
                            <Check className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <div className="flex flex-col items-center gap-3">
                          <User
                            className={`w-8 h-8 ${
                              editNewFornecedor.tipoFornecedor === "PESSOA_FISICA"
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                          <div className="text-center">
                            <p className="font-semibold">Pessoa Física</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              CPF
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Nome Fantasia - Apenas para Pessoa Jurídica */}
                  {editNewFornecedor.tipoFornecedor === "PESSOA_JURIDICA" && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        Nome Fantasia
                      </Label>
                      <Input
                        placeholder="Nome Fantasia da Empresa"
                        value={editNewFornecedor.nome_fantasia || ""}
                        onChange={(e) =>
                          setEditNewFornecedor({
                            ...editNewFornecedor,
                            nome_fantasia: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}

                  {/* Nome / Razão Social */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      {editNewFornecedor.tipoFornecedor === "PESSOA_JURIDICA"
                        ? "Razão Social"
                        : "Nome"}{" "}
                      *
                    </Label>
                    <Input
                      placeholder={
                        editNewFornecedor.tipoFornecedor === "PESSOA_JURIDICA"
                          ? "Razão Social da Empresa"
                          : "Nome do fornecedor"
                      }
                      value={editNewFornecedor.nome_razao || ""}
                      onChange={(e) => {
                        const nomeRazao = e.target.value;
                        setEditNewFornecedor({
                          ...editNewFornecedor,
                          nome_razao: nomeRazao,
                          nome_fantasia:
                            editNewFornecedor.tipoFornecedor === "PESSOA_FISICA"
                              ? nomeRazao
                              : editNewFornecedor.nome_fantasia,
                        });
                      }}
                    />
                  </div>

                  {/* CPF/CNPJ */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      {editNewFornecedor.tipoFornecedor === "PESSOA_FISICA"
                        ? "CPF"
                        : "CNPJ"}{" "}
                      *
                    </Label>
                    <Input
                      placeholder={
                        editNewFornecedor.tipoFornecedor === "PESSOA_FISICA"
                          ? "000.000.000-00"
                          : "00.000.000/0000-00"
                      }
                      value={editNewFornecedor.cpf_cnpj || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        const cleaned = cleanDocument(value);
                        const tipo = editNewFornecedor.tipoFornecedor;
                        const maxLength = tipo === "PESSOA_FISICA" ? 11 : 14;
                        const limited = cleaned.slice(0, maxLength);
                        let formatted = limited;
                        if (tipo === "PESSOA_FISICA" && limited.length === 11) {
                          formatted = formatCPF(limited);
                        } else if (
                          tipo === "PESSOA_JURIDICA" &&
                          limited.length === 14
                        ) {
                          formatted = formatCNPJ(limited);
                        } else if (limited.length > 0) {
                          if (tipo === "PESSOA_FISICA") {
                            formatted = limited
                              .replace(
                                /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
                                "$1.$2.$3-$4"
                              )
                              .replace(/^(\d{3})(\d{3})(\d{3})$/, "$1.$2.$3")
                              .replace(/^(\d{3})(\d{3})$/, "$1.$2")
                              .replace(/^(\d{3})$/, "$1");
                          } else {
                            formatted = limited
                              .replace(
                                /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
                                "$1.$2.$3/$4-$5"
                              )
                              .replace(
                                /^(\d{2})(\d{3})(\d{3})(\d{4})$/,
                                "$1.$2.$3/$4"
                              )
                              .replace(/^(\d{2})(\d{3})(\d{3})$/, "$1.$2.$3")
                              .replace(/^(\d{2})(\d{3})$/, "$1.$2")
                              .replace(/^(\d{2})$/, "$1");
                          }
                        }
                        setEditNewFornecedor({
                          ...editNewFornecedor,
                          cpf_cnpj: formatted,
                        });
                      }}
                    />
                  </div>

                  {/* Inscrição Estadual - Apenas para Pessoa Jurídica */}
                  {editNewFornecedor.tipoFornecedor === "PESSOA_JURIDICA" && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-muted-foreground" />
                        Inscrição Estadual
                      </Label>
                      <Input
                        placeholder="000.000.000.000"
                        value={editNewFornecedor.inscricao_estadual || ""}
                        onChange={(e) =>
                          setEditNewFornecedor({
                            ...editNewFornecedor,
                            inscricao_estadual: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}

                  {/* Status */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Status</Label>
                    <div className="grid grid-cols-3 gap-4">
                      {(["ATIVO", "INATIVO", "BLOQUEADO"] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() =>
                            setEditNewFornecedor({
                              ...editNewFornecedor,
                              statusFornecedor: status,
                            })
                          }
                          className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                            editNewFornecedor.statusFornecedor === status
                              ? "border-primary bg-primary/5"
                              : "border-border bg-card hover:border-primary/50"
                          }`}
                        >
                          <Circle
                            className={`w-4 h-4 ${
                              editNewFornecedor.statusFornecedor === status
                                ? status === "ATIVO"
                                  ? "text-green-500 fill-green-500"
                                  : status === "INATIVO"
                                  ? "text-muted-foreground fill-muted-foreground"
                                  : status === "BLOQUEADO"
                                  ? "text-red-500 fill-red-500"
                                  : "text-primary fill-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                          <span className="font-medium">{status}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção: Endereços */}
              <div className="bg-card border rounded-lg p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <MapPinIcon className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Endereços</h3>
                      <p className="text-sm text-muted-foreground">
                        Localizações do fornecedor
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setEditEnderecos([
                        ...editEnderecos,
                        {
                          cep: "",
                          logradouro: "",
                          numero: "",
                          complemento: "",
                          bairro: "",
                          cidade: "",
                          estado: "",
                          referencia: "",
                        },
                      ])
                    }
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Endereço
                  </Button>
                </div>

                {editEnderecos.map((endereco, index) => (
                  <div
                    key={index}
                    className="space-y-4 p-4 border rounded-lg bg-background"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <Label className="text-sm font-semibold">
                          Endereço {index + 1}
                        </Label>
                      </div>
                      {editEnderecos.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setEditEnderecos(
                              editEnderecos.filter((_, i) => i !== index)
                            )
                          }
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>CEP</Label>
                          <Input
                            placeholder="00000-000"
                            value={endereco.cep}
                            onChange={(e) => {
                              const formatted = formatCEP(e.target.value);
                              const newEnderecos = [...editEnderecos];
                              newEnderecos[index].cep = formatted;
                              setEditEnderecos(newEnderecos);
                            }}
                            maxLength={9}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Logradouro</Label>
                          <Input
                            placeholder="Rua, Avenida, etc."
                            value={endereco.logradouro}
                            onChange={(e) => {
                              const newEnderecos = [...editEnderecos];
                              newEnderecos[index].logradouro = e.target.value;
                              setEditEnderecos(newEnderecos);
                            }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Número</Label>
                          <Input
                            placeholder="123"
                            value={endereco.numero}
                            onChange={(e) => {
                              const newEnderecos = [...editEnderecos];
                              newEnderecos[index].numero = e.target.value;
                              setEditEnderecos(newEnderecos);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Complemento</Label>
                          <Input
                            placeholder="Apto, Sala, etc."
                            value={endereco.complemento}
                            onChange={(e) => {
                              const newEnderecos = [...editEnderecos];
                              newEnderecos[index].complemento = e.target.value;
                              setEditEnderecos(newEnderecos);
                            }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Bairro</Label>
                          <Input
                            placeholder="Nome do bairro"
                            value={endereco.bairro}
                            onChange={(e) => {
                              const newEnderecos = [...editEnderecos];
                              newEnderecos[index].bairro = e.target.value;
                              setEditEnderecos(newEnderecos);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Cidade</Label>
                          <Input
                            placeholder="Nome da cidade"
                            value={endereco.cidade}
                            onChange={(e) => {
                              const newEnderecos = [...editEnderecos];
                              newEnderecos[index].cidade = e.target.value;
                              setEditEnderecos(newEnderecos);
                            }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Estado (UF)</Label>
                          <Input
                            placeholder="SP"
                            maxLength={2}
                            value={endereco.estado}
                            onChange={(e) => {
                              const newEnderecos = [...editEnderecos];
                              newEnderecos[index].estado =
                                e.target.value.toUpperCase();
                              setEditEnderecos(newEnderecos);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Referência</Label>
                          <Input
                            placeholder="Ponto de referência (máx. 100 caracteres)"
                            value={endereco.referencia}
                            onChange={(e) => {
                              const newEnderecos = [...editEnderecos];
                              newEnderecos[index].referencia = e.target.value;
                              setEditEnderecos(newEnderecos);
                            }}
                            maxLength={100}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Seção: Contatos */}
              <div className="bg-card border rounded-lg p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10">
                      <PhoneIcon className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Contatos</h3>
                      <p className="text-sm text-muted-foreground">
                        Informações de contato do fornecedor
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        setEditContatos([
                          ...editContatos,
                          {
                            telefone: "",
                            email: "",
                            nomeContato: "",
                            observacao: "",
                            ativo: true,
                          },
                        ])
                    }
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Contato
                  </Button>
                </div>

                {editContatos.map((contato, index) => (
                  <div
                    key={index}
                    className="space-y-4 p-4 border rounded-lg bg-background"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <Label className="text-sm font-semibold">
                          Contato {index + 1}
                        </Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor={`edit-ativo-${index}`}
                            className="text-sm font-medium"
                          >
                            Ativo
                          </Label>
                          <Switch
                            id={`edit-ativo-${index}`}
                            checked={
                              contato.ativo !== undefined ? contato.ativo : true
                            }
                            onCheckedChange={(checked) => {
                              const newContatos = [...editContatos];
                              newContatos[index].ativo = checked;
                              setEditContatos(newContatos);
                            }}
                          />
                        </div>
                        {editContatos.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setEditContatos(
                                editContatos.filter((_, i) => i !== index)
                              )
                            }
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <PhoneIcon className="w-4 h-4 text-muted-foreground" />
                            Telefone
                          </Label>
                          <Input
                            placeholder="(00) 00000-0000"
                            value={contato.telefone}
                            onChange={(e) => {
                              const formatted = formatTelefone(e.target.value);
                              const newContatos = [...editContatos];
                              newContatos[index].telefone = formatted;
                              setEditContatos(newContatos);
                            }}
                            maxLength={15}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <MailIcon className="w-4 h-4 text-muted-foreground" />
                            E-mail
                          </Label>
                          <Input
                            type="email"
                            placeholder="exemplo@email.com"
                            value={contato.email}
                            onChange={(e) => {
                              const newContatos = [...editContatos];
                              newContatos[index].email = e.target.value;
                              setEditContatos(newContatos);
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-muted-foreground" />
                          Nome do Contato
                        </Label>
                        <Input
                          placeholder="Nome do responsável"
                          value={contato.nomeContato}
                          onChange={(e) => {
                            const newContatos = [...editContatos];
                            newContatos[index].nomeContato = e.target.value;
                            setEditContatos(newContatos);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Observação</Label>
                        <Input
                          placeholder="Observações sobre o contato (máx. 500 caracteres)"
                          value={contato.observacao}
                          onChange={(e) => {
                            const newContatos = [...editContatos];
                            newContatos[index].observacao = e.target.value;
                            setEditContatos(newContatos);
                          }}
                          maxLength={500}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3 pt-4 border-t mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setSelectedFornecedorId(null);
                    setEditCurrentStep(1);
                  }}
                  className="flex-1"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="gradient"
                  onClick={async () => {
                    if (selectedFornecedorId) {
                      try {
                        // Preparar payload de atualização
                        const updateData: Partial<CreateFornecedorDto> = {};

                        // Dados básicos - apenas incluir se foram modificados
                        if (
                          editNewFornecedor.nome_fantasia !== undefined &&
                          editNewFornecedor.nome_fantasia !==
                            selectedFornecedor.nome_fantasia
                        ) {
                          updateData.nome_fantasia = editNewFornecedor.nome_fantasia;
                        }

                        if (
                          editNewFornecedor.nome_razao &&
                          editNewFornecedor.nome_razao !== selectedFornecedor.nome_razao
                        ) {
                          updateData.nome_razao = editNewFornecedor.nome_razao;
                        }

                        if (
                          editNewFornecedor.tipoFornecedor &&
                          editNewFornecedor.tipoFornecedor !== selectedFornecedor.tipoFornecedor
                        ) {
                          updateData.tipoFornecedor = editNewFornecedor.tipoFornecedor;
                        }

                        if (
                          editNewFornecedor.statusFornecedor &&
                          editNewFornecedor.statusFornecedor !== selectedFornecedor.statusFornecedor
                        ) {
                          updateData.statusFornecedor = editNewFornecedor.statusFornecedor;
                        }

                        if (
                          editNewFornecedor.cpf_cnpj &&
                          editNewFornecedor.cpf_cnpj !== selectedFornecedor.cpf_cnpj
                        ) {
                          updateData.cpf_cnpj = editNewFornecedor.cpf_cnpj;
                        }

                        if (
                          editNewFornecedor.tipoFornecedor === "PESSOA_JURIDICA" ||
                          selectedFornecedor.tipoFornecedor === "PESSOA_JURIDICA"
                        ) {
                          const inscricaoAtual = editNewFornecedor.inscricao_estadual || "";
                          const inscricaoOriginal = selectedFornecedor.inscricao_estadual || "";
                          if (inscricaoAtual !== inscricaoOriginal) {
                            updateData.inscricao_estadual = inscricaoAtual;
                          }
                        }

                        // Preparar endereços com IDs
                        const enderecosValidos = editEnderecos.filter(
                          (end) =>
                            end.cep?.trim() ||
                            end.logradouro?.trim() ||
                            end.cidade?.trim()
                        );

                        if (enderecosValidos.length > 0) {
                          updateData.enderecos = enderecosValidos.map((end) => ({
                            id: end.id,
                            cep: end.cep?.trim() || "",
                            logradouro: end.logradouro?.trim() || "",
                            numero: end.numero?.trim() || "",
                            complemento: end.complemento?.trim(),
                            bairro: end.bairro?.trim() || "",
                            cidade: end.cidade?.trim() || "",
                            estado: end.estado?.trim() || "",
                            referencia: end.referencia?.trim(),
                          }));
                        }

                        // Preparar contatos com IDs (formato snake_case para API)
                        const contatosValidos = editContatos.filter(
                          (cont) => cont.telefone?.trim()
                        );

                        if (contatosValidos.length > 0) {
                          updateData.contato = contatosValidos.map((cont) => ({
                            id: cont.id,
                            nome_contato: cont.nomeContato?.trim(),
                            email: cont.email?.trim(),
                            telefone: cont.telefone.trim(),
                            observacao: cont.observacao?.trim(),
                            ativo: cont.ativo !== undefined ? cont.ativo : true,
                          }));
                        }

                        // Atualizar fornecedor
                        updateFornecedorMutation.mutate(updateData);
                      } catch (error: any) {
                        const errorMessage =
                          error?.response?.data?.message ||
                          error?.message ||
                          "Erro ao atualizar fornecedor";
                        toast.error(errorMessage);
                      }
                    }
                  }}
                  disabled={updateFornecedorMutation.isPending}
                  className="flex-1"
                >
                  {updateFornecedorMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Fornecedor não encontrado
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Fornecedores;
