const supabase = require('@/config/supabase');

const updateBySettingKey = async ({ settingKey, settingValue }) => {
  try {
    if (!settingKey || !settingValue) {
      return null;
    }

    const { data: result, error } = await supabase
      .from('settings')
      .update({ setting_value: settingValue })
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

module.exports = updateBySettingKey;
