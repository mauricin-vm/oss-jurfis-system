# Página de Membros - CCR

## Visão Geral

Módulo de gerenciamento de membros do CCR (Junta de Recursos Fiscais). Permite criar, visualizar, editar e excluir informações de membros como conselheiros, coordenadores e demais participantes.

**Rota:** `/ccr/membros`

## Estrutura de Arquivos

```
membros/
├── (routes)/
│   ├── novo/
│   │   └── page.tsx          # Página de criação de novo membro
│   └── [id]/
│       └── page.tsx          # Página de edição de membro
├── components/
│   ├── member-table.tsx      # Tabela com listagem de membros
│   ├── member-form.tsx       # Formulário de criação/edição
│   ├── member-form-skeleton.tsx  # Loading do formulário
│   ├── member-skeleton.tsx   # Loading da tabela
│   └── delete-modal.tsx      # Modal de confirmação de exclusão
└── page.tsx                  # Página principal de listagem
```

## Funcionalidades

### 1. Listagem de Membros (`page.tsx`, `member-table.tsx`)
- Visualização de todos os membros em tabela
- Busca por nome, cargo, CPF ou email
- Filtros:
  - **Status:** Todos, Ativos, Inativos
  - **Gênero:** Todos, Masculino, Feminino
- Paginação: 10, 20, 50 ou 100 itens por página
- Ordenação alfabética por nome
- Busca animada (expande/colapsa)

**Colunas da Tabela:**
- Nome
- Cargo
- CPF (formatado: 000.000.000-00)
- Telefone (formatado: (00) 00000-0000)
- Status (Ativo/Inativo)
- Ações (Editar/Excluir)

### 2. Criar Novo Membro (`(routes)/novo/page.tsx`)
- Formulário completo para cadastro
- Campos:
  - **Nome*** (obrigatório)
  - **Cargo** (ex: Conselheiro Titular)
  - **Gênero*** (obrigatório, select: Masculino/Feminino)
  - **CPF** (com máscara: 000.000.000-00)
  - **Matrícula**
  - **Órgão** (ex: Município, OAB/MS)
  - **Telefone** (com máscara: (00) 00000-0000)
  - **Email** (validação de email)
- Máscaras automáticas em CPF e Telefone
- Validação via toast (Nome e Gênero obrigatórios)
- Breadcrumbs: Menu > CCR > Membros > Novo

### 3. Editar Membro (`(routes)/[id]/page.tsx`)
- Carregamento dos dados existentes
- Formulário pré-preenchido com valores formatados
- Campo adicional:
  - **Membro Ativo** (switch) - controle de status
- Loading skeleton durante carregamento
- Tratamento de membro não encontrado
- Breadcrumbs: Menu > CCR > Membros > Editar

### 4. Excluir Membro (`delete-modal.tsx`)
- Modal de confirmação
- Animações de entrada/saída suaves
- Exibe nome do membro a ser excluído
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

## APIs Relacionadas

### GET `/api/ccr/members`
- Lista todos os membros
- Query params:
  - `isActive`: filtra por status (true/false)
- Retorna array ordenado alfabeticamente
- CPF e telefone armazenados sem formatação

### GET `/api/ccr/members/[id]`
- Retorna um membro específico
- Dados sem formatação (aplicada no frontend)

### POST `/api/ccr/members`
- Cria novo membro
- Body: `{ name, role?, cpf?, registration?, agency?, phone?, email?, gender, isActive }`
- CPF e telefone enviados sem formatação (apenas números)
- Validação: nome e gênero obrigatórios

### PUT `/api/ccr/members/[id]`
- Atualiza membro existente
- Body: `{ name, role?, cpf?, registration?, agency?, phone?, email?, gender, isActive }`
- CPF e telefone enviados sem formatação

### DELETE `/api/ccr/members/[id]`
- Exclusão permanente (hard delete)
- Apenas ADMIN pode executar

## Componentes Principais

### `MemberTable`
**Props:**
- `data: Member[]` - Array de membros
- `loading: boolean` - Estado de carregamento
- `onRefresh: () => void` - Callback para recarregar dados
- `onNewMember: () => void` - Callback para criar novo
- `userRole?: string` - Role do usuário para controle de permissões

**Funcionalidades:**
- Busca em tempo real (nome, cargo, CPF, email)
- Filtros de status e gênero
- Paginação com controle de itens por página
- Botão "Novo Membro" (apenas ADMIN e EMPLOYEE)
- Botão de excluir (apenas ADMIN)
- Formatação automática de CPF e telefone na exibição
- Empty state quando não há dados

### `MemberForm`
**Props:**
- `initialData?: { id?, name, role?, cpf?, registration?, agency?, phone?, email?, gender, isActive }` - Dados para edição

