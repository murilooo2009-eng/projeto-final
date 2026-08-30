/**
 * In-memory substitute for PrismaService, used only in tests.
 *
 * Why: e2e tests here exercise the *real* HTTP pipeline (guards, pipes,
 * controllers, services) end-to-end, but replace the database layer with
 * a plain in-memory store instead of a real PostgreSQL instance. This keeps
 * the suite fast, deterministic, and runnable with zero external setup,
 * while still proving every functional and security rule that lives in the
 * application code (multi-tenancy filters, role checks, state machines,
 * validation). It intentionally implements only the subset of Prisma's
 * query surface that this codebase actually uses - it is not a general
 * Prisma mock.
 *
 * If you also want database-level integration coverage (real constraints,
 * cascades, transactions), point PrismaService at a real test database
 * instead of overriding it with this fake.
 */

type Where = Record<string, any>;

function getPath(obj: any, path: string) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

function matchesValue(actual: any, expected: any): boolean {
  if (expected && typeof expected === 'object' && !(expected instanceof Date)) {
    if ('in' in expected) {
      return (expected.in as any[]).includes(actual);
    }
    if ('gte' in expected || 'lte' in expected || 'gt' in expected || 'lt' in expected) {
      const a = actual instanceof Date ? actual.getTime() : actual;
      if ('gte' in expected && !(a >= (expected.gte instanceof Date ? expected.gte.getTime() : expected.gte))) return false;
      if ('lte' in expected && !(a <= (expected.lte instanceof Date ? expected.lte.getTime() : expected.lte))) return false;
      if ('gt' in expected && !(a > (expected.gt instanceof Date ? expected.gt.getTime() : expected.gt))) return false;
      if ('lt' in expected && !(a < (expected.lt instanceof Date ? expected.lt.getTime() : expected.lt))) return false;
      return true;
    }
  }
  return actual === expected;
}

function matches(record: any, where?: Where): boolean {
  if (!where) return true;
  return Object.entries(where).every(([key, expected]) => {
    if (expected === undefined) return true;
    return matchesValue(getPath(record, key), expected);
  });
}

/**
 * Mimics Prisma's `select` projection. Only handles flat top-level field
 * selection (`{ id: true, nome: true }`), which is the only shape this
 * codebase's `select` clauses use. Returns the record unchanged when no
 * `select` is given, matching Prisma's default (return everything).
 */
function applySelect(record: any, select?: Record<string, boolean>) {
  if (!record || !select) return record;
  const projected: any = {};
  for (const [key, wanted] of Object.entries(select)) {
    if (wanted) projected[key] = record[key];
  }
  return projected;
}

function applyOrderBy(list: any[], orderBy?: any) {
  if (!orderBy) return list;
  const clauses = Array.isArray(orderBy) ? orderBy : [orderBy];
  const sorted = [...list];
  sorted.sort((a, b) => {
    for (const clause of clauses) {
      for (const [key, dir] of Object.entries(clause)) {
        if (typeof dir === 'object' && dir !== null) {
          // nested orderBy (e.g. { _count: { id: 'desc' } } or { itemChecklist: { ordem: 'asc' } })
          const [nestedKey, nestedDir] = Object.entries(dir as any)[0];
          const av = getPath(a, `${key}.${nestedKey}`);
          const bv = getPath(b, `${key}.${nestedKey}`);
          if (av !== bv) return nestedDir === 'asc' ? av - bv : bv - av;
          continue;
        }
        const av = getPath(a, key);
        const bv = getPath(b, key);
        if (av === bv) continue;
        const av2 = av instanceof Date ? av.getTime() : av;
        const bv2 = bv instanceof Date ? bv.getTime() : bv;
        if (av2 < bv2) return dir === 'asc' ? -1 : 1;
        if (av2 > bv2) return dir === 'asc' ? 1 : -1;
      }
    }
    return 0;
  });
  return sorted;
}

class UniqueConstraintError extends Error {
  code = 'P2002';
  constructor(field: string) {
    super(`Unique constraint failed on the field: ${field}`);
  }
}

export class FakePrismaService {
  empresas: any[] = [];
  usuarios: any[] = [];
  checklists: any[] = [];
  itensChecklist: any[] = [];
  execucoes: any[] = [];
  execucaoItens: any[] = [];

  private ids: Record<string, number> = {};

  private nextId(table: string) {
    this.ids[table] = (this.ids[table] ?? 0) + 1;
    return this.ids[table];
  }

  reset() {
    this.empresas = [];
    this.usuarios = [];
    this.checklists = [];
    this.itensChecklist = [];
    this.execucoes = [];
    this.execucaoItens = [];
    this.ids = {};
  }

  // ---- relation hydration -------------------------------------------------

