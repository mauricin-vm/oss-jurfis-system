# Página de Assuntos - CCR

## Visão Geral

Módulo de gerenciamento de assuntos (temas) do sistema CCR. Permite criar, visualizar, editar e excluir assuntos jurídicos, com suporte a hierarquia (assuntos principais e sub-assuntos).

**Rota:** `/ccr/assuntos`

## Estrutura de Arquivos

```
assuntos/
├── (routes)/
│   ├── novo/
│   │   └── page.tsx          # Página de criação de novo assunto
│   └── [id]/
│       └── page.tsx          # Página de edição de assunto
├── components/
│   ├── subject-table.tsx     # Tabela com listagem de assuntos
│   ├── subject-form.tsx      # Formulário de criação/edição
│   ├── subject-form-skeleton.tsx  # Loading do formulário
│   ├── subject-skeleton.tsx  # Loading da tabela
│   └── delete-modal.tsx      # Modal de confirmação de exclusão
└── page.tsx                  # Página principal de listagem
```

## Funcionalidades

### 1. Listagem de Assuntos (`page.tsx`, `subject-table.tsx`)
- Visualização de todos os assuntos em tabela
- Busca por nome ou descrição
- Filtros:
  - **Status:** Todos, Ativos, Inativos
- Paginação: 10, 20, 50 ou 100 itens por página
- Ordenação alfabética por nome
- Busca animada (expande/colapsa)

**Colunas da Tabela:**
- Nome
- Descrição
- Assunto Pai (hierarquia)
- Status (Ativo/Inativo)
- Ações (Editar/Excluir)

### 2. Criar Novo Assunto (`(routes)/novo/page.tsx`)
- Formulário completo para cadastro
- Campos:
  - **Nome*** (obrigatório)
  - **Descrição** (opcional, textarea)
  - **Assunto Pai** (opcional, select) - para criar hierarquia
  - **Assunto Ativo** (switch, apenas em edição)
- Validação via toast
- Breadcrumbs: Menu > CCR > Assuntos > Novo

### 3. Editar Assunto (`(routes)/[id]/page.tsx`)
- Carregamento dos dados existentes
- Formulário pré-preenchido
- Impede que um assunto seja pai de si mesmo
- Exibe assunto pai no subtítulo (se houver)
- Loading skeleton durante carregamento
- Tratamento de assunto não encontrado
- Breadcrumbs: Menu > CCR > Assuntos > Editar

### 4. Excluir Assunto (`delete-modal.tsx`)
- Modal de confirmação
- Animações de entrada/saída suaves
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

### GET `/api/ccr/subjects`
- Lista todos os assuntos
- Query params:
  - `isActive`: filtra por status (true/false)
- Retorna array ordenado alfabeticamente
- Inclui relação `parent` (assunto pai)

### GET `/api/ccr/subjects/[id]`
- Retorna um assunto específico
- Inclui relação `parent`

### POST `/api/ccr/subjects`
- Cria novo assunto
- Body: `{ name, description?, parentId?, isActive }`
- Validação: nome obrigatório

### PUT `/api/ccr/subjects/[id]`
- Atualiza assunto existente
- Body: `{ name, description?, parentId?, isActive }`

### DELETE `/api/ccr/subjects/[id]`
- Exclusão permanente (hard delete)
- Apenas ADMIN pode executar
- Verifica se há sub-assuntos dependentes

## Componentes Principais

### `SubjectTable`
**Props:**
- `data: Subject[]` - Array de assuntos
- `loading: boolean` - Estado de carregamento
- `onRefresh: () => void` - Callback para recarregar dados
- `onNewSubject: () => void` - Callback para criar novo
- `userRole?: string` - Role do usuário para controle de permissões

**Funcionalidades:**
- Busca em tempo real (nome e descrição)
- Filtro de status (todos/ativos/inativos)
- Paginação com controle de itens por página
- Botão "Novo Assunto" (apenas ADMIN e EMPLOYEE)
- Botão de excluir (apenas ADMIN)
- Empty state quando não há dados

### `SubjectForm`
**Props:**
- `initialData?: { id?, name, description?, parentId?, isActive }` - Dados para edição

**Funcionalidades:**
- React Hook Form para gerenciamento de estado
- Validação de nome obrigatório via toast
- Carrega lista de assuntos para select de "Assunto Pai"
- Filtra o próprio assunto da lista (evita ciclo)
- Switch de "Ativo" apenas em modo edição
- Loading state no botão de submit
- Redirecionamento após sucesso

### `DeleteModal`
**Props:**
- `isOpen: boolean`
- `subjectName: string`
- `onClose: () => void`
- `onConfirm: () => void`

**Funcionalidades:**
- Animações de entrada/saída (200ms)
- Backdrop com blur
- Bloqueio de interação durante submit
- Aviso visual (ícone amarelo de alerta)

## Fluxo de Dados

### Criação de Assunto
```
1. Usuário clica "Novo Assunto"
2. Navega para /ccr/assuntos/novo
3. SubjectForm carrega lista de assuntos (para select de pai)
4. Usuário preenche formulário
5. Validação: nome obrigatório
6. POST /api/ccr/subjects
7. Toast de sucesso
8. Redirect para /ccr/assuntos
```

### Edição de Assunto
```
1. Usuário clica em "Editar" na tabela
2. Navega para /ccr/assuntos/[id]
3. GET /api/ccr/subjects/[id] (carrega dados)
4. SubjectForm pré-preenche campos
5. SubjectForm carrega lista de assuntos (filtra o próprio)
6. Usuário edita campos
7. PUT /api/ccr/subjects/[id]
8. Toast de sucesso
9. Redirect para /ccr/assuntos
```

### Exclusão de Assunto
```
1. Usuário clica em "Excluir" (apenas ADMIN)
2. DeleteModal abre com confirmação
3. Usuário confirma
4. DELETE /api/ccr/subjects/[id]
5. Toast de sucesso ou erro
6. Tabela recarrega automaticamente
7. Modal fecha
```

## Modelo de Dados (Prisma)

```prisma
model Subject {
  id          String    @id @default(cuid())
  name        String
  description String?
  parentId    String?
  parent      Subject?  @relation("SubjectHierarchy", fields: [parentId], references: [id])
  children    Subject[] @relation("SubjectHierarchy")
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@schema("jurfis")
}
```

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

### Validação
- Toast-based validation (Sonner)
- Validação no frontend e backend
- Mensagens de erro amigáveis

### UX
- Loading skeletons durante carregamento
- Empty states informativos
- Breadcrumbs para navegação
- Animações suaves em modais e busca
- Feedback visual em todas as ações

## Boas Práticas

1. **Sempre validar permissões** no frontend e backend
2. **Usar skeletons** para melhor percepção de performance
3. **Fornecer feedback** via toast em todas as ações
4. **Ordenar resultados** alfabeticamente para consistência
5. **Filtrar dados** no cliente para melhor performance
6. **Redirecionar** após criar/editar para lista principal
7. **Confirmar exclusões** para evitar perdas acidentais
