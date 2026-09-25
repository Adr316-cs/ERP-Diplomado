import assert from "node:assert/strict";
import { test } from "node:test";
import { Types } from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { connectDatabase, disconnectDatabase } from "../src/database/mongoose.js";
import { CompanyModel } from "../src/modules/companies/company.model.js";
import { BranchModel } from "../src/modules/branches/branch.model.js";
import { registerCustomer, listCustomers, getCustomer, updateCustomer, deactivateCustomer } from "../src/modules/customers/customer.service.js";
import { registerSupplier, listSuppliers, getSupplier, updateSupplier, deactivateSupplier } from "../src/modules/suppliers/supplier.service.js";
import { registerCategory, listCategories, getCategory, updateCategory, deactivateCategory } from "../src/modules/categories/category.service.js";
import { registerProduct, listProducts, getProduct, updateProduct, deactivateProduct } from "../src/modules/products/product.service.js";
import { registerWarehouse, listWarehouses, getWarehouse, updateWarehouse, deactivateWarehouse } from "../src/modules/warehouses/warehouse.service.js";
import { masterCatalogs } from "../src/modules/master-data/master-data.service.js";
import { catalogQuerySchema } from "../src/shared/catalog-query.js";
import { PaymentModel } from "../src/modules/finance/finance.model.js";

const hasCode = (code: string) => (error: unknown) => error instanceof Error && "code" in error && error.code === code;

