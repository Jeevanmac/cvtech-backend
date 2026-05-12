const Joi = require('joi');

const authSchema = Joi.object({
    firstName: Joi.string().min(2).max(50).when('$isSignup', { is: true, then: Joi.required() }),
    lastName: Joi.string().min(2).max(50).when('$isSignup', { is: true, then: Joi.required() }),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
    recaptchaToken: Joi.string().required() // Critical security hook appended
});

const validateInput = (schema, isSignup = false) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false, context: { isSignup } });
        if (error) {
            const errorMessage = error.details.map(detail => detail.message).join(', ');
            return res.status(400).json({ success: false, message: `Input Boundary Violation: ${errorMessage}` });
        }
        next();
    };
};

module.exports = {
    validateInput,
    authSchema
};
