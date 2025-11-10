# Página de Setores - CCR

## Visão Geral

Módulo de gerenciamento de setores do CCR (Junta de Recursos Fiscais). Permite criar, visualizar, editar e excluir informações de setores administrativos, incluindo dados de contato e identificação.

**Rota:** `/ccr/setores`

## Estrutura de Arquivos

```
setores/
├── (routes)/
│   ├── novo/
│   │   └── page.tsx          # Página de criação de novo setor
│   └── [id]/
│       └── page.tsx          # Página de edição de setor
├── components/
│   ├── sector-table.tsx      # Tabela com listagem de setores
│   ├── sector-form.tsx       # Formulário de criação/edição
│   ├── sector-form-skeleton.tsx  # Loading do formulário
│   ├── sector-skeleton.tsx   # Loading da tabela
│   └── delete-modal.tsx      # Modal de confirmação de exclusão
└── page.tsx                  # Página principal de listagem
```

## Funcionalidades

### 1. Listagem de Setores (`page.tsx`, `sector-table.tsx`)
- Visualização de todos os setores em tabela
- Busca por nome, abreviação, código de despacho ou email
- Filtros:
  - **Status:** Todos, Ativos, Inativos
- Paginação: 10, 20, 50 ou 100 itens por página
- Ordenação alfabética por nome
- Busca animada (expande/colapsa)

**Colunas da Tabela:**
- Nome
- Abreviação
- Código de Despacho
- Telefone (formatado: (00) 00000-0000)
- Status (Ativo/Inativo)
- Ações (Editar/Excluir)

### 2. Criar Novo Setor (`(routes)/novo/page.tsx`)
- Formulário completo para cadastro
- Campos:
  - **Nome*** (obrigatório)
  - **Abreviação** (ex: FISC, CONT)
  - **Código de Despacho** (ex: FIS-001)
  - **Descrição** (textarea)
  - **Telefone** (com máscara: (00) 00000-0000)
  - **Email** (validação de email)
  - **Endereço** (textarea)
- Máscaras automáticas em Telefone
- Validação via toast (Nome obrigatório)
- Breadcrumbs: Menu > CCR > Setores > Novo

### 3. Editar Setor (`(routes)/[id]/page.tsx`)
- Carregamento dos dados existentes
- Formulário pré-preenchido com valores formatados
- Campo adicional:
  - **Setor Ativo** (switch) - controle de status
- Loading skeleton durante carregamento
- Tratamento de setor não encontrado
- Breadcrumbs: Menu > CCR > Setores > Editar

### 4. Excluir Setor (`delete-modal.tsx`)
- Modal de confirmação
- Animações de entrada/saída suaves
- Exibe nome do setor a ser excluído
- Aviso sobre ação irreversível
- Estado de loading durante exclusão
- Não permite fechar durante processamento

## Permissões

As permissões são gerenciadas via `src/lib/permissions.ts`:

| Ação | ADMIN | EMPLOYEE | EXTERNAL |
|------|-------|----------|----------|
| Acessar/Visualizar | ✅ | ✅ | ❌ |
| Criar | ✅ | ✅ | ❌ |
| Editar | ✅ | ✅ | ❌ |
| Excluir | ✅ | ❌ | ❌ |

- **EXTERNAL** não tem acesso ao módulo (redirecionado para `/ccr`)
- **EMPLOYEE** pode visualizar, criar e editar, mas não excluir
- **ADMIN** tem acesso completo

**Nota:** O menu "Configurações" no sidebar não aparece para usuários EXTERNAL.

## APIs Relacionadas

### GET `/api/ccr/sectors`
- Lista todos os setores
- Query params:
  - `isActive`: filtra por status (true/false)
- Retorna array ordenado alfabeticamente
- Telefone armazenado sem formatação

### GET `/api/ccr/sectors/[id]`
- Retorna um setor específico
- Dados sem formatação (aplicada no frontend)

