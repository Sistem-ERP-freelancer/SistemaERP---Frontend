# Guia de Deploy na Vercel

Este guia explica como fazer o deploy do frontend na Vercel.

## 📋 Pré-requisitos

1. Conta na Vercel (gratuita): https://vercel.com
2. Repositório no GitHub já configurado

## 🚀 Passo a Passo

### Opção 1: Deploy via Dashboard da Vercel (Recomendado)

1. **Acesse a Vercel**
   - Vá para https://vercel.com
   - Faça login com sua conta GitHub

2. **Importe o Projeto**
   - Clique em "Add New..." → "Project"
   - Selecione o repositório `SistemaERP---Frontend`
   - Clique em "Import"

3. **Configure o Projeto**
   - **Framework Preset**: Vite (deve detectar automaticamente)
   - **Root Directory**: `./` (raiz do projeto)
   - **Build Command**: `npm run build` (já configurado)
   - **Output Directory**: `dist` (já configurado)
   - **Install Command**: `npm install` (já configurado)

4. **Configure Variáveis de Ambiente**
   - Na seção "Environment Variables", adicione:
     ```
     VITE_API_URL=https://sistemaerp-3.onrender.com/api/v1
     ```
   - Se tiver WhatsApp URL (use o formato com número):
     ```
     VITE_WHATSAPP_URL=https://wa.me/5511943040888
     ```
     Ou se tiver QR Code:
     ```
     VITE_WHATSAPP_URL=https://wa.me/qr/SEU_CODIGO_QR
     ```
   - Selecione os ambientes: Production, Preview, Development

5. **Deploy**
   - Clique em "Deploy"
   - Aguarde o build completar (2-3 minutos)
   - Sua aplicação estará disponível em: `https://seu-projeto.vercel.app`

### Opção 2: Deploy via CLI da Vercel

1. **Instale a CLI da Vercel**
   ```bash
   npm install -g vercel
   ```

2. **Faça login**
   ```bash
   vercel login
   ```

3. **Configure variáveis de ambiente**
   ```bash
   vercel env add VITE_API_URL
   # Digite: https://sistemaerp-3.onrender.com/api/v1
   # Selecione os ambientes: Production, Preview, Development
   ```

4. **Faça o deploy**
   ```bash
   vercel
   ```
   - Siga as instruções interativas
   - Para produção: `vercel --prod`

## ⚙️ Configurações Importantes

### Variáveis de Ambiente

Certifique-se de configurar estas variáveis na Vercel:

- `VITE_API_URL`: URL da sua API backend
- `VITE_WHATSAPP_URL`: (Opcional) URL do WhatsApp

### Arquivo vercel.json

O arquivo `vercel.json` já está configurado com:
- Build command correto
- Output directory (`dist`)
- Rewrites para SPA (Single Page Application)

## 🔄 Deploy Automático

Após o primeiro deploy, a Vercel automaticamente:
- Faz deploy a cada push na branch `main`
- Cria preview deployments para Pull Requests
- Mantém histórico de deployments

## 🐛 Troubleshooting

### Build falha

1. Verifique os logs na Vercel
2. Certifique-se que todas as variáveis de ambiente estão configuradas
3. Teste o build localmente: `npm run build`

### Erro 404 em rotas

- O arquivo `vercel.json` já está configurado com routes para redirecionar todas as rotas para `index.html`
- Se ainda houver problemas:
  1. Verifique se o `outputDirectory` está como `dist`
  2. Certifique-se de que o build está gerando o `index.html` na pasta `dist`
  3. Teste localmente: `npm run build && npm run preview`
  4. Se o problema persistir, faça um novo deploy na Vercel

### API não conecta

1. Verifique se `VITE_API_URL` está configurada corretamente
2. Verifique se a API permite CORS da Vercel
3. Teste a URL da API diretamente no navegador

## 📝 Notas

- A Vercel oferece SSL automático (HTTPS)
- Domínios customizados podem ser adicionados nas configurações do projeto
- O deploy é gratuito para projetos pessoais
- Limite de 100GB de bandwidth por mês no plano gratuito

## 🔗 Links Úteis

- [Documentação Vercel](https://vercel.com/docs)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Configuração Vite](https://vercel.com/docs/frameworks/vite)

