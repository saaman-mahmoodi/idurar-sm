const supabase = require('@/config/supabase');

const read = async (userModel, req, res) => {
  try {
    const tableName = userModel.toLowerCase() + 's';

    // Find document by id
    const { data: tmpResult, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', req.params.id)
      .eq('removed', false)
      .single();

    if (error || !tmpResult) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No document found ',
      });
    }

    // Return success response
    let result = {
      id: tmpResult.id,
      enabled: tmpResult.enabled,
      email: tmpResult.email,
      name: tmpResult.name,
      surname: tmpResult.surname,
      photo: tmpResult.photo,
      role: tmpResult.role,
    };

    return res.status(200).json({
      success: true,
      result,
      message: 'we found this document ',
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
