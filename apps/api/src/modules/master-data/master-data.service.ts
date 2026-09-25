import { Types, type Model } from "mongoose";
import { HttpError } from "../../middleware/errors.js";
import { getDatabaseStatus } from "../../database/mongoose.js";
import { deactivateCatalogDocument, updateCatalogDocument, validateCatalogId } from "../../shared/catalog-mutations.js";
import { findCatalogPage, type CatalogPage, type CatalogQuery } from "../../shared/catalog-query.js";
import { ProductModel } from "../products/product.model.js";
import { PaymentModel } from "../finance/finance.model.js";
import { BrandModel, PaymentMethodModel, TaxModel, UnitModel } from "./master-data.model.js";
import { brandSchema, brandUpdateSchema, paymentMethodSchema, paymentMethodUpdateSchema, taxSchema, taxUpdateSchema, unitSchema, unitUpdateSchema } from "./master-data.validation.js";

type MasterSpec = {
  permission: string;
  create: (userId: string, companyId: string, input: unknown) => Promise<unknown>;
  list: (companyId: string, query: CatalogQuery) => Promise<CatalogPage<unknown>>;
  get: (companyId: string, id: string) => Promise<unknown>;
  update: (companyId: string, id: string, input: unknown) => Promise<unknown>;
  deactivate: (companyId: string, id: string) => Promise<unknown>;
};

type InputSchema = { parse: (input: unknown) => unknown };

const databaseRequired = () => {
  if (getDatabaseStatus() !== "connected") throw new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no está disponible");
};

const defineMasterCatalog = <T>(input: {
  permission: string;
  model: Model<T>;
  createSchema: InputSchema;
  updateSchema: InputSchema;
  searchableFields: string[];
  sortableFields: string[];
  inUse?: (companyId: string, id: string) => Promise<unknown>;
  label: string;
}): MasterSpec => ({
  permission: input.permission,
  create: async (userId, companyId, rawInput) => {
    databaseRequired();
    const fields = input.createSchema.parse(rawInput) as Record<string, unknown>;
    return input.model.create({ ...fields, companyId, createdBy: userId } as never);
  },
  list: async (companyId, query) => {
    databaseRequired();
    return findCatalogPage({
    model: input.model,
    companyId,
    query,
    searchableFields: input.searchableFields,
    sortableFields: input.sortableFields
    }) as Promise<CatalogPage<unknown>>;
  },
  get: async (companyId, id) => {
    databaseRequired();
    validateCatalogId(id);
    const record = await input.model.findOne({ _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId), isActive: true }).exec();
    if (!record) throw new HttpError(404, "MASTER_CATALOG_NOT_FOUND", `${input.label} no encontrado`);
    return record;
  },
  update: async (companyId, id, rawInput) => {
    databaseRequired();
    validateCatalogId(id);
    const fields = input.updateSchema.parse(rawInput) as Record<string, unknown>;
    const record = await updateCatalogDocument(input.model, companyId, id, fields);
    if (!record) throw new HttpError(404, "MASTER_CATALOG_NOT_FOUND", `${input.label} no encontrado`);
    return record;
  },
  deactivate: async (companyId, id) => {
    databaseRequired();
    validateCatalogId(id);
    if (input.inUse && await input.inUse(companyId, id)) throw new HttpError(409, "MASTER_CATALOG_IN_USE", `No se puede dar de baja ${input.label.toLowerCase()} porque tiene productos o pagos relacionados`);
    const record = await deactivateCatalogDocument(input.model, companyId, id);
    if (!record) throw new HttpError(404, "MASTER_CATALOG_NOT_FOUND", `${input.label} no encontrado`);
    return record;
  }
});

export const masterCatalogs: Record<string, MasterSpec> = {
  brands: defineMasterCatalog({
    permission: "brands", model: BrandModel, createSchema: brandSchema, updateSchema: brandUpdateSchema,
    searchableFields: ["name", "code", "description"], sortableFields: ["name", "code", "createdAt", "updatedAt"],
    inUse: (companyId, id) => ProductModel.exists({ companyId, brandId: id, isActive: true }), label: "Marca"
  }),
  units: defineMasterCatalog({
    permission: "units", model: UnitModel, createSchema: unitSchema, updateSchema: unitUpdateSchema,
    searchableFields: ["name", "symbol"], sortableFields: ["name", "symbol", "createdAt", "updatedAt"],
    inUse: (companyId, id) => ProductModel.exists({ companyId, unitId: id, isActive: true }), label: "Unidad"
  }),
  taxes: defineMasterCatalog({
    permission: "taxes", model: TaxModel, createSchema: taxSchema, updateSchema: taxUpdateSchema,
    searchableFields: ["name", "code"], sortableFields: ["name", "code", "rate", "createdAt", "updatedAt"],
    inUse: (companyId, id) => ProductModel.exists({ companyId, taxId: id, isActive: true }), label: "Impuesto"
  }),
  paymentMethods: defineMasterCatalog({
    permission: "paymentMethods", model: PaymentMethodModel, createSchema: paymentMethodSchema, updateSchema: paymentMethodUpdateSchema,
    searchableFields: ["name", "code", "kind"], sortableFields: ["name", "code", "kind", "createdAt", "updatedAt"],
    inUse: (companyId, id) => PaymentModel.exists({ companyId, paymentMethodId: id }), label: "Método de pago"
  })
};

export const findMasterCatalogSpec = (key: string) => masterCatalogs[key];

