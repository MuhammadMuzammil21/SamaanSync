const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  const payload = {
    username: user.username,
    role: user.role || 'admin'
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

  return token;
};

module.exports = { generateToken };
