const supabase = require('@/config/supabase');
const { calculate } = require('@/helpers');

const update = async (req, res) => {
  try {
    if (req.body.amount === 0) {
      return res.status(202).json({
        success: false,
        result: null,
        message: `The Minimum Amount couldn't be 0`,
      });
    }

    // Find previous payment
    const { data: previousPayment, error: paymentError } = await supabase
      .from('payments')
      .select('amount, invoice_id')
      .eq('id', req.params.id)
      .eq('removed', false)
      .single();

    if (paymentError || !previousPayment) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Payment not found',
      });
    }

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, total, discount, credit')
      .eq('id', previousPayment.invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Invoice not found',
      });
    }

    const { amount: previousAmount } = previousPayment;
    const { id: invoiceId, total, discount, credit: previousCredit } = invoice;

    const { amount: currentAmount } = req.body;

    const changedAmount = calculate.sub(currentAmount, previousAmount);
    const maxAmount = calculate.sub(total, calculate.add(discount, previousCredit));

    if (changedAmount > maxAmount) {
      return res.status(202).json({
        success: false,
        result: null,
        message: `The Max Amount you can add is ${maxAmount + previousAmount}`,
        error: `The Max Amount you can add is ${maxAmount + previousAmount}`,
      });
    }

    let paymentStatus =
      calculate.sub(total, discount) === calculate.add(previousCredit, changedAmount)
        ? 'paid'
        : calculate.add(previousCredit, changedAmount) > 0
        ? 'partially'
        : 'unpaid';

    // Update payment
    const { data: result, error: updateError } = await supabase
      .from('payments')
      .update({
        number: req.body.number,
        date: req.body.date,
        amount: req.body.amount,
        payment_mode_id: req.body.paymentMode,
        ref: req.body.ref,
        description: req.body.description,
      })
      .eq('id', req.params.id)
      .eq('removed', false)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update invoice credit and payment status
    const { error: invoiceUpdateError } = await supabase
      .from('invoices')
      .update({
        credit: calculate.add(previousCredit, changedAmount),
        payment_status: paymentStatus,
      })
      .eq('id', invoiceId);

    if (invoiceUpdateError) throw invoiceUpdateError;

    return res.status(200).json({
      success: true,
      result,
      message: 'Successfully updated the Payment',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = update;
