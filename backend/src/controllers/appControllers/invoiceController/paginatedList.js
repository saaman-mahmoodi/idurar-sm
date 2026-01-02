const supabase = require('@/config/supabase');

const toSnakeCase = (str) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

const paginatedList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.items) || 10;
    const skip = (page - 1) * limit;

    const { sortBy = 'enabled', sortValue = -1, filter, equal, q } = req.query;
    const fieldsArray = req.query.fields ? req.query.fields.split(',') : [];

    let query = supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*),
        created_by_admin:admins!created_by(id, name, email)
      `, { count: 'exact' })
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
        result,
        pagination,
        message: 'Successfully found all documents',
      });
    } else {
      return res.status(203).json({
        success: true,
        result: [],
        pagination,
        message: 'Collection is Empty',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = paginatedList;