### POST `/api/ccr/sectors`
- Cria novo setor
- Body: `{ name, abbreviation?, dispatchCode?, description?, phone?, email?, address?, isActive }`
- Telefone enviado sem formatação (apenas números)
- Validação: nome obrigatório

### PUT `/api/ccr/sectors/[id]`
- Atualiza setor existente
- Body: `{ name, abbreviation?, dispatchCode?, description?, phone?, email?, address?, isActive }`
- Telefone enviado sem formatação

### DELETE `/api/ccr/sectors/[id]`
- Exclusão permanente (hard delete)
- Apenas ADMIN pode executar

## Componentes Principais

### `SectorTable`
**Props:**
- `data: Sector[]` - Array de setores
- `loading: boolean` - Estado de carregamento
- `onRefresh: () => void` - Callback para recarregar dados
- `onNewSector: () => void` - Callback para criar novo
- `userRole?: string` - Role do usuário para controle de permissões

**Funcionalidades:**
- Busca em tempo real (nome, abreviação, código, email)
- Filtro de status (todos/ativos/inativos)
- Paginação com controle de itens por página
- Botão "Novo Setor" (apenas ADMIN e EMPLOYEE)
- Botão de excluir (apenas ADMIN)
- Empty state quando não há dados

### `SectorForm`
**Props:**
- `initialData?: { id?, name, abbreviation?, dispatchCode?, description?, phone?, email?, address?, isActive }` - Dados para edição

**Funcionalidades:**
- React Hook Form para gerenciamento de estado
- Validação de nome obrigatório via toast
- **Máscara automática:**
  - Telefone: (00) 00000-0000 ou (00) 0000-0000 (detecta celular/fixo)
- Grid responsivo (2 colunas em desktop)
- Switch de "Ativo" apenas em modo edição
- Loading state no botão de submit
- Remove formatação antes de enviar para API
- Formata valores vindos do banco ao carregar

**Função de Máscara:**
```typescript
formatPhone(value: string): string
// Entrada: "67999999999" ou "(67) 99999-9999"
// Saída: "(67) 99999-9999" (celular) ou "(67) 9999-9999" (fixo)
```

### `DeleteModal`
**Props:**
- `isOpen: boolean`
- `sectorName: string`
- `onClose: () => void`
- `onConfirm: () => void`

**Funcionalidades:**
- Animações de entrada/saída (200ms)
- Backdrop com blur
- Bloqueio de interação durante submit
- Aviso visual (ícone amarelo de alerta)
- Exibe nome do setor em destaque

## Fluxo de Dados

### Criação de Setor
```
1. Usuário clica "Novo Setor"
2. Navega para /ccr/setores/novo
3. Usuário preenche formulário
   - Telefone é formatado em tempo real
4. Validação: nome obrigatório
5. Formatação é removida (apenas números)
6. POST /api/ccr/sectors
7. Toast de sucesso
8. Redirect para /ccr/setores
```

### Edição de Setor
```
1. Usuário clica em "Editar" na tabela
2. Navega para /ccr/setores/[id]
3. GET /api/ccr/sectors/[id] (carrega dados)
4. SectorForm formata telefone automaticamente
5. SectorForm pré-preenche campos
6. Usuário edita campos
   - Máscara aplicada em tempo real
7. Formatação é removida (apenas números)
8. PUT /api/ccr/sectors/[id]
9. Toast de sucesso
10. Redirect para /ccr/setores
```

### Exclusão de Setor
```
1. Usuário clica em "Excluir" (apenas ADMIN)
2. DeleteModal abre com nome do setor
3. Usuário confirma
4. DELETE /api/ccr/sectors/[id]
5. Toast de sucesso ou erro
6. Tabela recarrega automaticamente
7. Modal fecha
```

## Modelo de Dados (Prisma)

```prisma
model Sector {
  id            String   @id @default(uuid())
  name          String   @unique
  abbreviation  String?  @unique
  dispatchCode  String?
  description   String?  @db.Text
  phone         String?   // Armazenado sem formatação: "67999999999"
  email         String?
  address       String?  @db.Text
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relacionamentos
  tramitations  Tramitation[]
  notifications Notification[]

  @@index([isActive])
  @@map("CCR_Sector")
  @@schema("jurfis")
}
```

