import { Types } from "mongoose";
import { BranchModel } from "../branches/branch.model.js";
import { CompanyModel } from "./company.model.js";

export const createCompany = (input: { name: string; taxId?: string | undefined; createdBy: string }) =>
  CompanyModel.create(input);

export const findCompaniesForUser = (companyIds: string[]) =>
  CompanyModel.find({ _id: { $in: companyIds }, isActive: true }).sort({ name: 1 });

export const createBranch = (input: { companyId: string; name: string; code: string; address?: string | undefined; createdBy: string }) =>
  BranchModel.create(input);

export const findBranchesForCompany = (companyId: string, branchIds?: string[]) =>
  BranchModel.find({ companyId: new Types.ObjectId(companyId), isActive: true, ...(branchIds ? { _id: { $in: branchIds } } : {}) }).sort({ name: 1 });
