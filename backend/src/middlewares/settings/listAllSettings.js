const supabase = require('@/config/supabase');

const listAllSettings = async () => {
  try {
    const { data: result, error } = await supabase
      .from('settings')
      .select('*')
      .eq('removed', false);

    if (error || !result) {
      return [];
    }

    return result;
  } catch {
    return [];
  }
};

module.exports = listAllSettings;
