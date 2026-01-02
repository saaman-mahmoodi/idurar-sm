const supabase = require('@/config/supabase');

exports.getData = async ({ model }) => {
  const tableName = model.toLowerCase() + 's';
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('removed', false)
    .eq('enabled', true);
  
  return error ? [] : data;
};

exports.getOne = async ({ model, id }) => {
  const tableName = model.toLowerCase() + 's';
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', id)
    .eq('removed', false)
    .single();
  
  return error ? null : data;
};
