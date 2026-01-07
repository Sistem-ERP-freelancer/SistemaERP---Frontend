# 📄 Guia Backend - Estilização de PDF de Relatórios de Pedidos

## 📌 Visão Geral

Este guia descreve como estilizar o PDF de relatórios de pedidos no backend para seguir o mesmo padrão visual do PDF de pedidos individual, mantendo consistência visual em todo o sistema.

---

## 🎨 Estrutura Visual do PDF

### Layout Geral

```
┌─────────────────────────────────────────────────────────┐
│                    HEADER (Empresa)                      │
│  Nome da Empresa | CNPJ | Endereço                       │
│  Telefone | Email | Vendedor                             │
├─────────────────────────────────────────────────────────┤
│                    TÍTULO DO RELATÓRIO                   │
│              "RELATÓRIO DE PEDIDOS"                      │
│  Data de geração | Período (se aplicável)                │
├─────────────────────────────────────────────────────────┤
│              SEÇÃO: DADOS DO CLIENTE                      │
│  (Fundo cinza claro)                                      │
│  Razão Social | CNPJ/CPF | CEP | Telefone                │
│  Nome Fantasia | Endereço | Cidade/UF | Email            │
├─────────────────────────────────────────────────────────┤
│                    TABELA DE PRODUTOS                     │
│  (Fundo cinza claro no cabeçalho)                        │
│  ITEM | NOME | UND. | QTD. | VR. UNIT. | SUBTOTAL        │
│  ─────────────────────────────────────────────           │
│  1    | ...  | UN   | 100  | 10,00     | 1.000,00       │
│  2    | ...  | KG   | 50   | 5,50      | 275,00         │
│  ─────────────────────────────────────────────           │
│  TOTAL: R$ 1.275,00                                       │
├─────────────────────────────────────────────────────────┤
│              SEÇÃO: DADOS DO PAGAMENTO                    │
│  (Fundo cinza claro no cabeçalho)                        │
│  VENCIMENTO | VALOR | FORMA DE PAGAMENTO | OBSERVAÇÃO    │
├─────────────────────────────────────────────────────────┤
│                    FOOTER                                 │
│  Informações adicionais (se necessário)                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Especificações de Estilo

### 1. Cores

```javascript
const cores = {
  // Cores principais
  preto: '#000000',
  branco: '#FFFFFF',
  
  // Fundo cinza claro para seções
  fundoCinzaClaro: '#F5F5F5', // ou #E8E8E8
  
  // Bordas
  bordaCinza: '#CCCCCC',
  
  // Texto
  textoPrincipal: '#000000',
  textoSecundario: '#666666',
};
```

### 2. Fontes

```javascript
const fontes = {
  // Fonte principal (sans-serif)
  principal: 'Helvetica', // ou 'Arial', 'Roboto'
  negrito: 'Helvetica-Bold',
  
  // Tamanhos
  titulo: 18,      // Título principal
  subtitulo: 14,   // Subtítulos de seção
  texto: 10,       // Texto normal
  textoPequeno: 8, // Texto pequeno (rodapé)
};
```

### 3. Espaçamentos

```javascript
const espacamentos = {
  margemSuperior: 30,
  margemInferior: 30,
  margemEsquerda: 30,
  margemDireita: 30,
  
  espacamentoEntreSecoes: 15,
  espacamentoInterno: 10,
  alturaLinhaTabela: 20,
};
```

---

## 📐 Estrutura Detalhada por Seção

### 1. HEADER (Cabeçalho da Empresa)

**Posição:** Topo do documento

**Conteúdo:**
- Nome da empresa (negrito, centralizado)
- CNPJ da empresa
- Endereço completo (logradouro, número, bairro, cidade/UF, CEP)
- Telefone e Email
- Nome do Vendedor (se aplicável)

**Estilo:**
```javascript
// Exemplo com PDFKit (Node.js)
doc
  .fontSize(16)
  .font('Helvetica-Bold')
  .text('NOME DA EMPRESA LTDA', { align: 'center' })
  
  .fontSize(10)
  .font('Helvetica')
  .text(`CNPJ: ${empresa.cnpj}`, { align: 'center' })
  .text(`${empresa.endereco}`, { align: 'center' })
  .text(`CEP: ${empresa.cep}`, { align: 'center' })
  .text(`Telefone: ${empresa.telefone} | Email: ${empresa.email}`, { align: 'center' })
  
  .moveDown(0.5)
  .strokeColor('#CCCCCC')
  .lineWidth(1)
  .moveTo(30, doc.y)
  .lineTo(565, doc.y)
  .stroke();
