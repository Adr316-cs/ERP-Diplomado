import { Types, type Model } from "mongoose";
import { HttpError } from "../middleware/errors.js";

export const validateCatalogId = (id: string) => {
  if (!Types.ObjectId.isValid(id)) throw new HttpError(400, "INVALID_RESOURCE_ID", "Identificador de recurso inválido");
};

const scopedFilter = (companyId: string, id: string, scopeFilter: Record<string, unknown>) => ({
  $and: [
    { _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId), isActive: true },
    ...(Object.keys(scopeFilter).length ? [scopeFilter] : [])
  ]
});

export const updateCatalogDocument = <T>(model: Model<T>, companyId: string, id: string, fields: Record<string, unknown>, scopeFilter: Record<string, unknown> = {}) =>
  model.findOneAndUpdate(
    scopedFilter(companyId, id, scopeFilter),
    { $set: fields },
    { new: true, runValidators: true }
  );

export const deactivateCatalogDocument = <T>(model: Model<T>, companyId: string, id: string, scopeFilter: Record<string, unknown> = {}) =>
  model.findOneAndUpdate(
    scopedFilter(companyId, id, scopeFilter),
    { $set: { isActive: false } },
    { new: true, runValidators: true }
  );

export const findCatalogDocument = <T>(model: Model<T>, companyId: string, id: string, scopeFilter: Record<string, unknown> = {}) =>
  model.findOne(scopedFilter(companyId, id, scopeFilter));
