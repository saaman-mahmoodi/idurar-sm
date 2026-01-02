const createSupabaseCRUDController = require('@/controllers/middlewaresControllers/createSupabaseCRUDController');
const supabase = require('@/config/supabase');

const summary = require('./summary');

function modelController() {
  const methods = createSupabaseCRUDController('clients');

  methods.summary = async (req, res) => {
    try {
      const { data: result, error, count } = await supabase
        .from('clients')
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
  };
  
  return methods;
}

module.exports = modelController();