```

---

### 2. TÍTULO DO RELATÓRIO

**Posição:** Logo abaixo do header

**Conteúdo:**
- "RELATÓRIO DE PEDIDOS" (negrito, centralizado, tamanho 18)
- Data de geração (formato: DD/MM/YYYY)
- Período (se aplicável): "De DD/MM/YYYY até DD/MM/YYYY"

**Estilo:**
```javascript
doc
  .moveDown(1)
  .fontSize(18)
  .font('Helvetica-Bold')
  .text('RELATÓRIO DE PEDIDOS', { align: 'center' })
  
  .fontSize(10)
  .font('Helvetica')
  .text(`Data de geração: ${formatarData(new Date())}`, { align: 'center' })
  
  // Se houver período
  if (dataInicial && dataFinal) {
    doc.text(
      `Período: De ${formatarData(dataInicial)} até ${formatarData(dataFinal)}`,
      { align: 'center' }
    );
  }
  
  .moveDown(1);
```

---

### 3. SEÇÃO: DADOS DO CLIENTE

**Posição:** Após o título

**Características:**
- Fundo cinza claro (#F5F5F5) no cabeçalho da seção
- Texto "DADOS DO CLIENTE" em negrito
- Layout em duas colunas

**Estrutura:**
```
┌─────────────────────────────────────────────┐
│ DADOS DO CLIENTE (fundo cinza)              │
├──────────────────┬──────────────────────────┤
│ Razão Social:    │ Nome Fantasia:           │
│ CNPJ/CPF:        │ Endereço:                │
│ CEP:             │ Cidade/UF:               │
│ Telefone:        │ E-mail:                  │
└──────────────────┴──────────────────────────┘
```

**Estilo:**
```javascript
// Cabeçalho da seção com fundo cinza
const yInicial = doc.y;
const alturaCabecalho = 20;

doc
  .rect(30, yInicial, 535, alturaCabecalho)
  .fillColor('#F5F5F5')
  .fill()
  .fillColor('#000000')
  .fontSize(12)
  .font('Helvetica-Bold')
  .text('DADOS DO CLIENTE', 35, yInicial + 5);

// Conteúdo em duas colunas
const yConteudo = yInicial + alturaCabecalho + 10;
const larguraColuna = 250;

// Coluna esquerda
doc
  .fontSize(10)
  .font('Helvetica')
  .text(`Razão Social: ${cliente.nome_razao || cliente.nome}`, 35, yConteudo)
  .text(`CNPJ/CPF: ${cliente.cpf_cnpj}`, 35, yConteudo + 15)
  .text(`CEP: ${cliente.enderecos?.[0]?.cep || '-'}`, 35, yConteudo + 30)
  .text(`Telefone: ${cliente.contato?.[0]?.telefone || '-'}`, 35, yConteudo + 45);

// Coluna direita
doc
  .text(`Nome Fantasia: ${cliente.nome_fantasia || '-'}`, 300, yConteudo)
  .text(`Endereço: ${formatarEndereco(cliente.enderecos?.[0])}`, 300, yConteudo + 15)
  .text(`Cidade/UF: ${cliente.enderecos?.[0]?.cidade || '-'}/${cliente.enderecos?.[0]?.estado || '-'}`, 300, yConteudo + 30)
  .text(`E-mail: ${cliente.contato?.[0]?.email || '-'}`, 300, yConteudo + 45);

doc.moveDown(1);
```

---

### 4. TABELA DE PRODUTOS

**Posição:** Após a seção de dados do cliente

**Características:**
- Fundo cinza claro no cabeçalho
- Colunas: ITEM | NOME | UND. | QTD. | VR. UNIT. | SUBTOTAL
- Linhas alternadas (opcional, mas recomendado)
- Total no final

**Estrutura:**
```
┌────────────────────────────────────────────────────────────┐
│ PRODUTOS (fundo cinza)                                      │
├────┬──────────┬──────┬────────┬───────────┬───────────────┤
│ITEM│ NOME     │ UND. │ QTD.   │ VR. UNIT. │ SUBTOTAL      │
├────┼──────────┼──────┼────────┼───────────┼───────────────┤
│ 1  │ Produto  │ UN   │ 100,00 │ 10,00     │ 1.000,00      │
│ 2  │ Produto  │ KG   │ 50,00  │ 5,50      │ 275,00        │
├────┴──────────┴──────┴────────┴───────────┴───────────────┤
│ TOTAL: R$ 1.275,00                                         │
└────────────────────────────────────────────────────────────┘
```

**Estilo:**
```javascript
// Cabeçalho da tabela
const yTabela = doc.y;
const alturaCabecalhoTabela = 20;
const colunas = [
  { nome: 'ITEM', largura: 40 },
  { nome: 'NOME', largura: 200 },
  { nome: 'UND.', largura: 50 },
  { nome: 'QTD.', largura: 80 },
  { nome: 'VR. UNIT.', largura: 80 },
  { nome: 'SUBTOTAL', largura: 85 },
];

