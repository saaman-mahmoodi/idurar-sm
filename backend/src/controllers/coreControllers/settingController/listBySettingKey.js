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

const listBySettingKey = async (req, res) => {
  try {
    const settingKeyArray = req.query.settingKeyArray ? req.query.settingKeyArray.split(',') : [];

    if (settingKeyArray.length === 0) {
      return res
        .status(202)
        .json({
          success: false,
          result: [],
          message: 'Please provide settings you need',
        })
        .end();
    }

    // Query with OR condition for multiple setting keys
    const { data: results, error } = await supabase
      .from('settings')
      .select('*')
      .in('setting_key', settingKeyArray)
      .eq('removed', false);

    if (error) {
      return res.status(500).json({
        success: false,
        result: [],
        message: error.message,
      });
    }

    // If no results found, return document not found
    if (results && results.length >= 1) {
      return res.status(200).json({
        success: true,
        result: results.map(keysToCamelCase),
        message: 'Successfully found all documents',
      });
    } else {
      return res
        .status(202)
        .json({
          success: false,
          result: [],
          message: 'No document found by this request',
        })
        .end();
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: [],
      message: error.message,
    });
  }
};

module.exports = listBySettingKey;
