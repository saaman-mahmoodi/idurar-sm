const supabase = require('@/config/supabase');

// Helper to convert camelCase to snake_case
const toSnakeCase = (str) => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

// Helper to convert snake_case to camelCase
const toCamelCase = (str) => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

// Convert object keys from camelCase to snake_case
const keysToSnakeCase = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(keysToSnakeCase);
  
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = toSnakeCase(key);
    acc[snakeKey] = keysToSnakeCase(obj[key]);
    return acc;
  }, {});
};

// Convert object keys from snake_case to camelCase
const keysToCamelCase = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(keysToCamelCase);
  
  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = toCamelCase(key);
    acc[camelKey] = keysToCamelCase(obj[key]);
    return acc;
  }, {});
};

const supabaseCrud = {
  create: async (tableName, req, res) => {
    try {
      const data = keysToSnakeCase({ ...req.body, removed: false });
      
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        result: keysToCamelCase(result),
        message: 'Successfully created the document',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }
  },

  read: async (tableName, req, res) => {
    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', req.params.id)
        .eq('removed', false)
        .single();

      if (error || !result) {
        return res.status(404).json({
          success: false,
          result: null,
          message: 'No document found',
        });
      }

      return res.status(200).json({
        success: true,
        result: keysToCamelCase(result),
        message: 'Document found',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }
  },

  update: async (tableName, req, res) => {
    try {
      const data = keysToSnakeCase({ ...req.body, removed: false });
      
      const { data: result, error } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', req.params.id)
        .eq('removed', false)
        .select()
        .single();

      if (error || !result) {
        return res.status(404).json({
          success: false,
          result: null,
          message: 'No document found',
        });
      }

      return res.status(200).json({
        success: true,
        result: keysToCamelCase(result),
        message: 'Document updated',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }
  },

  remove: async (tableName, req, res) => {
    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .update({ removed: true })
        .eq('id', req.params.id)
        .select()
        .single();

      if (error || !result) {
        return res.status(404).json({
          success: false,
          result: null,
          message: 'No document found',
        });
      }

      return res.status(200).json({
        success: true,
        result: keysToCamelCase(result),
        message: 'Successfully deleted the document',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }
  },

  paginatedList: async (tableName, req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.items) || 10;
      const skip = (page - 1) * limit;

      const { sortBy = 'enabled', sortValue = -1, filter, equal, q } = req.query;
      const fieldsArray = req.query.fields ? req.query.fields.split(',') : [];

      let query = supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .eq('removed', false);

      // Apply filter if provided
      if (filter && equal !== undefined) {
        const snakeFilter = toSnakeCase(filter);
        query = query.eq(snakeFilter, equal);
      }

      // Apply search if provided
      if (q && fieldsArray.length > 0) {
        const searchConditions = fieldsArray
          .map(field => `${toSnakeCase(field)}.ilike.%${q}%`)
          .join(',');
        query = query.or(searchConditions);
      }

      // Apply sorting
      const snakeSortBy = toSnakeCase(sortBy);
      query = query.order(snakeSortBy, { ascending: sortValue === 1 });

      // Apply pagination
      query = query.range(skip, skip + limit - 1);

      const { data: result, error, count } = await query;

      if (error) throw error;

      const pages = Math.ceil(count / limit);
      const pagination = { page, pages, count };

      if (count > 0) {
        return res.status(200).json({
          success: true,
          result: result.map(keysToCamelCase),
          pagination,
          message: 'Successfully found all documents',
        });
      } else {
        return res.status(203).json({
          success: true,
          result: [],
          pagination,
          message: 'Collection is empty',
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }
  },

  listAll: async (tableName, req, res) => {
    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('removed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({
        success: true,
        result: result.map(keysToCamelCase),
        message: 'Successfully found all documents',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }
  },

  search: async (tableName, req, res) => {
    try {
      const { q, fields } = req.query;
      const fieldsArray = fields ? fields.split(',') : [];
      
      let query = supabase
        .from(tableName)
        .select('*')
        .eq('removed', false)
        .eq('enabled', true);

      // If query is provided, apply search filter
      if (q && q.trim() !== '' && fieldsArray.length > 0) {
        const searchConditions = fieldsArray
          .map(field => `${toSnakeCase(field)}.ilike.%${q}%`)
          .join(',');
        query = query.or(searchConditions);
      }

      // Limit results to prevent performance issues
      query = query.limit(100).order('created_at', { ascending: false });

      const { data: result, error } = await query;

      if (error) throw error;

      return res.status(200).json({
        success: true,
        result: result.map(keysToCamelCase),
        message: 'Successfully found documents',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }
  },

  filter: async (tableName, req, res) => {
    try {
      const { filter, equal } = req.query;

      let query = supabase
        .from(tableName)
        .select('*')
        .eq('removed', false);

      if (filter && equal !== undefined) {
        const snakeFilter = toSnakeCase(filter);
        query = query.eq(snakeFilter, equal);
      }

      const { data: result, error } = await query;

      if (error) throw error;

      return res.status(200).json({
        success: true,
        result: result.map(keysToCamelCase),
        message: 'Successfully filtered documents',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }
  },

  summary: async (tableName, req, res) => {
    try {
      const { data: result, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .eq('removed', false);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        result: { count },
        message: 'Successfully retrieved summary',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }
  },
};

module.exports = supabaseCrud;
