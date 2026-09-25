import { z } from "zod";
import type { Model } from "mongoose";

export const catalogQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.string().trim().max(40).optional(),
  order: z.enum(["asc", "desc"]).default("asc"),
  status: z.enum(["active", "inactive", "all"]).default("active")
});

export type CatalogQuery = z.infer<typeof catalogQuerySchema>;
export type CatalogPage<T> = {
  items: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};

export const escapeCatalogSearch = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const resolveCatalogSort = (requested: string | undefined, sortableFields: string[]) => {
  const field = requested ?? "name";
  return sortableFields.includes(field) ? field : "name";
};

export const findCatalogPage = async <T>(input: {
  model: Model<T>;
  companyId: string;
  query: CatalogQuery;
  searchableFields: string[];
  sortableFields: string[];
  branchFilter?: Record<string, unknown>;
}): Promise<CatalogPage<T>> => {
  const { model, companyId, query, searchableFields, sortableFields, branchFilter = {} } = input;
  const conditions: Record<string, unknown>[] = [{ companyId }];
  if (query.status !== "all") conditions.push({ isActive: query.status === "active" });
  if (Object.keys(branchFilter).length) conditions.push(branchFilter);
  if (query.q) {
    const escaped = escapeCatalogSearch(query.q);
    conditions.push({ $or: searchableFields.map((field) => ({ [field]: { $regex: escaped, $options: "i" } })) });
  }
  const filter = { $and: conditions };
  const requestedSort = query.sortBy ?? "name";
  const sortBy = sortableFields.includes(requestedSort) ? requestedSort : "name";
  const skip = (query.page - 1) * query.pageSize;
  const [items, total] = await Promise.all([
    model.find(filter).sort({ [sortBy]: query.order === "asc" ? 1 : -1 }).skip(skip).limit(query.pageSize).exec(),
    model.countDocuments(filter).exec()
  ]);
  return { items: items as T[], meta: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) } };
};



