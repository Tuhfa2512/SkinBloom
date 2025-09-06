// import jwt from 'jsonwebtoken';

// export function authRequired(req, res, next) {
//   const authHeader = req.headers['authorization'];

//   // Debug logs
//   console.log("Auth Header:", authHeader);

//   if (!authHeader) {
//     return res.status(401).json({ message: 'No token, authorization denied' });
//   }

//   const token = authHeader.split(' ')[1]; // "Bearer <token>"

//   // Debug logs
//   console.log("Token extracted:", token);

//   if (!token) {
//     return res.status(401).json({ message: 'No token, authorization denied' });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded; // attach user info to request
//     next();
//   } catch (err) {
//     return res.status(401).json({ message: 'Token is not valid' });
//   }
// }
import jwt from 'jsonwebtoken'

export function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' })
  }
  const token = authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    return next()
  } catch {
    return res.status(401).json({ message: 'Token is not valid' })
  }
}

// Alternative name for consistency
export const authenticateToken = authRequired

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' })
    next()
  }
}

// Specific role middleware
export const adminRequired = (req, res, next) => {
  // First authenticate, then check role
  authRequired(req, res, (err) => {
    if (err) {
      return next(err);
    }
    return requireRole('admin')(req, res, next);
  });
};

export const dermatologistRequired = (req, res, next) => {
  // First authenticate, then check role
  authRequired(req, res, (err) => {
    if (err) {
      return next(err);
    }
    return requireRole('dermatologist', 'admin')(req, res, next);
  });
};
