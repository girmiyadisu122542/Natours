const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })
}

const createSignToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true
    }
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions)

    user.password = undefined;  //Removing password from out put
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
}

exports.signUp = catchAsync(async (req, res, next) => {
    const newUser = await User.create(req.body);

    // const newUser = await User.create({
    //     name: req.body.name,
    //     email: req.body.email,
    //     password: req.body.password,
    //     passwordConfirm: req.body.passwordConfirm
    // });

    createSignToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    //1) check if email and password exists
    if (!email || !password) return next(new AppError('Enter email or password', 400));

    //2, check if the user exists
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Invalid email or password', 401));
    }

    //3 if everything is ok

    createSignToken(user, 200, res);

});

exports.protect = catchAsync(async (req, res, next) => {

    //1) Getting token and check of it's there
    let token;
    const header = req.headers.authorization
    if (header && header.startsWith('Bearer')) {
        token = header.split(' ')[1];
    }
    if (!token) {
        return next(new AppError('Your are not logged in. Please login to get access', 401));
    }
    //2) verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    //3) check is user exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError('The user belongs to this token does not longer exist.'), 401);
    }
    //4)check if the user is changed after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed the password! Please try again.', 401));
    }
    //GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;

    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission for this action', 403));
        }

        next();
    }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    //1)Get user based on the POST email

    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new AppError('There is no user with this email address', 404));
    }

    //2) Generate the random reset token
    const resetToken = await user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    //3) Send to the users email

    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const message = `Forgot your password? submit a PATCH request with new password and passworConfirm 
    to:${resetURL}. If you don't forget your password, please ignore this email`;
    try {
        await sendEmail({
            email: user.email,
            subject: resetURL,
            message: message
        });

        res.status(200).json({
            status: 'success',
            message: 'Token sent successfully!'
        });

    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('There was an error sending an email.Please try again later'), 500);
    }


});

exports.resetPassword = catchAsync(async (req, res, next) => {

    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });
    if (!user) {
        return next(new AppError('Invalid Token or token expired!', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    createSignToken(user, 200, res);

});

exports.updatePassword = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('The current user password is incorrect', 401));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    //user.findAndUpdate is not working
    createSignToken(user, 200, res);

});