const supabase = require('@/config/supabase');

const remove = async (req, res) => {
  try {
    const { data: deletedInvoice, error: deleteError } = await supabase
      .from('invoices')
      .update({ removed: true })
      .eq('id', req.params.id)
      .eq('removed', false)
      .select()
      .single();

    if (deleteError || !deletedInvoice) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Invoice not found',
      });
    }

    // Also mark related payments as removed
    await supabase
      .from('payments')
      .update({ removed: true })
      .eq('invoice_id', deletedInvoice.id);

    return res.status(200).json({
      success: true,
      result: deletedInvoice,
      message: 'Invoice deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = remove;