// Desenhar cabeçalho com fundo cinza
doc
  .rect(30, yTabela, 535, alturaCabecalhoTabela)
  .fillColor('#F5F5F5')
  .fill()
  .fillColor('#000000');

// Textos do cabeçalho
let xAtual = 35;
colunas.forEach((coluna, index) => {
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(coluna.nome, xAtual, yTabela + 5, { width: coluna.largura });
  
  if (index < colunas.length - 1) {
    xAtual += coluna.largura;
  }
});

// Linhas da tabela
let yLinha = yTabela + alturaCabecalhoTabela;
pedidos.forEach((pedido, indexPedido) => {
  pedido.itens.forEach((item, indexItem) => {
    const numeroItem = indexItem + 1;
    const yAtual = yLinha;
    
    // Fundo alternado (opcional)
    if (indexItem % 2 === 0) {
      doc
        .rect(30, yAtual, 535, 20)
        .fillColor('#FAFAFA')
        .fill()
        .fillColor('#000000');
    }
    
    // Desenhar bordas da linha
    doc
      .strokeColor('#CCCCCC')
      .lineWidth(0.5)
      .moveTo(30, yAtual)
      .lineTo(565, yAtual)
      .stroke();
    
    // Conteúdo da linha
    xAtual = 35;
    doc
      .fontSize(9)
      .font('Helvetica')
      .text(numeroItem.toString(), xAtual, yAtual + 5, { width: 40 })
      .text(item.produto.nome || '-', xAtual + 40, yAtual + 5, { width: 200 })
      .text(item.unidade || 'UN', xAtual + 240, yAtual + 5, { width: 50 })
      .text(formatarNumero(item.quantidade), xAtual + 290, yAtual + 5, { width: 80, align: 'right' })
      .text(formatarMoeda(item.valor_unitario), xAtual + 370, yAtual + 5, { width: 80, align: 'right' })
      .text(formatarMoeda(item.subtotal), xAtual + 450, yAtual + 5, { width: 85, align: 'right' });
    
    yLinha += 20;
  });
});

// Linha de total
doc
  .strokeColor('#000000')
  .lineWidth(1)
  .moveTo(30, yLinha)
  .lineTo(565, yLinha)
  .stroke();

yLinha += 5;

doc
  .fontSize(11)
  .font('Helvetica-Bold')
  .text('TOTAL:', 400, yLinha, { width: 100, align: 'right' })
  .text(formatarMoeda(totalGeral), 500, yLinha, { width: 65, align: 'right' });

doc.y = yLinha + 25;
```

---

### 5. SEÇÃO: DADOS DO PAGAMENTO

**Posição:** Após a tabela de produtos

**Características:**
- Fundo cinza claro no cabeçalho
- Tabela com: VENCIMENTO | VALOR | FORMA DE PAGAMENTO | OBSERVAÇÃO

**Estrutura:**
```
┌────────────────────────────────────────────────────────────┐
│ DADOS DO PAGAMENTO (fundo cinza)                          │
├──────────────┬─────────┬──────────────────┬───────────────┤
│ VENCIMENTO  │ VALOR   │ FORMA DE PAG.    │ OBSERVAÇÃO    │
├──────────────┼─────────┼──────────────────┼───────────────┤
│ 20/01/2026  │ 1.275,00│ Boleto Bancário  │ -             │
└──────────────┴─────────┴──────────────────┴───────────────┘
```

**Estilo:**
```javascript
// Cabeçalho
const yPagamento = doc.y + 10;
const alturaCabecalhoPagamento = 20;

doc
  .rect(30, yPagamento, 535, alturaCabecalhoPagamento)
  .fillColor('#F5F5F5')
  .fill()
  .fillColor('#000000')
  .fontSize(12)
  .font('Helvetica-Bold')
  .text('DADOS DO PAGAMENTO', 35, yPagamento + 5);

