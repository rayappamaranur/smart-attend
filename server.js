require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }
}, { timestamps: true });

const attendanceSchema = new mongoose.Schema({
  studentName: { type: String, required: true, trim: true },
  studentId: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ["Present", "Absent"], required: true },
  notes: { type: String, default: "", trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const Attendance = mongoose.model("Attendance", attendanceSchema);

function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Please log in first." });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Session expired. Please log in again." });
  }
}

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "All fields are required." });
    if (password.length < 6) return res.status(400).json({ message: "Password must contain at least 6 characters." });
    const normalizedEmail = email.toLowerCase().trim();
    if (await User.findOne({ email: normalizedEmail })) return res.status(409).json({ message: "Email is already registered." });
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email: normalizedEmail, password: hashedPassword });
    res.status(201).json({ message: "Registration successful. Please log in." });
  } catch (err) {
    res.status(500).json({ message: "Registration failed.", error: err.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password || "", user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const token = jwt.sign({ id: user._id, name: user.name }, JWT_SECRET, { expiresIn: "8h" });
    res.json({ message: "Login successful.", token, user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: "Login failed.", error: err.message });
  }
});

app.get("/api/me", authenticate, async (req, res) => {
  const user = await User.findById(req.user.id).select("name email");
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json({ user });
});

app.post("/api/attendance", authenticate, async (req, res) => {
  try {
    const { studentName, studentId, subject, date, status, notes } = req.body;
    if (!studentName || !studentId || !subject || !date || !status) {
      return res.status(400).json({ message: "Please complete all required attendance fields." });
    }
    const record = await Attendance.create({
      studentName, studentId, subject, date, status, notes: notes || "", createdBy: req.user.id
    });
    res.status(201).json({ message: "Attendance saved.", record });
  } catch (err) {
    res.status(400).json({ message: "Could not save attendance.", error: err.message });
  }
});

app.get("/api/attendance", authenticate, async (req, res) => {
  try {
    const records = await Attendance.find({ createdBy: req.user.id }).sort({ date: -1, createdAt: -1 });
    res.json({ records });
  } catch (err) {
    res.status(500).json({ message: "Could not retrieve attendance.", error: err.message });
  }
});

app.get("/api/attendance/:id", authenticate, async (req, res) => {
  try {
    const record = await Attendance.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!record) return res.status(404).json({ message: "Attendance record not found." });
    res.json({ record });
  } catch {
    res.status(400).json({ message: "Invalid attendance record ID." });
  }
});

app.delete("/api/attendance/:id", authenticate, async (req, res) => {
  try {
    const record = await Attendance.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
    if (!record) return res.status(404).json({ message: "Record not found." });
    res.json({ message: "Attendance record deleted." });
  } catch {
    res.status(400).json({ message: "Invalid attendance record ID." });
  }
});

app.get("/api/health", (req, res) => res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" }));

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

if (!JWT_SECRET) {
  console.error("JWT_SECRET is missing. Create a .env file using .env.example.");
  process.exit(1);
}

app.listen(PORT, () => console.log(`Smart Attendance Analyzer running on http://localhost:${PORT}`));
