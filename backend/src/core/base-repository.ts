import { eq, isNull, and } from 'drizzle-orm';
import { PgTableWithColumns, PgColumn } from 'drizzle-orm/pg-core';
import { DrizzleClient, DrizzleTransaction } from './database.js';

export class BaseRepository<
  TTable extends PgTableWithColumns<any>,
  TEntity extends { id: any } = any,
  TInsert extends object = any
> {
  protected db: DrizzleClient | DrizzleTransaction;
  protected table: TTable;
  protected idColumn: PgColumn;
  protected softDeleteColumn?: PgColumn;
  protected tenantColumn?: PgColumn;

  constructor(
    db: DrizzleClient | DrizzleTransaction, 
    table: TTable, 
    softDeleteColName?: keyof TEntity,
    tenantColName?: keyof TEntity
  ) {
    this.db = db;
    this.table = table;
    this.idColumn = (table as any).id;
    if (softDeleteColName) {
      this.softDeleteColumn = (table as any)[softDeleteColName];
    }
    if (tenantColName) {
      this.tenantColumn = (table as any)[tenantColName];
    }
  }

  protected buildWhere(id: string, tenantId?: string) {
    const conditions = [eq(this.idColumn, id)];
    if (this.tenantColumn && tenantId) {
      conditions.push(eq(this.tenantColumn, tenantId));
    }
    return and(...conditions);
  }

  async getById(id: string, tenantId?: string): Promise<TEntity | null> {
    const result = await this.db
      .select()
      .from(this.table as any)
      .where(this.buildWhere(id, tenantId))
      .limit(1);
      
    const entity = result[0] as TEntity | undefined;

    if (entity && this.softDeleteColumn && (entity as any)[this.softDeleteColumn.name] !== null) {
      return null;
    }

    return entity || null;
  }

  async listAll(skip: number = 0, limit: number = 20): Promise<TEntity[]> {
    let query = this.db.select().from(this.table as any).offset(skip).limit(limit);
    
    if (this.softDeleteColumn) {
      query = query.where(isNull(this.softDeleteColumn)) as any;
    }
    
    return await query as TEntity[];
  }

  async create(data: Omit<TInsert, 'id'> | TInsert): Promise<TEntity> {
    const result = await this.db.insert(this.table).values(data as any).returning();
    return result[0] as TEntity;
  }

  async update(id: string, data: Partial<Omit<TInsert, 'id'>>, tenantId?: string): Promise<TEntity | null> {
    const result = await this.db
      .update(this.table)
      .set(data as any)
      .where(this.buildWhere(id, tenantId))
      .returning();
      
    return (result[0] as TEntity) || null;
  }

  async softDelete(id: string, tenantId?: string): Promise<void> {
    if (!this.softDeleteColumn) {
      throw new Error(`Soft delete not configured for table ${this.table._.name}`);
    }
    await this.db
      .update(this.table)
      .set({ [this.softDeleteColumn.name]: new Date() } as any)
      .where(this.buildWhere(id, tenantId));
  }

  async hardDelete(id: string, tenantId?: string): Promise<void> {
    await this.db.delete(this.table).where(this.buildWhere(id, tenantId));
  }
}
