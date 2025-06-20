const Joi = require("joi")

const validateBooking = (data) => {
  const schema = Joi.object({
    customerInfo: Joi.object({
      name: Joi.string().min(2).max(50).required(),
      email: Joi.string().email().required(),
      phone: Joi.string()
        .pattern(/^[6-9]\d{9}$/)
        .required(),
    }).required(),
    serviceType: Joi.string().valid("courier", "shifting", "local", "international").required(),
    pickupAddress: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      pincode: Joi.string()
        .pattern(/^\d{6}$/)
        .required(),
      landmark: Joi.string().allow("").optional(),
    }).required(),
    deliveryAddress: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      pincode: Joi.string()
        .pattern(/^\d{6}$/)
        .required(),
      landmark: Joi.string().allow("").optional(),
    }).required(),
    packageDetails: Joi.object({
      weight: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
      dimensions: Joi.object({
        length: Joi.number().optional(),
        width: Joi.number().optional(),
        height: Joi.number().optional(),
      }).optional(),
      description: Joi.string().optional(),
      value: Joi.number().min(0).optional(),
      fragile: Joi.boolean().optional(),
    }).optional(),
    scheduledDate: Joi.date().min("now").required(),
    timeSlot: Joi.string().valid("9-12", "12-15", "15-18", "18-21").required(),
    specialInstructions: Joi.string().allow("").optional(),
  })

  return schema.validate(data)
}

const validateContact = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    phone: Joi.string()
      .pattern(/^[6-9]\d{9}$/)
      .required(),
    subject: Joi.string().min(5).max(100).required(),
    message: Joi.string().min(10).max(1000).required(),
  })

  return schema.validate(data)
}

module.exports = {
  validateBooking,
  validateContact,
}