**Funcionalidades:**
- React Hook Form para gerenciamento de estado
- Validação de campos obrigatórios via toast (nome e gênero)
- **Máscaras automáticas:**
  - CPF: 000.000.000-00 (limitado a 11 dígitos)
  - Telefone: (00) 00000-0000 ou (00) 0000-0000 (detecta celular/fixo)
- Grid responsivo (2 colunas em desktop)
- Switch de "Ativo" apenas em modo edição
- Loading state no botão de submit
- Remove formatação antes de enviar para API
- Formata valores vindos do banco ao carregar

**Funções de Máscara:**
```typescript
formatCPF(value: string): string
// Entrada: "12345678900" ou "123.456.789-00"
// Saída: "123.456.789-00"

formatPhone(value: string): string
// Entrada: "67999999999" ou "(67) 99999-9999"
// Saída: "(67) 99999-9999" (celular) ou "(67) 9999-9999" (fixo)
```

### `DeleteModal`
**Props:**
- `isOpen: boolean`
- `memberName: string`
- `onClose: () => void`
- `onConfirm: () => void`

**Funcionalidades:**
- Animações de entrada/saída (200ms)
- Backdrop com blur
- Bloqueio de interação durante submit
- Aviso visual (ícone amarelo de alerta)
- Exibe nome do membro em destaque

## Fluxo de Dados

### Criação de Membro
```
1. Usuário clica "Novo Membro"
2. Navega para /ccr/membros/novo
3. Usuário preenche formulário
   - CPF e telefone são formatados em tempo real
4. Validação: nome e gênero obrigatórios
5. Formatação é removida (apenas números)
6. POST /api/ccr/members
7. Toast de sucesso
8. Redirect para /ccr/membros
```

### Edição de Membro
```
1. Usuário clica em "Editar" na tabela
2. Navega para /ccr/membros/[id]
3. GET /api/ccr/members/[id] (carrega dados)
4. MemberForm formata CPF e telefone automaticamente
5. MemberForm pré-preenche campos
6. Usuário edita campos
   - Máscaras aplicadas em tempo real
7. Formatação é removida (apenas números)
8. PUT /api/ccr/members/[id]
9. Toast de sucesso
10. Redirect para /ccr/membros
```

### Exclusão de Membro
```
1. Usuário clica em "Excluir" (apenas ADMIN)
2. DeleteModal abre com nome do membro
3. Usuário confirma
4. DELETE /api/ccr/members/[id]
5. Toast de sucesso ou erro
6. Tabela recarrega automaticamente
7. Modal fecha
```

## Modelo de Dados (Prisma)

```prisma
model Member {
  id           String   @id @default(cuid())
  name         String
  role         String?
  cpf          String?   // Armazenado sem formatação: "12345678900"
  registration String?
  agency       String?
  phone        String?   // Armazenado sem formatação: "67999999999"
  email        String?
  gender       Gender?
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@schema("jurfis")
}

enum Gender {
  MASCULINO
  FEMININO

  @@schema("jurfis")
}
```

## Máscaras e Formatação

### Armazenamento no Banco
- **CPF:** Apenas números (11 dígitos) - Ex: `12345678900`
- **Telefone:** Apenas números (10-11 dígitos) - Ex: `67999999999`

### Exibição no Frontend
- **CPF:** Com formatação - Ex: `123.456.789-00`
- **Telefone:** Com formatação - Ex: `(67) 99999-9999`

### Funções de Formatação (member-form.tsx)

**formatCPF:**
```typescript
// Remove caracteres não numéricos
// Aplica máscara: 000.000.000-00
// Limita a 11 dígitos
```

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
Cargo | Gênero *
CPF | Matrícula
Órgão (linha inteira)
Telefone | Email
[Membro Ativo] (switch, apenas em edição)
```

### Validações
- **Nome:** Obrigatório, texto livre
- **Gênero:** Obrigatório, select (Masculino/Feminino)
- **CPF:** Opcional, máscara automática (11 dígitos)
- **Telefone:** Opcional, máscara automática (10-11 dígitos)
- **Email:** Opcional, validação de formato de email

### Placeholders
- Nome: "Ex: João Silva"
- Cargo: "Ex: Conselheiro Titular"
- CPF: "000.000.000-00"
- Matrícula: "Ex: 123456"
- Órgão: "Ex: Município, OAB/MS"
- Telefone: "(00) 00000-0000"
- Email: "exemplo@email.com"

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
- Validação no frontend (nome e gênero)
- Validação no backend
- Máscaras em tempo real (CPF e Telefone)

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
- Cargo (case-insensitive)
- CPF (com ou sem formatação)
- Email (case-insensitive)

### Filtros
1. **Status:**
   - Todos
   - Ativos (isActive = true)
   - Inativos (isActive = false)

2. **Gênero:**
   - Todos
   - Masculino (MASCULINO)
   - Feminino (FEMININO)

Os filtros são aplicados em conjunto com a busca.
