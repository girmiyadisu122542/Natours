const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
}

const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/"([^"]*)"/)[0];
    const message = `Duplicate Field Value: ${value}. Please use another value`;

    return new AppError(message, 400);
}
const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid Input: ${errors.join('.')}`;

    return new AppError(message, 422);
}

const handleJWTError = err => new AppError('Invalid token! Please login again', 401);

const handleJWTExpiredError = err => new AppError('Your token has expired! Please login again', 401);

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
}

const sendErrorProd = (err, res) => {

    //Operational: trusted error send to the client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }
    //Programming or unknow error:  errors not to be seen for the client only for developers
    else {
        //1) log error
        console.error("ERROR 💥", err);
        // 2) send generic message
        res.status(500).json({
            status: 'error',
            message: "Something went wrong",
        });
    }

}

module.exports = (err, req, res, next) => {
    console.log(err.stack);
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error'


    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    }
    else if (process.env.NODE_ENV === 'production') {

        let error = { ...err };

        if (err.name === 'CastError') error = handleCastErrorDB(err);
        if (err.code === 11000) error = handleDuplicateFieldsDB(err);
        if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
        if (err.name === 'JsonWebTokenError') error = handleJWTError(err);
        if (err.name === 'TokenExpiredError') error = handleJWTExpiredError(err);

        sendErrorProd(error, res);
    }


}