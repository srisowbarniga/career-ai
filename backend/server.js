const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Groq = require("groq-sdk");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  await mongoose.connect(process.env.MONGO_URI);
};

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  profile: {
    grade: String,
    marks: String,
    subjects: String,
    interests: String,
    skills: String,
  },
  resume: {
    objective: String,
    education: String,
    skills: [String],
    interests: [String],
    projects: [String],
    template: String,
  },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => res.send("Backend is running!"));

app.post("/register", async (req, res) => {
  await connectDB();
  const { name, email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.json({ success: false, error: "Email already exists!" });
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed });
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ success: true, token, user: { name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/login", async (req, res) => {
  await connectDB();
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: false, error: "User not found!" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ success: false, error: "Wrong password!" });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ success: true, token, user: { name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/save-profile", async (req, res) => {
  await connectDB();
  const { token, profile } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await User.findByIdAndUpdate(decoded.id, { profile });
    res.json({ success: true, message: "Profile saved!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/save-resume", async (req, res) => {
  await connectDB();
  const { token, resume } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await User.findByIdAndUpdate(decoded.id, { resume });
    res.json({ success: true, message: "Resume saved!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/career-recommend", async (req, res) => {
  const { name, grade, subjects, interests, skills, marks } = req.body;
  const prompt = "You are a career guidance AI. Student name: " + name + ", grade: " + grade + ", marks: " + marks + ", subjects: " + subjects + ", interests: " + interests + ", skills: " + skills + ". Recommend top 3 careers with percentage match and reason. Format as JSON array with fields: career, match, reason";
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    });
    const text = completion.choices[0].message.content;
    res.json({ success: true, data: text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/career-roadmap", async (req, res) => {
  const { career, name, grade } = req.body;
  const prompt = "You are a career guidance AI. Create a career roadmap for a student named " + name + " in grade " + grade + " who wants to become a " + career + ". Give 5 steps with step name and time duration. Format as JSON array with fields: step, time";
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    });
    const text = completion.choices[0].message.content;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) res.json({ success: true, data: JSON.parse(jsonMatch[0]) });
    else res.json({ success: false, error: "Could not parse response" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/chatbot", async (req, res) => {
  const { message, name, grade } = req.body;
  const prompt = "You are a friendly career guidance counselor AI. Student name: " + name + ", grade: " + grade + ". Student asks: " + message + ". Give a helpful, encouraging and concise career guidance answer in 2-3 sentences.";
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    });
    res.json({ success: true, reply: completion.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/generate-resume", async (req, res) => {
  const { name, grade, marks, subjects, interests, skills } = req.body;
  const prompt = "Create a professional resume for a student. Return ONLY a JSON object with no extra text. Student: name=" + name + ", grade=" + grade + ", marks=" + marks + ", subjects=" + subjects + ", interests=" + interests + ", skills=" + skills + ". Return this exact JSON format: {\"objective\": \"string\", \"education\": \"string\", \"skills\": [\"skill1\", \"skill2\"], \"interests\": [\"interest1\"], \"projects\": [\"project1\"]}";
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    });
    const text = completion.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) res.json({ success: true, data: JSON.parse(jsonMatch[0]) });
    else res.json({ success: false, error: "Could not parse response" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/college-recommend", async (req, res) => {
  const { grade, marks, interests, state } = req.body;
  const prompt = "You are a college recommendation AI. Student grade: " + grade + ", marks: " + marks + ", interests: " + interests + ", state: " + state + ". Recommend top 5 colleges in India. Format as JSON array with fields: name, location, type, course, cutoff";
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    });
    const text = completion.choices[0].message.content;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) res.json({ success: true, data: JSON.parse(jsonMatch[0]) });
    else res.json({ success: false, error: "Could not parse" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/dashboard", async (req, res) => {
  await connectDB();
  const { token } = req.query;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/skill-gap", async (req, res) => {
  const { career, currentSkills, grade } = req.body;
  const prompt = "List 8 essential skills required to become a " + career + ". For each skill, check if the student already has it based on their current skills: " + currentSkills + ". Return ONLY a JSON array with fields: skill, description, hasSkill (true/false)";
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    });
    const text = completion.choices[0].message.content;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) res.json({ success: true, data: JSON.parse(jsonMatch[0]) });
    else res.json({ success: false, error: "Could not parse" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/exams", (req, res) => {
  try {
    const exams = [
      { name: "JEE Main", date: "January 2026", category: "Engineering", desc: "Joint Entrance Examination for NITs, IIITs" },
      { name: "JEE Advanced", date: "May 2026", category: "Engineering", desc: "For IIT admissions" },
      { name: "NEET", date: "May 2026", category: "Medical", desc: "National Eligibility cum Entrance Test for MBBS" },
      { name: "CUET", date: "May 2026", category: "University", desc: "Common University Entrance Test" },
      { name: "CLAT", date: "December 2025", category: "Law", desc: "Common Law Admission Test" },
      { name: "CAT", date: "November 2025", category: "MBA", desc: "Common Admission Test for IIMs" },
      { name: "GATE", date: "February 2026", category: "Engineering", desc: "Graduate Aptitude Test in Engineering" },
      { name: "NDA", date: "April 2026", category: "Defence", desc: "National Defence Academy Exam" },
      { name: "BITSAT", date: "May 2026", category: "Engineering", desc: "BITS Pilani entrance exam" },
      { name: "VITEEE", date: "April 2026", category: "Engineering", desc: "VIT Engineering Entrance Exam" },
    ];
    res.json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log("Server running on port 5000");
});