// Cabeçalho da tabela
const yTabelaPagamento = yPagamento + alturaCabecalhoPagamento + 5;
const colunasPagamento = [
  { nome: 'VENCIMENTO', largura: 120 },
  { nome: 'VALOR', largura: 120 },
  { nome: 'FORMA DE PAGAMENTO', largura: 180 },
  { nome: 'OBSERVAÇÃO', largura: 115 },
];

// Desenhar cabeçalho da tabela
doc
  .rect(30, yTabelaPagamento, 535, 20)
  .fillColor('#F5F5F5')
  .fill()
  .fillColor('#000000');

let xAtualPagamento = 35;
colunasPagamento.forEach((coluna) => {
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(coluna.nome, xAtualPagamento, yTabelaPagamento + 5, { width: coluna.largura });
  xAtualPagamento += coluna.largura;
});

// Linhas de pagamento
let yLinhaPagamento = yTabelaPagamento + 20;
pagamentos.forEach((pagamento) => {
  doc
    .strokeColor('#CCCCCC')
    .lineWidth(0.5)
    .moveTo(30, yLinhaPagamento)
    .lineTo(565, yLinhaPagamento)
    .stroke();
  
  doc
    .fontSize(9)
    .font('Helvetica')
    .text(formatarData(pagamento.vencimento), 35, yLinhaPagamento + 5, { width: 120 })
    .text(formatarMoeda(pagamento.valor), 155, yLinhaPagamento + 5, { width: 120, align: 'right' })
    .text(pagamento.forma_pagamento || '-', 275, yLinhaPagamento + 5, { width: 180 })
    .text(pagamento.observacao || '-', 455, yLinhaPagamento + 5, { width: 115 });
  
  yLinhaPagamento += 20;
});

doc.y = yLinhaPagamento + 10;
```

---

### 6. FOOTER (Rodapé)

**Posição:** Final do documento

**Conteúdo:**
- Linha separadora
- Informações adicionais (se necessário)
- Espaço para assinatura (opcional)

**Estilo:**
```javascript
// Linha separadora
doc
  .moveDown(2)
  .strokeColor('#CCCCCC')
  .lineWidth(1)
  .moveTo(30, doc.y)
  .lineTo(565, doc.y)
  .stroke();

// Texto do rodapé (se necessário)
doc
  .moveDown(1)
  .fontSize(8)
  .font('Helvetica')
  .text('Este documento foi gerado automaticamente pelo sistema.', { align: 'center' });