  private hydrateItemChecklist(item: any) {
    return { ...item };
  }

  private hydrateChecklist(checklist: any, opts: { itensOrderBy?: any } = {}) {
    const itens = applyOrderBy(
      this.itensChecklist.filter((i) => i.checklistId === checklist.id),
      opts.itensOrderBy ?? { ordem: 'asc' },
    ).map((i) => this.hydrateItemChecklist(i));
    return { ...checklist, itens };
  }

  private hydrateUsuarioPublico(usuario: any) {
    if (!usuario) return usuario;
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      ativo: usuario.ativo,
      empresaId: usuario.empresaId,
      createdAt: usuario.createdAt,
      updatedAt: usuario.updatedAt,
    };
  }

  private hydrateExecucaoItem(execItem: any) {
    const itemChecklist = this.itensChecklist.find((i) => i.id === execItem.itemChecklistId);
    return { ...execItem, itemChecklist };
  }

  private hydrateExecucao(execucao: any) {
    const checklist = this.checklists.find((c) => c.id === execucao.checklistId);
    const usuario = this.usuarios.find((u) => u.id === execucao.usuarioId);
    const itens = this.execucaoItens
      .filter((i) => i.execucaoId === execucao.id)
      .map((i) => this.hydrateExecucaoItem(i));
    return {
      ...execucao,
      checklist: checklist ? this.hydrateChecklist(checklist) : undefined,
      usuario: this.hydrateUsuarioPublico(usuario),
      itens,
    };
  }

  // ---- empresa -------------------------------------------------------------

  empresa = {
    create: async ({ data }: any) => {
      const empresa = {
        id: this.nextId('empresa'),
        nome: data.nome,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.empresas.push(empresa);
      return empresa;
    },
    findFirst: async ({ where }: any = {}) => this.empresas.find((e) => matches(e, where)) ?? null,
  };

  // ---- usuario ---------------------------------------------------------------

  usuario = {
    findFirst: async ({ where, select }: any = {}) => {
      const found = this.usuarios.find((u) => matches(u, where));
      return found ? applySelect({ ...found }, select) : null;
    },

    findUnique: async ({ where, select }: any = {}) => {
      const found = this.usuarios.find((u) => matches(u, where));
      return found ? applySelect({ ...found }, select) : null;
    },

    findMany: async ({ where, orderBy, select }: any = {}) => {
      const found = this.usuarios.filter((u) => matches(u, where));
      return applyOrderBy(found, orderBy).map((u) => applySelect({ ...u }, select));
    },

    count: async ({ where }: any = {}) => this.usuarios.filter((u) => matches(u, where)).length,

    create: async ({ data }: any) => {
      if (this.usuarios.some((u) => u.email === data.email)) {
        throw new UniqueConstraintError('email');
      }
      const usuario = {
        id: this.nextId('usuario'),
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      this.usuarios.push(usuario);
      return { ...usuario };
    },

    update: async ({ where, data, select }: any) => {
      const usuario = this.usuarios.find((u) => matches(u, where));
      if (!usuario) throw new Error('Record to update not found (fake prisma).');
      if (data.email && this.usuarios.some((u) => u.id !== usuario.id && u.email === data.email)) {
        throw new UniqueConstraintError('email');
      }
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) usuario[key] = value;
      });
      usuario.updatedAt = new Date();
      return applySelect({ ...usuario }, select);
    },
  };

  // ---- checklist ---------------------------------------------------------

  checklist = {
    create: async ({ data }: any) => {
      const checklist = {
        id: this.nextId('checklist'),
        ativo: true,
        horarioDisponivelInicio: null,
        horarioDisponivelFim: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      this.checklists.push(checklist);
      return this.hydrateChecklist(checklist);
    },

    findFirst: async ({ where }: any = {}) => {
      const found = this.checklists.find((c) => matches(c, where));
      return found ? this.hydrateChecklist(found) : null;
    },

    findMany: async ({ where, orderBy }: any = {}) => {
      const found = applyOrderBy(this.checklists.filter((c) => matches(c, where)), orderBy);
      return found.map((c) => this.hydrateChecklist(c));
    },

    count: async ({ where }: any = {}) => this.checklists.filter((c) => matches(c, where)).length,

    update: async ({ where, data }: any) => {
      const checklist = this.checklists.find((c) => matches(c, where));
      if (!checklist) throw new Error('Record to update not found (fake prisma).');
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) checklist[key] = value;
      });
      checklist.updatedAt = new Date();
      return this.hydrateChecklist(checklist);
    },

    delete: async ({ where }: any) => {
      const idx = this.checklists.findIndex((c) => matches(c, where));
      if (idx === -1) throw new Error('Record to delete not found (fake prisma).');
      const [removed] = this.checklists.splice(idx, 1);
      return removed;
    },
  };

  // ---- itemChecklist -------------------------------------------------------

  itemChecklist = {
    create: async ({ data }: any) => {
      const item = {
        id: this.nextId('itemChecklist'),
        obrigatorio: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      this.itensChecklist.push(item);
      return { ...item };
    },

    createMany: async ({ data }: any) => {
      const created = data.map((d: any) => ({
        id: this.nextId('itemChecklist'),
        obrigatorio: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...d,
      }));
      this.itensChecklist.push(...created);
      return { count: created.length };
    },

    findFirst: async ({ where, orderBy }: any = {}) => {
      const found = applyOrderBy(this.itensChecklist.filter((i) => matches(i, where)), orderBy);
      return found[0] ? { ...found[0] } : null;
    },

    findMany: async ({ where, orderBy }: any = {}) => {
      const found = applyOrderBy(this.itensChecklist.filter((i) => matches(i, where)), orderBy);
      return found.map((i) => ({ ...i }));
    },

    update: async ({ where, data }: any) => {
      const item = this.itensChecklist.find((i) => matches(i, where));
      if (!item) throw new Error('Record to update not found (fake prisma).');
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) item[key] = value;
      });
      item.updatedAt = new Date();
      return { ...item };
    },

    delete: async ({ where }: any) => {
      const idx = this.itensChecklist.findIndex((i) => matches(i, where));
      if (idx === -1) throw new Error('Record to delete not found (fake prisma).');
      const [removed] = this.itensChecklist.splice(idx, 1);
      return removed;
    },
  };

  // ---- execucaoChecklist ---------------------------------------------------

  execucaoChecklist = {
    create: async ({ data }: any) => {
      const execucao = {
        id: this.nextId('execucao'),
        finalizadaEm: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      };
      this.execucoes.push(execucao);
      return { ...execucao };
    },

    findFirst: async ({ where }: any = {}) => {
      const found = this.execucoes.find((e) => matches(e, where));
      return found ? this.hydrateExecucao(found) : null;
    },

    findMany: async ({ where, orderBy, skip, take }: any = {}) => {
      let found = applyOrderBy(this.execucoes.filter((e) => matches(e, where)), orderBy);
      if (typeof skip === 'number') found = found.slice(skip);
      if (typeof take === 'number') found = found.slice(0, take);
      return found.map((e) => this.hydrateExecucao(e));
    },

    count: async ({ where }: any = {}) => this.execucoes.filter((e) => matches(e, where)).length,

    update: async ({ where, data }: any) => {
      const execucao = this.execucoes.find((e) => matches(e, where));
      if (!execucao) throw new Error('Record to update not found (fake prisma).');
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) execucao[key] = value;
      });
      execucao.updatedAt = new Date();
      return this.hydrateExecucao(execucao);
    },

    groupBy: async ({ by, where, _count, orderBy, take }: any) => {
      const filtered = this.execucoes.filter((e) => matches(e, where));
      const groups = new Map<string, any>();
      for (const record of filtered) {
        const key = by.map((field: string) => record[field]).join('::');
        if (!groups.has(key)) {
          const base: any = {};
          by.forEach((field: string) => (base[field] = record[field]));
          base._count = { id: 0 };
          groups.set(key, base);
        }
        groups.get(key)._count.id += 1;
      }
      let result = Array.from(groups.values());
      result = applyOrderBy(result, orderBy);
      if (typeof take === 'number') result = result.slice(0, take);
      return result;
    },
  };

  // ---- execucaoItem --------------------------------------------------------

  execucaoItem = {
    create: async ({ data }: any) => {
      const item = { id: this.nextId('execucaoItem'), concluidoEm: null, ...data };
      this.execucaoItens.push(item);
      return { ...item };
    },

    createMany: async ({ data }: any) => {
      const created = data.map((d: any) => ({ id: this.nextId('execucaoItem'), concluidoEm: null, ...d }));
      this.execucaoItens.push(...created);
      return { count: created.length };
    },

    findFirst: async ({ where }: any = {}) => {
      const found = this.execucaoItens.find((i) => matches(i, where));
      return found ? this.hydrateExecucaoItem(found) : null;
    },

    findMany: async ({ where }: any = {}) => this.execucaoItens.filter((i) => matches(i, where)).map((i) => this.hydrateExecucaoItem(i)),

    update: async ({ where, data }: any) => {
      const item = this.execucaoItens.find((i) => matches(i, where));
      if (!item) throw new Error('Record to update not found (fake prisma).');
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) item[key] = value;
      });
      return this.hydrateExecucaoItem(item);
    },
  };

  // ---- transaction -----------------------------------------------------

  async $transaction(arg: any) {
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    return arg(this);
  }

  async $connect() {}
  async $disconnect() {}
}
