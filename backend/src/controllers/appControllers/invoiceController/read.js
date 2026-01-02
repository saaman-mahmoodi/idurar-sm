const supabase = require('@/config/supabase');

const read = async (req, res) => {
  try {
    // Find document by id with related data
    const { data: result, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*),
        created_by_admin:admins!created_by(id, name, email)
      `)
      .eq('id', req.params.id)
      .eq('removed', false)
      .single();

    if (error || !result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No document found',
      });
    }

    // Return success response
    return res.status(200).json({
      success: true,
      result,
      message: 'we found this document',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = read;
