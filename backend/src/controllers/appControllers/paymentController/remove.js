const supabase = require('@/config/supabase');
const { calculate } = require('@/helpers');

const remove = async (req, res) => {
  try {
    // Find the payment
    const { data: previousPayment, error: paymentError } = await supabase
      .from('payments')
      .select('id, amount, invoice_id')
      .eq('id', req.params.id)
      .eq('removed', false)
      .single();

    if (paymentError || !previousPayment) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No document found',
      });
    }

    const { id: paymentId, amount, invoice_id } = previousPayment;

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, total, discount, credit, payment_status')
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Invoice not found',
      });
    }

    // Soft delete the payment
    const { data: result, error: deleteError } = await supabase
      .from('payments')
      .update({ removed: true })
      .eq('id', req.params.id)
      .eq('removed', false)
      .select()
      .single();

    if (deleteError) throw deleteError;

    // Update invoice credit and payment status
    const { total, discount, credit: previousCredit, payment_status: previousPaymentStatus } = invoice;

    let paymentStatus =
      calculate.sub(total, discount) === calculate.sub(previousCredit, amount)
        ? 'paid'
        : calculate.sub(previousCredit, amount) > 0
        ? 'partially'
        : 'unpaid';

    const { error: invoiceUpdateError } = await supabase
      .from('invoices')
      .update({
        credit: calculate.sub(previousCredit, amount),
        payment_status: paymentStatus,
      })
      .eq('id', invoice_id);

    if (invoiceUpdateError) throw invoiceUpdateError;

    return res.status(200).json({
      success: true,
      result,
      message: 'Successfully Deleted the document',
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
