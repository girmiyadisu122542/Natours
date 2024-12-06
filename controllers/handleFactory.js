const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const deltedData = await Model.findByIdAndDelete(req.params.id);

    if (!deltedData) {
        return next(new AppError('No Document found with this id', 400));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });

});
