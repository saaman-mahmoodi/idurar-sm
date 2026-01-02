const supabase = require('@/config/supabase');
const { calculate } = require('@/helpers');

const create = async (req, res) => {
  try {
    // Creating a new document in the collection
    if (req.body.amount === 0) {
      return res.status(202).json({
        success: false,
        result: null,
        message: `The Minimum Amount couldn't be 0`,
      });
    }

    // Get current invoice
    const { data: currentInvoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, total, discount, credit')
      .eq('id', req.body.invoice)
      .eq('removed', false)
      .single();

    if (invoiceError || !currentInvoice) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Invoice not found',
      });
    }

    const {
      total: previousTotal,
      discount: previousDiscount,
      credit: previousCredit,
    } = currentInvoice;

    const maxAmount = calculate.sub(calculate.sub(previousTotal, previousDiscount), previousCredit);

    if (req.body.amount > maxAmount) {
      return res.status(202).json({
        success: false,
        result: null,
        message: `The Max Amount you can add is ${maxAmount}`,
      });
    }

    // Create payment
    const { data: result, error: createError } = await supabase
      .from('payments')
      .insert({
        removed: false,
        created_by: req.admin.id,
        number: req.body.number,
        client_id: req.body.client,
        invoice_id: req.body.invoice,
        date: req.body.date,
        amount: req.body.amount,
        currency: req.body.currency,
        payment_mode_id: req.body.paymentMode,
        ref: req.body.ref,
        description: req.body.description
      })
      .select()
      .single();

    if (createError) throw createError;

    // Update payment with PDF filename
    const fileId = 'payment-' + result.id + '.pdf';
    const { data: updatePath, error: updateError } = await supabase
      .from('payments')
      .update({ pdf: fileId })
      .eq('id', result.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Calculate new payment status
    const { amount } = result;
    const { total, discount, credit } = currentInvoice;

    let paymentStatus =
      calculate.sub(total, discount) === calculate.add(credit, amount)
        ? 'paid'
        : calculate.add(credit, amount) > 0
        ? 'partially'
        : 'unpaid';

    // Update invoice with new credit and payment status
    const { error: invoiceUpdateError } = await supabase
      .from('invoices')
      .update({
        credit: calculate.add(credit, amount),
        payment_status: paymentStatus,
      })
      .eq('id', req.body.invoice);

    if (invoiceUpdateError) throw invoiceUpdateError;

    return res.status(200).json({
      success: true,
      result: updatePath,
      message: 'Payment Invoice created successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = create;
