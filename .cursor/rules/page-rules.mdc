---
alwaysApply: true
---

# Estrutura de Páginas - Padrão do Projeto

Este documento define a estrutura padrão para organização de páginas no projeto, seguindo as melhores práticas do Next.js App Router.

## 📁 Estrutura Base

```
/nome-da-pagina/
├── page.tsx                    # Server Component (ponto de entrada)
├── _components/                # Componentes específicos da página
│   └── content.tsx            # Client Component principal
├── _actions/                   # Server Actions
│   └── action-name.ts
└── _data-access/              # Data Access Layer
    └── get-data.ts
```

## 📋 Descrição das Camadas

### 1. `page.tsx` - Server Component

- **Sempre** deve ser um Server Component
- Responsável por:
  - Buscar dados iniciais usando funções do `_data-access`
  - Validar autenticação/autorização
  - Passar dados para os componentes client
  - Manter a lógica de servidor

**Exemplo:**

```typescript
// page.tsx
import { ContentComponent } from "./_components/content";
import { getData } from "./_data-access/get-data";

export default async function Page() {
  const data = await getData();

  return <ContentComponent data={data} />;
}
```

### 2. `_components/` - Componentes da Página

- Contém componentes específicos desta página
- O prefixo `_` indica que é uma pasta privada (não gera rotas)
- Componentes podem ser Client ou Server Components conforme necessidade

#### `content.tsx` - Componente Principal

- Geralmente é um **Client Component** (`"use client"`)
- Usado quando precisa de:
  - Interatividade (onClick, onChange, etc)
  - Hooks do React (useState, useEffect, etc)
  - Formulários com validação
  - Animações e transições

**Exemplo:**

```typescript
// _components/content.tsx
"use client";

import { useState } from "react";
import { updateAction } from "../_actions/update-action";

export function ContentComponent({ data }) {
  const [state, setState] = useState();

  // Lógica do componente...

  return (
    <div>
      {/* UI do componente */}
    </div>
  );
}
```

### 3. `_actions/` - Server Actions

- Contém as Server Actions específicas da página
- Sempre marcadas com `"use server"`
- Responsável por:
  - Validações com Zod
  - Operações no banco de dados
  - Autenticação/Autorização
  - Retornar resultados tipados

**Exemplo:**

```typescript
// _actions/update-action.ts
"use server";

import { db } from "@/db";
import { requireAuth } from "@/lib/session";
import { z } from "zod";

const schema = z.object({
  field: z.string().min(3),
});

export type UpdateInput = z.infer<typeof schema>;
export type UpdateResult = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function updateAction(input: UpdateInput): Promise<UpdateResult> {
  try {
    const session = await requireAuth();

    const validation = schema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        errors: validation.error.flatten().fieldErrors,
      };
    }

    // Operação no banco...

    return {
      success: true,
      message: "Atualizado com sucesso!",
    };
  } catch (error) {
    return {
      success: false,
      message: "Erro ao processar",
    };
  }
}
```

### 4. `_data-access/` - Data Access Layer

- Contém funções para buscar dados
- Sempre executadas no servidor
- Encapsula lógica de acesso ao banco
- Reutilizável em diferentes páginas

**Exemplo:**

```typescript
// _data-access/get-data.ts
import { db } from "@/db";
import { requireAuth } from "@/lib/session";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";

export async function getUserData() {
  const session = await requireAuth();

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user) {
    throw new Error("Usuário não encontrado");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    // ... outros campos
  };
}
```

## 🔄 Fluxo de Dados

```
1. Usuário acessa a página
   ↓
2. page.tsx (Server Component)
   - Busca dados via _data-access
   - Valida autenticação
   ↓
3. content.tsx (Client Component)
   - Recebe dados via props
   - Renderiza UI interativa
   - Usuário interage (preenche form, clica botão)
   ↓
4. _actions (Server Action)
   - Valida dados
   - Atualiza banco
   - Retorna resultado
   ↓
5. content.tsx
   - Recebe resultado
   - Atualiza UI (toast, form errors, etc)
```

## ✅ Boas Práticas

### Server Components (page.tsx)

- ✅ Buscar dados diretamente
- ✅ Acessar recursos do servidor
- ✅ Manter informações sensíveis no servidor
- ❌ Não usar hooks do React
- ❌ Não usar event handlers

### Client Components (\_components/content.tsx)

- ✅ Usar interatividade
- ✅ Usar hooks do React
- ✅ Manter estado local
- ❌ Não buscar dados diretamente
- ❌ Não acessar banco de dados

### Server Actions (\_actions/)

- ✅ Validar todos os inputs
- ✅ Verificar autenticação
- ✅ Retornar tipos consistentes
- ✅ Tratar erros adequadamente
- ❌ Não retornar dados sensíveis

### Data Access (\_data-access/)

- ✅ Encapsular queries complexas
- ✅ Reutilizar lógica comum
- ✅ Verificar permissões
- ✅ Retornar dados tipados
- ❌ Não expor dados sensíveis

## 📝 Exemplo Completo: `/account`

```
/account/
├── page.tsx
│   └── Server Component
│       └── Chama getUserData()
│       └── Renderiza <AccountContent />
│
├── _components/
│   └── content.tsx
│       └── Client Component
│       └── Formulários interativos
│       └── Chama updateAccount()
│
├── _actions/
│   └── update-account.ts
│       └── Server Action
│       └── Valida com Zod
│       └── Atualiza banco de dados
│
└── _data-access/
    └── get-user-data.ts
        └── Busca dados do usuário
        └── Verifica autenticação
```

## 🎯 Quando Criar Cada Pasta?

### `_components/`

- **Sempre** que a página precisar de UI
- Componentes específicos da página
- Pode ter múltiplos componentes

### `_actions/`

- Quando precisa **modificar dados** (criar, atualizar, deletar)
- Operações que precisam de validação
- Lógica de negócio complexa

### `_data-access/`

- Quando precisa **buscar dados** do banco
- Queries complexas ou reutilizáveis
- Lógica de acesso a dados compartilhada

## 📌 Notas Importantes

1. **Prefixo `_`**: Pastas com `_` não geram rotas no Next.js
2. **Separação de Responsabilidades**: Cada camada tem uma função específica
3. **Tipagem**: Sempre tipar inputs e outputs das funções
4. **Validação**: Usar Zod para validar dados no servidor
5. **Segurança**: Sempre verificar autenticação nas actions e data-access

# Atenção

- Sempre atenção a comunicação entre Server Componente e Client component.
- Atenção a problemas com Hydration.

---

**Referência de Implementação:** `/src/app/(painel)/dashboard/account/`
