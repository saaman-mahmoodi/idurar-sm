const supabase = require('@/config/supabase');

// Helper to convert snake_case to camelCase
const toCamelCase = (str) => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
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

const listAll = async (req, res) => {
  try {
    const sort = req.query.sort === 'asc' ? true : false;

    //  Query the database for a list of all results
    const { data: result, error } = await supabase
      .from('settings')
      .select('*')
      .eq('removed', false)
      .eq('is_private', false)
      .order('created_at', { ascending: sort });

    if (error) {
      return res.status(500).json({
        success: false,
        result: [],
        message: error.message,
      });
    }

    if (result && result.length > 0) {
      return res.status(200).json({
        success: true,
        result: result.map(keysToCamelCase),
        message: 'Successfully found all documents',
      });
    } else {
      return res.status(203).json({
        success: false,
        result: [],
        message: 'Collection is Empty',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: [],
      message: error.message,
    });
  }
};

module.exports = listAll;
