const supabase = require('@/config/supabase');

const increaseBySettingKey = async ({ settingKey }) => {
  try {
    if (!settingKey) {
      return null;
    }

    // First read the current value
    const { data: current, error: readError } = await supabase
      .from('settings')
      .select('setting_value')
      .eq('setting_key', settingKey)
      .single();

    if (readError || !current) {
      return null;
    }

    // Increment and update
    const newValue = parseInt(current.setting_value) + 1;
    const { data: result, error } = await supabase
      .from('settings')
      .update({ setting_value: newValue })
      .eq('setting_key', settingKey)
      .select()
      .single();

    if (error || !result) {
      return null;
    }

    return result;
  } catch {
    return null;
  }
};

module.exports = increaseBySettingKey;