```

---

## 🔧 Funções Auxiliares Necessárias

### Formatação de Data

```javascript
function formatarData(data) {
  if (!data) return '-';
  
  const date = new Date(data);
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const ano = date.getFullYear();
  
  return `${dia}/${mes}/${ano}`;
}
```

### Formatação de Moeda

```javascript
function formatarMoeda(valor) {
  if (!valor) return '0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}
```

### Formatação de Número

```javascript
function formatarNumero(valor) {
  if (!valor) return '0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}
```

### Formatação de Endereço

```javascript
function formatarEndereco(endereco) {
  if (!endereco) return '-';
  
  const partes = [];
  
  if (endereco.logradouro) partes.push(endereco.logradouro);
  if (endereco.numero) partes.push(endereco.numero);
  if (endereco.complemento) partes.push(`(${endereco.complemento})`);
  if (endereco.bairro) partes.push(`- ${endereco.bairro}`);
  
  return partes.join(' ') || '-';
}
```

---

## 📦 Exemplo Completo com PDFKit (Node.js)

```javascript
const PDFDocument = require('pdfkit');

function gerarRelatorioPedidosPDF(pedidos, empresa, cliente, dataInicial, dataFinal) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 30, bottom: 30, left: 30, right: 30 },
  });
  
  // Configurações iniciais
  doc.font('Helvetica');
  
  // 1. HEADER
  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .text(empresa.nome, { align: 'center' })
    .fontSize(10)
    .font('Helvetica')
    .text(`CNPJ: ${empresa.cnpj}`, { align: 'center' })
    .text(`${empresa.endereco}`, { align: 'center' })
    .text(`CEP: ${empresa.cep}`, { align: 'center' })
    .text(`Telefone: ${empresa.telefone} | Email: ${empresa.email}`, { align: 'center' })
    .moveDown(0.5)
    .strokeColor('#CCCCCC')
    .lineWidth(1)
    .moveTo(30, doc.y)
    .lineTo(565, doc.y)
    .stroke();
  
  // 2. TÍTULO
  doc
    .moveDown(1)
    .fontSize(18)
    .font('Helvetica-Bold')
    .text('RELATÓRIO DE PEDIDOS', { align: 'center' })
    .fontSize(10)
    .font('Helvetica')
    .text(`Data de geração: ${formatarData(new Date())}`, { align: 'center' });
  
  if (dataInicial && dataFinal) {
    doc.text(
      `Período: De ${formatarData(dataInicial)} até ${formatarData(dataFinal)}`,
      { align: 'center' }
    );
  }
  
  doc.moveDown(1);
  
  // 3. DADOS DO CLIENTE
  const yCliente = doc.y;
  doc
    .rect(30, yCliente, 535, 20)
    .fillColor('#F5F5F5')
    .fill()
    .fillColor('#000000')
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('DADOS DO CLIENTE', 35, yCliente + 5);
  
  const yConteudoCliente = yCliente + 30;
  doc
    .fontSize(10)
    .font('Helvetica')
    .text(`Razão Social: ${cliente.nome_razao || cliente.nome}`, 35, yConteudoCliente)
    .text(`CNPJ/CPF: ${cliente.cpf_cnpj}`, 35, yConteudoCliente + 15)
    .text(`CEP: ${cliente.enderecos?.[0]?.cep || '-'}`, 35, yConteudoCliente + 30)
    .text(`Telefone: ${cliente.contato?.[0]?.telefone || '-'}`, 35, yConteudoCliente + 45)
    .text(`Nome Fantasia: ${cliente.nome_fantasia || '-'}`, 300, yConteudoCliente)
    .text(`Endereço: ${formatarEndereco(cliente.enderecos?.[0])}`, 300, yConteudoCliente + 15)
    .text(`Cidade/UF: ${cliente.enderecos?.[0]?.cidade || '-'}/${cliente.enderecos?.[0]?.estado || '-'}`, 300, yConteudoCliente + 30)
    .text(`E-mail: ${cliente.contato?.[0]?.email || '-'}`, 300, yConteudoCliente + 45);
  
  doc.y = yConteudoCliente + 70;
  
  // 4. TABELA DE PRODUTOS
  // ... (código da tabela conforme exemplo anterior)
  
  // 5. DADOS DO PAGAMENTO
  // ... (código da seção de pagamento conforme exemplo anterior)
  
  // 6. FOOTER
  doc
    .moveDown(2)
    .strokeColor('#CCCCCC')
    .lineWidth(1)
    .moveTo(30, doc.y)
    .lineTo(565, doc.y)
    .stroke();
  
  return doc;
}
```

---

## 📋 Checklist de Implementação

- [ ] Configurar margens do documento (30px em todos os lados)
- [ ] Implementar header com informações da empresa (sem logo)
- [ ] Implementar título do relatório centralizado
- [ ] Implementar seção "DADOS DO CLIENTE" com fundo cinza claro
- [ ] Implementar tabela de produtos com cabeçalho cinza claro
- [ ] Implementar seção "DADOS DO PAGAMENTO" com fundo cinza claro
- [ ] Implementar footer com linha separadora
- [ ] Criar funções auxiliares de formatação (data, moeda, número)
- [ ] Testar geração de PDF com diferentes quantidades de pedidos
- [ ] Verificar quebra de página quando necessário
- [ ] Validar formatação de valores monetários (R$ com vírgula)
- [ ] Validar formatação de datas (DD/MM/YYYY)

---

## 🎯 Pontos Importantes

1. **Sem Logo:** O PDF não deve conter logo da empresa, apenas texto
2. **Cores:** Usar apenas preto, branco e cinza claro (#F5F5F5)
3. **Fontes:** Usar Helvetica ou Arial (sans-serif)
4. **Formatação:** Valores monetários em formato brasileiro (R$ 1.000,00)
5. **Espaçamento:** Manter espaçamentos consistentes entre seções
6. **Bordas:** Usar linhas cinzas (#CCCCCC) para separar seções
7. **Alinhamento:** Valores numéricos alinhados à direita

---

## 📚 Recursos Adicionais

- [PDFKit Documentation](https://pdfkit.org/)
- [Puppeteer PDF Generation](https://pptr.dev/)
- [jsPDF Documentation](https://github.com/parallax/jsPDF)

---

**Última atualização:** Janeiro 2025

















