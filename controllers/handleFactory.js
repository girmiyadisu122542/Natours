const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

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

exports.updateOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!doc) {
        return next(new AppError('No document found with this id', 400));
    }

    res.status(200).json({
        status: 'success',
        data: {
            data: doc
        }
    });
});

exports.createOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            data: doc
        }
    });
});


exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (popOptions) query = query.populate(popOptions);

    const doc = await query;

    if (!doc) {
        return next(new AppError('No doc found with this id', 404));
    }

    res.status(200).json({
        status: 'success',
        requestedAt: req.requestTime,
        data: {
            data: doc
        }
    });
});


exports.getAll = Model => catchAsync(async (req, res, next) => {

    //to allow nested route review on tour 
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    const features = new APIFeatures(Model.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .pagination()
    const docs = await features.query;
    res.status(200).json({
        status: 'success',
        requestedAt: req.requestTime,
        results: docs.length,
        data: {
            data: docs
        }
    });
});