## Máscaras e Formatação

### Armazenamento no Banco
- **Telefone:** Apenas números (10-11 dígitos) - Ex: `67999999999`

### Exibição no Frontend
- **Telefone:** Com formatação - Ex: `(67) 99999-9999`

### Função de Formatação (sector-form.tsx)

**formatPhone:**
```typescript
// Remove caracteres não numéricos
// Detecta celular (11 dígitos) ou fixo (10 dígitos)
// Celular: (00) 00000-0000
// Fixo: (00) 0000-0000
// Limita a 11 dígitos
```

## Campos do Formulário

### Layout do Formulário
```
Nome (linha inteira) *
Abreviação | Código de Despacho
Descrição (linha inteira, textarea)
Telefone | Email
Endereço (linha inteira, textarea)
[Setor Ativo] (switch, apenas em edição)
```

### Validações
- **Nome:** Obrigatório, texto livre
- **Abreviação:** Opcional, texto curto
- **Código de Despacho:** Opcional, identificador
- **Descrição:** Opcional, textarea (funções e responsabilidades)
- **Telefone:** Opcional, máscara automática (10-11 dígitos)
- **Email:** Opcional, validação de formato de email
- **Endereço:** Opcional, textarea (localização física)

### Placeholders
- Nome: "Ex: Fiscalização"
- Abreviação: "Ex: FISC"
- Código de Despacho: "Ex: FIS-001"
- Descrição: "Descreva as funções e responsabilidades do setor..."
- Telefone: "(00) 00000-0000"
- Email: "setor@exemplo.com"
- Endereço: "Ex: Rua Exemplo, 123 - Bairro - Cidade/UF"

## Características Técnicas

### Next.js 14 App Router
- Server Components e Client Components
- Route Groups: `(routes)` e `(configurações)`
- Dynamic Routes: `[id]`

### Estilização
- Tailwind CSS
- Shadcn/ui components
- Animações CSS customizadas
- Design responsivo (mobile-first)
- Grid layout responsivo (1 coluna mobile, 2 colunas desktop)

### Validação
- Toast-based validation (Sonner)
- Validação no frontend (nome obrigatório)
- Validação no backend
- Máscara em tempo real (Telefone)

### UX
- Loading skeletons durante carregamento
- Empty states informativos
- Breadcrumbs para navegação
- Animações suaves em modais e busca
- Feedback visual em todas as ações
- Máscaras não intrusivas (permite colar valores)
- Formatação automática ao carregar dados

## Boas Práticas

1. **Sempre validar permissões** no frontend e backend
2. **Usar skeletons** para melhor percepção de performance
3. **Fornecer feedback** via toast em todas as ações
4. **Ordenar resultados** alfabeticamente para consistência
5. **Filtrar dados** no cliente para melhor performance
6. **Redirecionar** após criar/editar para lista principal
7. **Confirmar exclusões** para evitar perdas acidentais
8. **Armazenar dados sem formatação** no banco para facilitar buscas e operações
9. **Formatar apenas na exibição** para melhor experiência do usuário
10. **Limitar tamanho dos campos** com máscaras para evitar erros

## Busca e Filtros

### Busca
A busca é realizada nos seguintes campos:
- Nome (case-insensitive)
- Abreviação (case-insensitive)
- Código de Despacho (case-insensitive)
- Email (case-insensitive)

### Filtros
1. **Status:**
   - Todos
   - Ativos (isActive = true)
   - Inativos (isActive = false)

Os filtros são aplicados em conjunto com a busca.

## Integração com Outros Módulos

Os setores são utilizados em outros módulos do sistema:

- **Tramitações:** Destino de tramitações pode ser um setor
- **Notificações:** Notificações podem ser vinculadas a setores

Ao excluir um setor, verificar se há dependências com esses módulos antes de permitir a exclusão.
