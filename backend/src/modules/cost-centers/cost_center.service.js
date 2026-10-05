'use strict';

const repo = require('./cost_center.repository');
const ApiError = require('../../utils/ApiError');
const { parsePagination, buildMeta } = require('../../utils/pagination');

class CostCenterService {
  async list(companyId, query) {
    const { page, limit, skip, sort: defaultSort } = parsePagination(query);
    const sortableFields = ['code', 'name', 'category', 'budget', 'executedAmount', 'createdAt'];
    const sort =
      query.sortBy && sortableFields.includes(query.sortBy)
        ? { [query.sortBy]: query.sortDir === 'desc' ? -1 : 1 }
        : defaultSort;

    const filter = { companyId };
    if (query.projectId) filter.projectId = query.projectId;
    if (query.category) filter.category = query.category;
    if (query.status) filter.status = query.status;
    if (query.search) {
      const reg = new RegExp(query.search, 'i');
      filter.$or = [{ code: reg }, { name: reg }];
    }

    const [items, total] = await Promise.all([
      repo.find(companyId, filter, { skip, limit, sort }),
      repo.count(companyId, filter),
    ]);

    return { items, meta: buildMeta(page, limit, total) };
  }

  async getById(companyId, id) {
    const item = await repo.findById(companyId, id);
    if (!item) throw ApiError.notFound('Centro de costo no encontrado.');
    return item;
  }

  async create(companyId, payload) {
    const existing = await repo.findByCode(companyId, payload.projectId, payload.code);
    if (existing) throw ApiError.conflict(`Ya existe un centro de costo con el código "${payload.code}" en esta obra.`);

    return repo.create({
      companyId,
      ...payload,
      code: payload.code.toUpperCase(),
    });
  }

  async update(companyId, id, payload) {
    const current = await this.getById(companyId, id);
    const targetProject = payload.projectId || current.projectId;
    if (payload.code && payload.code.toUpperCase() !== current.code) {
      const dup = await repo.findByCode(companyId, targetProject, payload.code);
      if (dup) throw ApiError.conflict(`Ya existe otro centro de costo con el código "${payload.code}" en esta obra.`);
    }

    const updated = await repo.updateById(companyId, id, {
      ...payload,
      ...(payload.code ? { code: payload.code.toUpperCase() } : {}),
    });
    if (!updated) throw ApiError.notFound('Centro de costo no encontrado.');
    return updated;
  }

  async remove(companyId, id) {
    await this.getById(companyId, id);
    return repo.deleteById(companyId, id);
  }
}

module.exports = new CostCenterService();
