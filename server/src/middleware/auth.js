import jwt from "jsonwebtoken";

export function signUser(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET || "development-secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );
}

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: "Authentication token required." });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "development-secret");
    return next();
  } catch {
    return res.status(401).json({ message: "Session expired or invalid." });
  }
}

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user?.role)) {
      return res.status(403).json({ message: "You do not have permission to perform this action." });
    }
    return next();
  };
}