test("replica set persists company-scoped catalog CRUD, references and soft-delete guards", { timeout: 180_000 }, async (t) => {
  const replicaSet = await MongoMemoryReplSet.create({ binary: { version: "7.0.14" }, replSet: { count: 1, storageEngine: "wiredTiger" } });
  t.after(async () => {
    await disconnectDatabase();
    await replicaSet.stop();
  });
  await connectDatabase(replicaSet.getUri());

  const userId = new Types.ObjectId().toString();
  const company = await CompanyModel.create({ name: "Catalog Integration Co", createdBy: userId });
  const companyId = company._id.toString();
  const branch = await BranchModel.create({ companyId, name: "Main", code: "MAIN", createdBy: userId });
  const branchId = branch._id.toString();
  const query = catalogQuerySchema.parse({ page: 1, pageSize: 10 });

  const customer = await registerCustomer(userId, companyId, { name: "Customer One", email: "customer@test.example", branchId });
  assert.equal((await listCustomers(companyId, query, {})).items.length, 1);
  assert.equal((await getCustomer(companyId, customer._id.toString(), {})).name, "Customer One");
  assert.equal((await updateCustomer(companyId, customer._id.toString(), { name: "Customer Updated" }, {})).name, "Customer Updated");
  assert.equal((await deactivateCustomer(companyId, customer._id.toString(), {})).isActive, false);

  const supplier = await registerSupplier(userId, companyId, { name: "Supplier One", email: "supplier@test.example", branchId });
  assert.equal((await listSuppliers(companyId, query, {})).items.length, 1);
  assert.equal((await getSupplier(companyId, supplier._id.toString(), {})).name, "Supplier One");
  assert.equal((await updateSupplier(companyId, supplier._id.toString(), { name: "Supplier Updated" }, {})).name, "Supplier Updated");
  assert.equal((await deactivateSupplier(companyId, supplier._id.toString(), {})).isActive, false);

  const category = await registerCategory(userId, companyId, { name: "Parts", code: "PARTS" });
  assert.equal((await listCategories(companyId, query)).items.length, 1);
  assert.equal((await getCategory(companyId, category._id.toString())).name, "Parts");
  assert.equal((await updateCategory(companyId, category._id.toString(), { name: "Components" })).name, "Components");
  const child = await registerCategory(userId, companyId, { name: "Fasteners", code: "FASTENERS", parentCategoryId: category._id.toString() });
  await assert.rejects(updateCategory(companyId, category._id.toString(), { parentCategoryId: child._id.toString() }), hasCode("CATEGORY_CYCLE"));

  const brandSpec = masterCatalogs.brands!;
  const unitSpec = masterCatalogs.units!;
  const taxSpec = masterCatalogs.taxes!;
  const paymentMethodSpec = masterCatalogs.paymentMethods!;
  const brand = await brandSpec.create(userId, companyId, { name: "Brand One", code: "BRAND1" }) as { _id: Types.ObjectId };
  const unit = await unitSpec.create(userId, companyId, { name: "Piece", symbol: "EA", decimalPlaces: 0 }) as { _id: Types.ObjectId };
  const tax = await taxSpec.create(userId, companyId, { name: "VAT", code: "VAT16", rate: 16, isInclusive: false }) as { _id: Types.ObjectId };
  const paymentMethod = await paymentMethodSpec.create(userId, companyId, { name: "Transfer", code: "TRANSFER", kind: "BANK_TRANSFER" }) as { _id: Types.ObjectId };
  for (const [spec, id, fields] of [
    [brandSpec, brand._id, { name: "Brand Updated" }],
    [unitSpec, unit._id, { decimalPlaces: 2 }],
    [taxSpec, tax._id, { rate: 8 }],
    [paymentMethodSpec, paymentMethod._id, { name: "Bank transfer" }]
  ] as const) {
    assert.ok(await spec.get(companyId, id.toString()));
    assert.ok(await spec.update(companyId, id.toString(), fields));
    assert.equal((await spec.list(companyId, query)).meta.total, 1);
  }

  const product = await registerProduct(userId, companyId, {
    categoryId: category._id.toString(), brandId: brand._id.toString(), unitId: unit._id.toString(), taxId: tax._id.toString(),
    sku: "PART-1", name: "Part One", cost: 4, unitPrice: 8, salePrice: 8, stockMinimum: 0
  });
  assert.equal((await listProducts(companyId, query, {})).items.length, 1);
  assert.equal((await getProduct(companyId, product._id.toString(), {})).name, "Part One");
  await updateProduct(companyId, product._id.toString(), { salePrice: 9 }, {});
  assert.equal((await getProduct(companyId, product._id.toString(), {})).unitPrice, 9);
  await assert.rejects(brandSpec.deactivate(companyId, brand._id.toString()), hasCode("MASTER_CATALOG_IN_USE"));
  await assert.rejects(unitSpec.deactivate(companyId, unit._id.toString()), hasCode("MASTER_CATALOG_IN_USE"));
  await assert.rejects(taxSpec.deactivate(companyId, tax._id.toString()), hasCode("MASTER_CATALOG_IN_USE"));
  await deactivateProduct(companyId, product._id.toString(), {});
  await deactivateCategory(companyId, child._id.toString());
  await deactivateCategory(companyId, category._id.toString());
  for (const [spec, id] of [[brandSpec, brand._id], [unitSpec, unit._id], [taxSpec, tax._id]] as const) {
    assert.equal((await spec.deactivate(companyId, id.toString()) as { isActive: boolean }).isActive, false);
  }

  const warehouse = await registerWarehouse(userId, companyId, { branchId, name: "Main", code: "MAIN" });
  assert.equal((await listWarehouses(companyId, query, {})).items.length, 1);
  assert.equal((await getWarehouse(companyId, warehouse._id.toString(), {})).name, "Main");
  assert.equal((await updateWarehouse(companyId, warehouse._id.toString(), { name: "Main Updated" }, {})).name, "Main Updated");
  assert.equal((await deactivateWarehouse(companyId, warehouse._id.toString(), {}) as { isActive: boolean }).isActive, false);

  await PaymentModel.create({ companyId, accountId: new Types.ObjectId(), paymentMethodId: paymentMethod._id, type: "CUSTOMER", amount: 5, createdBy: userId });
  await assert.rejects(paymentMethodSpec.deactivate(companyId, paymentMethod._id.toString()), hasCode("MASTER_CATALOG_IN_USE"));
  await PaymentModel.deleteMany({ companyId });
  assert.equal((await paymentMethodSpec.deactivate(companyId, paymentMethod._id.toString()) as { isActive: boolean }).isActive, false);
});
