import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const authMiddleware = (permanentKey: Buffer) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const allowedPaths = ['/', '/submit', 'favicon.ico'];

  if (allowedPaths.includes(req.path)) {
    return next();
  }

  const token = req.cookies?.danit;

  if (!token) {
    return res.redirect('/');
  }

  try {
    jwt.verify(token, permanentKey);
    return next(); // JWT is valid, proceed
  } catch (err) {
    return res.redirect('/');
  }
};

export default authMiddleware;
