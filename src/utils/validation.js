const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (email) => emailRegex.test(email);

const isValidMobile = (mobile) => /^[0-9]{10,15}$/.test(mobile);

const isStrongPassword = (password) =>
  typeof password === "string" && password.length >= 8;

module.exports = {
  isValidEmail,
  isValidMobile,
  isStrongPassword,
};
