import jwt from "jsonwebtoken";

const authToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]; 
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Vui lòng đăng nhập" });
  }

  jwt.verify(token, "NhoMotNguoi", (err, payload) => {
    if (err) {
      return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
    req.user = payload; // gắn payload vào req
    next();
  });
};

export default authToken;
