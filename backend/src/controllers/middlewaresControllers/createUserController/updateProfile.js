const supabase = require('@/config/supabase');

const updateProfile = async (userModel, req, res) => {
  try {
    const tableName = userModel.toLowerCase() + 's';
    const reqUserName = userModel.toLowerCase();
    const userProfile = req[reqUserName];

    if (userProfile.email === 'admin@admin.com') {
      return res.status(403).json({
        success: false,
        result: null,
        message: "you couldn't update demo informations",
      });
    }

    let updates = req.body.photo
      ? {
          email: req.body.email,
          name: req.body.name,
          surname: req.body.surname,
          photo: req.body.photo,
        }
      : {
          email: req.body.email,
          name: req.body.name,
          surname: req.body.surname,
        };

    // Find document by id and updates with the required fields
    const { data: result, error } = await supabase
      .from(tableName)
      .update(updates)
      .eq('id', userProfile.id)
      .eq('removed', false)
      .select()
      .single();

    if (error || !result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No profile found by this id: ' + userProfile.id,
      });
    }

    return res.status(200).json({
      success: true,
      result: {
        id: result?.id,
        enabled: result?.enabled,
        email: result?.email,
        name: result?.name,
        surname: result?.surname,
        photo: result?.photo,
        role: result?.role,
      },
      message: 'we update this profile by this id: ' + userProfile.id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = updateProfile;
