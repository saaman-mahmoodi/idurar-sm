const supabaseCrud = require('@/helpers/supabaseCrud');

const createSupabaseCRUDController = (tableName) => {
  return {
    create: (req, res) => supabaseCrud.create(tableName, req, res),
    read: (req, res) => supabaseCrud.read(tableName, req, res),
    update: (req, res) => supabaseCrud.update(tableName, req, res),
    delete: (req, res) => supabaseCrud.remove(tableName, req, res),
    list: (req, res) => supabaseCrud.paginatedList(tableName, req, res),
    listAll: (req, res) => supabaseCrud.listAll(tableName, req, res),
    search: (req, res) => supabaseCrud.search(tableName, req, res),
    filter: (req, res) => supabaseCrud.filter(tableName, req, res),
    summary: (req, res) => supabaseCrud.summary(tableName, req, res),
  };
};

module.exports = createSupabaseCRUDController;
