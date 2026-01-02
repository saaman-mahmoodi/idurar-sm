const createSupabaseCRUDController = require('@/controllers/middlewaresControllers/createSupabaseCRUDController');
const supabase = require('@/config/supabase');

function modelController() {
  const methods = createSupabaseCRUDController('taxes');

  methods.create = async (req, res) => {
    try {
      const { taxName, taxValue, isDefault, enabled } = req.body;

      if (isDefault) {
        await supabase
          .from('taxes')
          .update({ is_default: false })
          .neq('removed', true);
      }

      const { count } = await supabase
        .from('taxes')
        .select('*', { count: 'exact', head: true })
        .eq('is_default', true);

      const data = {
        tax_name: taxName,
        tax_value: taxValue,
        enabled: enabled !== undefined ? enabled : true,
        removed: false,
        is_default: count < 1 ? true : (isDefault || false)
      };

      const { data: result, error } = await supabase
        .from('taxes')
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        result,
        message: 'Tax created successfully',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }
  };

  methods.delete = async (req, res) => {
    return res.status(403).json({
      success: false,
      result: null,
      message: "You can't delete tax after it has been created",
    });
  };

  methods.update = async (req, res) => {
    try {
      const { id } = req.params;
      
      const { data: tax, error: fetchError } = await supabase
        .from('taxes')
        .select('*')
        .eq('id', id)
        .eq('removed', false)
        .single();

      if (fetchError || !tax) {
        return res.status(404).json({
          success: false,
          result: null,
          message: 'Tax not found',
        });
      }

      const { taxName, taxValue, isDefault = tax.is_default, enabled = tax.enabled } = req.body;

      // if isDefault:false, we update first - isDefault:true
      // if enabled:false and isDefault:true, we update first - isDefault:true
      if (!isDefault || (!enabled && isDefault)) {
        await supabase
          .from('taxes')
          .update({ is_default: true })
          .neq('id', id)
          .eq('enabled', true)
          .limit(1);
      }

      // if isDefault:true and enabled:true, we update other taxes and make is isDefault:false
      if (isDefault && enabled) {
        await supabase
          .from('taxes')
          .update({ is_default: false })
          .neq('id', id);
      }

      const { count: taxesCount } = await supabase
        .from('taxes')
        .select('*', { count: 'exact', head: true });

      // if enabled:false and it's only one exist, we can't disable
      if ((!enabled || !isDefault) && taxesCount <= 1) {
        return res.status(422).json({
          success: false,
          result: null,
          message: 'You cannot disable the tax because it is the only existing one',
        });
      }

      const updateData = {
        enabled,
        is_default: isDefault
      };

      if (taxName !== undefined) updateData.tax_name = taxName;
      if (taxValue !== undefined) updateData.tax_value = taxValue;

      const { data: result, error: updateError } = await supabase
        .from('taxes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      return res.status(200).json({
        success: true,
        message: 'Tax updated successfully',
        result,
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
