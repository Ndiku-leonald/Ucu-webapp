import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

export const requireAuth = (req, res, next) => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ message: "Authorization token is required" });
	}

	const token = authHeader.split(" ")[1];

	try {
		req.user = jwt.verify(token, JWT_SECRET);
		next();
	} catch (error) {
		return res.status(401).json({ message: "Invalid or expired token" });
	}
};

export const authorizeRoles = (...roles) => (req, res, next) => {
	if (!req.user || !roles.includes(req.user.role)) {
		return res.status(403).json({ message: "You do not have permission to perform this action" });
	}

	next();
};
