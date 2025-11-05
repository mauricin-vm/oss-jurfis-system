# Instruções para Ativar o Sistema de Roles

## 1. Execute a Migration no Banco de Dados

Abra o **DBeaver** e execute o seguinte SQL:

```sql
-- Criar o enum de roles
CREATE TYPE "jurfis"."UserRole" AS ENUM ('ADMIN', 'SERVIDOR');

-- Adicionar a coluna role na tabela de usuários
ALTER TABLE "jurfis"."Chat_User" ADD COLUMN "role" "jurfis"."UserRole" NOT NULL DEFAULT 'SERVIDOR';
```

## 2. Defina seu Usuário como ADMIN

Ainda no DBeaver, execute (substitua o email pelo seu):

```sql
UPDATE "jurfis"."Chat_User"
SET role = 'ADMIN'
WHERE email = 'seu_email@exemplo.com';
```

Para verificar se funcionou:

```sql
SELECT id, name, email, role
FROM "jurfis"."Chat_User";
```

## 3. Gere o Prisma Client

Feche o servidor de desenvolvimento (Ctrl+C no terminal) e execute:

```bash
npx prisma generate
```

## 4. Faça Logout e Login Novamente

1. Acesse o sistema
2. Faça logout
3. Faça login novamente
4. Agora a role estará carregada na sessão e você verá "Modo Administrador"

## 5. Verificação

Se ainda aparecer "Servidor" mesmo sendo admin, verifique no console do navegador:

```javascript
// Abra o DevTools (F12) e execute no Console:
console.log('Session:', sessionStorage);
```

E no backend, adicione um log temporário em `page.tsx`:

```typescript
console.log('Session:', session);
console.log('Is Admin:', isAdmin);
console.log('Role:', session?.user?.role);
```

## Diferenças entre Roles

### ADMIN pode:
- Ver registros de todos os servidores
- Editar/excluir registros de qualquer servidor
- Acessar o endpoint `/api/overtime/admin`
- Ver documentos de qualquer servidor

### SERVIDOR pode:
- Ver apenas seus próprios registros
- Editar/excluir apenas seus próprios registros
- Ver apenas seus próprios documentos

## Comandos Úteis

**Listar todos os usuários e suas roles:**
```sql
SELECT name, email, role FROM "jurfis"."Chat_User";
```

**Promover usuário a admin:**
```sql
UPDATE "jurfis"."Chat_User" SET role = 'ADMIN' WHERE email = 'email@exemplo.com';
```

**Rebaixar usuário a servidor:**
```sql
UPDATE "jurfis"."Chat_User" SET role = 'SERVIDOR' WHERE email = 'email@exemplo.com';
```
