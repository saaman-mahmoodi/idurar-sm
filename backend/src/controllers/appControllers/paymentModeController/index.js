const createSupabaseCRUDController = require('@/controllers/middlewaresControllers/createSupabaseCRUDController');
const supabase = require('@/config/supabase');

function modelController() {
  const methods = createSupabaseCRUDController('payment_modes');

  methods.create = async (req, res) => {
    try {
      const { isDefault } = req.body;

      if (isDefault) {
        await supabase
          .from('payment_modes')
          .update({ is_default: false })
          .neq('removed', true);
      }

      const { count } = await supabase
        .from('payment_modes')
        .select('*', { count: 'exact', head: true })
        .eq('is_default', true);

      const data = {
        ...req.body,
        removed: false,
        is_default: count < 1 ? true : (isDefault || false)
      };

      const { data: result, error } = await supabase
        .from('payment_modes')
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        result,
        message: 'Payment mode created successfully',
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
      message: "You can't delete payment mode after it has been created",
    });
  };

  methods.update = async (req, res) => {
    try {
      const { id } = req.params;
      
      const { data: paymentMode, error: fetchError } = await supabase
        .from('payment_modes')
        .select('*')
        .eq('id', id)
        .eq('removed', false)
        .single();

      if (fetchError || !paymentMode) {
        return res.status(404).json({
          success: false,
          result: null,
          message: 'Payment mode not found',
        });
      }

      const { isDefault = paymentMode.is_default, enabled = paymentMode.enabled } = req.body;

      // if isDefault:false, we update first - isDefault:true
      // if enabled:false and isDefault:true, we update first - isDefault:true
      if (!isDefault || (!enabled && isDefault)) {
        await supabase
          .from('payment_modes')
          .update({ is_default: true })
          .neq('id', id)
          .eq('enabled', true)
          .limit(1);
      }

      // if isDefault:true and enabled:true, we update other paymentMode and make is isDefault:false
      if (isDefault && enabled) {
        await supabase
          .from('payment_modes')
          .update({ is_default: false })
          .neq('id', id);
      }

      const { count: paymentModeCount } = await supabase
        .from('payment_modes')
        .select('*', { count: 'exact', head: true });

      // if enabled:false and it's only one exist, we can't disable
      if ((!enabled || !isDefault) && paymentModeCount <= 1) {
        return res.status(422).json({
          success: false,
          result: null,
          message: 'You cannot disable the payment mode because it is the only existing one',
        });
      }

      const { data: result, error: updateError } = await supabase
        .from('payment_modes')
        .update(req.body)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      return res.status(200).json({
        success: true,
        message: 'Payment mode updated successfully',
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
