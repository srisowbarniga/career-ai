import { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [page, setPage] = useState("login");
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: "", grade: "", subjects: "", interests: "", skills: "", marks: "" });
  const [careers, setCareers] = useState([]);
  const [roadmap, setRoadmap] = useState([]);
  const [selectedCareer, setSelectedCareer] = useState("");
  const [loading, setLoading] = useState(false);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [messages, setMessages] = useState([{ role: "ai", text: "Hi! I'm your career guidance AI. Ask me anything about careers! 🎯" }]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [resume, setResume] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [editMode, setEditMode] = useState(false);
  const [editedResume, setEditedResume] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [collegeLoading, setCollegeLoading] = useState(false);
  const [state, setState] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [skillGap, setSkillGap] = useState([]);
  const [skillGapLoading, setSkillGapLoading] = useState(false);
  const [targetCareer, setTargetCareer] = useState("");
  const [exams, setExams] = useState([]);
  const [examFilter, setExamFilter] = useState("All");
  const [savedExams, setSavedExams] = useState([]);
  const [examError, setExamError] = useState("");

  // ✅ FIX: Auto-load exams when page changes to "exams"
  useEffect(() => {
    if (page === "exams") {
      loadExams();
    }
    if (page === "dashboard") {
      handleDashboard();
    }
  }, [page]);

  const handleAuthChange = (e) => setAuthForm({ ...authForm, [e.target.name]: e.target.value });

  const handleAuth = async () => {
    if (!authForm.email || !authForm.password) { alert("Please fill all fields!"); return; }
    try {
      const endpoint = isLogin ? "/login" : "/register";
      const res = await axios.post("http://localhost:5000" + endpoint, authForm);
      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        setUser(res.data.user);
        setPage("home");
      } else {
        alert(res.data.error);
      }
    } catch {
      alert("Error connecting to server!");
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/career-recommend", form);
      const raw = res.data.data;
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) { setCareers(JSON.parse(jsonMatch[0])); setPage("result"); }
      else alert("Could not parse results. Try again!");
    } catch { alert("Error connecting to backend!"); }
    setLoading(false);
  };

  const handleRoadmap = async (career) => {
    setSelectedCareer(career); setRoadmapLoading(true); setPage("roadmap");
    try {
      const res = await axios.post("http://localhost:5000/career-roadmap", { career, name: form.name, grade: form.grade });
      if (res.data.success) setRoadmap(res.data.data);
    } catch { alert("Error generating roadmap!"); }
    setRoadmapLoading(false);
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setChatLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/chatbot", { message: userMsg, name: form.name || user?.name, grade: form.grade });
      setMessages(prev => [...prev, { role: "ai", text: res.data.reply }]);
    } catch { setMessages(prev => [...prev, { role: "ai", text: "Sorry, I couldn't connect. Try again!" }]); }
    setChatLoading(false);
  };

  const handleResume = async () => {
    setResumeLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/generate-resume", form);
      if (res.data.success) {
        setResume(res.data.data);
        setEditedResume(res.data.data);
      } else alert("Could not generate resume. Try again!");
    } catch { alert("Error generating resume!"); }
    setResumeLoading(false);
  };

  const handleSaveResume = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/save-resume", { token, resume: editedResume });
      alert("Resume saved successfully! ✅");
    } catch { alert("Error saving resume!"); }
  };

  const handleCollege = async () => {
    setCollegeLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/college-recommend", { grade: form.grade, marks: form.marks, interests: form.interests, state });
      if (res.data.success) setColleges(res.data.data);
      else alert("Could not get colleges. Try again!");
    } catch { alert("Error getting colleges!"); }
    setCollegeLoading(false);
  };

  const handleDashboard = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/dashboard?token=" + token);
      if (res.data.success) setDashboard(res.data.user);
    } catch { alert("Error loading dashboard!"); }
  };

  const generateSkillGap = async () => {
    if (!targetCareer) { alert("Please enter a target career!"); return; }
    setSkillGapLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/skill-gap", {
        career: targetCareer,
        currentSkills: form.skills,
        grade: form.grade
      });
      if (res.data.success) setSkillGap(res.data.data);
      else alert("Could not analyze skills. Try again!");
    } catch { alert("Error analyzing skills!"); }
    setSkillGapLoading(false);
  };

  // ✅ FIX: loadExams now uses inline error state instead of alert()
  const loadExams = async () => {
    setExamError("");
    try {
      const res = await axios.get("http://localhost:5000/exams");
      if (res.data.success) {
        setExams(res.data.data);
      } else {
        setExamError("Could not load exams. Please try again.");
      }
    } catch (err) {
      console.error("Error loading exams:", err);
      setExamError("Could not connect to server. Make sure the backend is running on port 5000.");
    }
  };

  // ✅ FIX: navBtn no longer manually calls loadExams/handleDashboard (useEffect handles it)
  const navBtn = (label, pg) => (
    <button
      onClick={() => setPage(pg)}
      style={{
        background: page === pg ? "white" : "transparent",
        color: page === pg ? "#6366f1" : "white",
        border: "1px solid white",
        padding: "8px 16px",
        borderRadius: "20px",
        cursor: "pointer",
        fontWeight: "bold"
      }}
    >
      {label}
    </button>
  );

  const renderResume = (data, template) => {
    if (!data) return null;
    const skills = Array.isArray(data.skills) ? data.skills.join(", ") : data.skills;
    const interests = Array.isArray(data.interests) ? data.interests.join(", ") : data.interests;
    const projects = Array.isArray(data.projects) ? data.projects.join(", ") : data.projects;

    if (template === "modern") return (
      <div style={{ background: "white", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        <div style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", padding: "30px", color: "white" }}>
          <h1 style={{ margin: 0, fontSize: "28px" }}>{form.name}</h1>
          <p style={{ margin: "8px 0 0 0", opacity: 0.9 }}>{user?.email} | Grade: {form.grade}</p>
        </div>
        <div style={{ padding: "30px" }}>
          {[
            { title: "🎯 Objective", key: "objective", content: editMode ? editedResume?.objective : data.objective },
            { title: "🎓 Education", key: "education", content: editMode ? editedResume?.education : data.education },
            { title: "💡 Skills", key: "skills", content: editMode ? (Array.isArray(editedResume?.skills) ? editedResume?.skills.join(", ") : editedResume?.skills) : skills },
            { title: "❤️ Interests", key: "interests", content: editMode ? (Array.isArray(editedResume?.interests) ? editedResume?.interests.join(", ") : editedResume?.interests) : interests },
            { title: "🚀 Projects", key: "projects", content: editMode ? (Array.isArray(editedResume?.projects) ? editedResume?.projects.join(", ") : editedResume?.projects) : projects },
          ].map((s, i) => (
            <div key={i} style={{ marginBottom: "20px" }}>
              <h3 style={{ color: "#6366f1", borderLeft: "4px solid #6366f1", paddingLeft: "12px", margin: "0 0 8px 0" }}>{s.title}</h3>
              {editMode ? (
                <textarea value={s.content} onChange={(e) => setEditedResume({ ...editedResume, [s.key]: e.target.value })}
                  style={{ width: "95%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", minHeight: "60px" }} />
              ) : (
                <p style={{ color: "#555", margin: 0 }}>{s.content}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );

    if (template === "classic") return (
      <div style={{ background: "white", padding: "40px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", borderRadius: "8px", fontFamily: "Georgia, serif" }}>
        <div style={{ textAlign: "center", borderBottom: "2px solid #333", paddingBottom: "20px", marginBottom: "20px" }}>
          <h1 style={{ margin: 0, fontSize: "28px", color: "#333" }}>{form.name}</h1>
          <p style={{ color: "#666", margin: "8px 0 0 0" }}>{user?.email} | Grade: {form.grade}</p>
        </div>
        {[
          { title: "OBJECTIVE", key: "objective", content: editMode ? editedResume?.objective : data.objective },
          { title: "EDUCATION", key: "education", content: editMode ? editedResume?.education : data.education },
          { title: "SKILLS", key: "skills", content: editMode ? (Array.isArray(editedResume?.skills) ? editedResume?.skills.join(", ") : editedResume?.skills) : skills },
          { title: "INTERESTS", key: "interests", content: editMode ? (Array.isArray(editedResume?.interests) ? editedResume?.interests.join(", ") : editedResume?.interests) : interests },
          { title: "PROJECTS", key: "projects", content: editMode ? (Array.isArray(editedResume?.projects) ? editedResume?.projects.join(", ") : editedResume?.projects) : projects },
        ].map((s, i) => (
          <div key={i} style={{ marginBottom: "20px" }}>
            <h3 style={{ color: "#333", borderBottom: "1px solid #ccc", paddingBottom: "4px", letterSpacing: "2px", fontSize: "14px" }}>{s.title}</h3>
            {editMode ? (
              <textarea value={s.content} onChange={(e) => setEditedResume({ ...editedResume, [s.key]: e.target.value })}
                style={{ width: "95%", padding: "10px", borderRadius: "4px", border: "1px solid #ddd", fontSize: "14px", minHeight: "60px", fontFamily: "Georgia, serif" }} />
            ) : (
              <p style={{ color: "#555", margin: 0 }}>{s.content}</p>
            )}
          </div>
        ))}
      </div>
    );

    if (template === "minimal") return (
      <div style={{ background: "white", padding: "40px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", borderRadius: "8px" }}>
        <div style={{ marginBottom: "30px" }}>
          <h1 style={{ margin: 0, fontSize: "32px", color: "#111" }}>{form.name}</h1>
          <p style={{ color: "#999", margin: "4px 0 0 0", fontSize: "14px" }}>{user?.email} · Grade: {form.grade}</p>
        </div>
        {[
          { title: "Objective", key: "objective", content: editMode ? editedResume?.objective : data.objective },
          { title: "Education", key: "education", content: editMode ? editedResume?.education : data.education },
          { title: "Skills", key: "skills", content: editMode ? (Array.isArray(editedResume?.skills) ? editedResume?.skills.join(", ") : editedResume?.skills) : skills },
          { title: "Interests", key: "interests", content: editMode ? (Array.isArray(editedResume?.interests) ? editedResume?.interests.join(", ") : editedResume?.interests) : interests },
          { title: "Projects", key: "projects", content: editMode ? (Array.isArray(editedResume?.projects) ? editedResume?.projects.join(", ") : editedResume?.projects) : projects },
        ].map((s, i) => (
          <div key={i} style={{ marginBottom: "24px" }}>
            <h3 style={{ color: "#111", margin: "0 0 4px 0", fontSize: "12px", textTransform: "uppercase", letterSpacing: "3px" }}>{s.title}</h3>
            <div style={{ height: "1px", background: "#eee", marginBottom: "8px" }}></div>
            {editMode ? (
              <textarea value={s.content} onChange={(e) => setEditedResume({ ...editedResume, [s.key]: e.target.value })}
                style={{ width: "95%", padding: "10px", borderRadius: "4px", border: "1px solid #eee", fontSize: "14px", minHeight: "60px" }} />
            ) : (
              <p style={{ color: "#555", margin: 0, fontSize: "15px" }}>{s.content}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "Arial", minHeight: "100vh", background: "#f5f3ff" }}>

      {page !== "login" && (
        <nav style={{ background: "#6366f1", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <h2 style={{ color: "white", margin: 0 }}>🎯 CareerAI</h2>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            {navBtn("🏠 Home", "home")}
            {navBtn("📋 Profile", "profile")}
            {navBtn("💬 Chatbot", "chatbot")}
            {navBtn("📄 Resume", "resume")}
            {navBtn("🏫 Colleges", "colleges")}
            {navBtn("📊 Dashboard", "dashboard")}
            {navBtn("🎯 Skill Gap", "skillgap")}
            {navBtn("📅 Exams", "exams")}
            <span style={{ color: "white" }}>👋 {user?.name}</span>
            <button onClick={() => { setUser(null); setPage("login"); }} style={{ background: "transparent", color: "white", border: "1px solid white", padding: "8px 16px", borderRadius: "20px", cursor: "pointer" }}>Logout</button>
          </div>
        </nav>
      )}

      {/* Login Page */}
      {page === "login" && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
          <div style={{ background: "white", padding: "40px", borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", width: "380px" }}>
            <h2 style={{ color: "#6366f1", textAlign: "center", marginBottom: "8px" }}>🎯 CareerAI</h2>
            <p style={{ textAlign: "center", color: "#888", marginBottom: "30px" }}>AI-powered career guidance</p>
            <div style={{ display: "flex", marginBottom: "24px", background: "#f5f3ff", borderRadius: "10px", padding: "4px" }}>
              <button onClick={() => setIsLogin(true)} style={{ flex: 1, padding: "10px", border: "none", borderRadius: "8px", cursor: "pointer", background: isLogin ? "#6366f1" : "transparent", color: isLogin ? "white" : "#666", fontWeight: "bold" }}>Login</button>
              <button onClick={() => setIsLogin(false)} style={{ flex: 1, padding: "10px", border: "none", borderRadius: "8px", cursor: "pointer", background: !isLogin ? "#6366f1" : "transparent", color: !isLogin ? "white" : "#666", fontWeight: "bold" }}>Register</button>
            </div>
            {!isLogin && <input name="name" placeholder="Full Name" value={authForm.name} onChange={handleAuthChange} style={{ display: "block", width: "93%", padding: "14px", margin: "10px 0", borderRadius: "10px", border: "1px solid #ddd", fontSize: "16px" }} />}
            <input name="email" placeholder="Email" value={authForm.email} onChange={handleAuthChange} style={{ display: "block", width: "93%", padding: "14px", margin: "10px 0", borderRadius: "10px", border: "1px solid #ddd", fontSize: "16px" }} />
            <input name="password" type="password" placeholder="Password" value={authForm.password} onChange={handleAuthChange} style={{ display: "block", width: "93%", padding: "14px", margin: "10px 0", borderRadius: "10px", border: "1px solid #ddd", fontSize: "16px" }} />
            <button onClick={handleAuth} style={{ background: "#6366f1", color: "white", padding: "14px", width: "100%", border: "none", borderRadius: "10px", fontSize: "18px", cursor: "pointer", marginTop: "10px" }}>
              {isLogin ? "Login 🚀" : "Register 🚀"}
            </button>
          </div>
        </div>
      )}

      {/* Home Page */}
      {page === "home" && (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <h1 style={{ fontSize: "48px", color: "#6366f1", marginBottom: "16px" }}>Find Your Perfect Career! 🚀</h1>
          <p style={{ fontSize: "20px", color: "#666", marginBottom: "40px" }}>AI-powered career guidance for students</p>
          <button onClick={() => setPage("profile")} style={{ background: "#6366f1", color: "white", padding: "16px 40px", borderRadius: "30px", border: "none", fontSize: "18px", cursor: "pointer" }}>Get Started →</button>
          <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginTop: "60px", flexWrap: "wrap" }}>
            {[
              { icon: "🤖", title: "AI Recommendations", desc: "Get personalized career suggestions" },
              { icon: "🗺️", title: "Career Roadmap", desc: "Step by step path to your dream career" },
              { icon: "💬", title: "AI Chatbot", desc: "Ask anything about careers!" },
              { icon: "📄", title: "Resume Generator", desc: "Create professional resume instantly" },
              { icon: "🏫", title: "College Finder", desc: "Find best colleges for you!" },
              { icon: "🎯", title: "Skill Gap Analysis", desc: "Find missing skills for your career!" },
              { icon: "📅", title: "Exam Tracker", desc: "Track important exam dates!" },
            ].map((f, i) => (
              <div key={i} style={{ background: "white", padding: "24px", borderRadius: "16px", width: "180px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                <div style={{ fontSize: "40px" }}>{f.icon}</div>
                <h3 style={{ color: "#6366f1" }}>{f.title}</h3>
                <p style={{ color: "#666", fontSize: "14px" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile Form */}
      {page === "profile" && (
        <div style={{ maxWidth: "600px", margin: "40px auto", background: "white", padding: "40px", borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <h2 style={{ color: "#6366f1", marginBottom: "24px" }}>📋 Student Profile</h2>
          {[
            { name: "name", placeholder: "Your Full Name" },
            { name: "grade", placeholder: "Your Grade (e.g. 12th Science)" },
            { name: "marks", placeholder: "Your Marks/Percentage (e.g. 85%)" },
            { name: "subjects", placeholder: "Strong Subjects (e.g. Math, Physics)" },
            { name: "interests", placeholder: "Your Interests (e.g. Coding, Design)" },
            { name: "skills", placeholder: "Your Skills (e.g. Python, Drawing)" },
          ].map((field) => (
            <input key={field.name} name={field.name} placeholder={field.placeholder} value={form[field.name]} onChange={handleChange}
              style={{ display: "block", width: "93%", padding: "14px", margin: "10px 0", borderRadius: "10px", border: "1px solid #ddd", fontSize: "16px" }} />
          ))}
          <button onClick={handleSubmit} disabled={loading}
            style={{ background: "#6366f1", color: "white", padding: "14px", width: "100%", border: "none", borderRadius: "10px", fontSize: "18px", cursor: "pointer", marginTop: "10px" }}>
            {loading ? "⏳ Finding Careers..." : "Get Career Recommendations 🚀"}
          </button>
        </div>
      )}

      {/* Result Page */}
      {page === "result" && (
        <div style={{ maxWidth: "700px", margin: "40px auto", padding: "20px" }}>
          <h2 style={{ color: "#6366f1", textAlign: "center", marginBottom: "30px" }}>🎯 Your Career Recommendations</h2>
          {careers.map((c, i) => (
            <div key={i} style={{ background: "white", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ color: "#6366f1", margin: 0, fontSize: "22px" }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"} {c.career}</h3>
                <span style={{ background: "#6366f1", color: "white", padding: "6px 16px", borderRadius: "20px", fontWeight: "bold" }}>{c.match}% match</span>
              </div>
              <div style={{ background: "#f0f0ff", borderRadius: "10px", height: "10px", margin: "16px 0" }}>
                <div style={{ background: "#6366f1", height: "10px", borderRadius: "10px", width: c.match + "%" }}></div>
              </div>
              <p style={{ color: "#555", margin: "0 0 16px 0" }}>{c.reason}</p>
              <button onClick={() => handleRoadmap(c.career)} style={{ background: "#10b981", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}>
                View Roadmap 🗺️
              </button>
            </div>
          ))}
          <button onClick={() => setPage("profile")} style={{ background: "#6366f1", color: "white", padding: "12px 24px", border: "none", borderRadius: "10px", fontSize: "16px", cursor: "pointer" }}>← Try Again</button>
        </div>
      )}

      {/* Roadmap Page */}
      {page === "roadmap" && (
        <div style={{ maxWidth: "600px", margin: "40px auto", padding: "20px" }}>
          <h2 style={{ color: "#6366f1", textAlign: "center" }}>🗺️ Roadmap for {selectedCareer}</h2>
          {roadmapLoading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#6366f1", fontSize: "18px" }}>⏳ AI is generating your roadmap...</div>
          ) : (
            roadmap.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
                <div style={{ background: "#6366f1", color: "white", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", flexShrink: 0 }}>{i + 1}</div>
                <div style={{ marginLeft: "16px", background: "white", padding: "16px", borderRadius: "12px", flex: 1, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                  <div style={{ fontWeight: "bold", color: "#333" }}>{r.step}</div>
                  <div style={{ color: "#888", fontSize: "14px" }}>⏱️ {r.time}</div>
                </div>
              </div>
            ))
          )}
          <button onClick={() => setPage("result")} style={{ background: "#6366f1", color: "white", padding: "12px 24px", border: "none", borderRadius: "10px", fontSize: "16px", cursor: "pointer" }}>← Back to Results</button>
        </div>
      )}

      {/* Chatbot Page */}
      {page === "chatbot" && (
        <div style={{ maxWidth: "700px", margin: "40px auto", padding: "20px" }}>
          <h2 style={{ color: "#6366f1", textAlign: "center", marginBottom: "20px" }}>💬 AI Career Counselor</h2>
          <div style={{ background: "white", borderRadius: "16px", padding: "20px", height: "400px", overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", marginBottom: "16px" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: "16px" }}>
                <div style={{ background: m.role === "user" ? "#6366f1" : "#f0f0ff", color: m.role === "user" ? "white" : "#333", padding: "12px 16px", borderRadius: m.role === "user" ? "16px 16px 0 16px" : "16px 16px 16px 0", maxWidth: "70%", fontSize: "15px" }}>
                  {m.role === "ai" && <span style={{ fontWeight: "bold", color: "#6366f1" }}>🤖 AI: </span>}
                  {m.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "16px" }}>
                <div style={{ background: "#f0f0ff", padding: "12px 16px", borderRadius: "16px 16px 16px 0", color: "#6366f1" }}>⏳ Thinking...</div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === "Enter" && handleChat()}
              placeholder="Ask me anything about careers..."
              style={{ flex: 1, padding: "14px", borderRadius: "10px", border: "1px solid #ddd", fontSize: "16px" }} />
            <button onClick={handleChat} style={{ background: "#6366f1", color: "white", padding: "14px 24px", border: "none", borderRadius: "10px", fontSize: "16px", cursor: "pointer" }}>Send 🚀</button>
          </div>
        </div>
      )}

      {/* Resume Page */}
      {page === "resume" && (
        <div style={{ maxWidth: "800px", margin: "40px auto", padding: "20px" }}>
          <h2 style={{ color: "#6366f1", textAlign: "center", marginBottom: "20px" }}>📄 Resume Generator</h2>
          <div style={{ display: "flex", gap: "12px", marginBottom: "24px", justifyContent: "center" }}>
            {["modern", "classic", "minimal"].map((t) => (
              <button key={t} onClick={() => setSelectedTemplate(t)}
                style={{ background: selectedTemplate === t ? "#6366f1" : "white", color: selectedTemplate === t ? "white" : "#6366f1", border: "2px solid #6366f1", padding: "10px 24px", borderRadius: "20px", cursor: "pointer", fontWeight: "bold", textTransform: "capitalize" }}>
                {t === "modern" ? "🎨 Modern" : t === "classic" ? "📋 Classic" : "✨ Minimal"}
              </button>
            ))}
          </div>
          {!resume ? (
            <div style={{ background: "white", padding: "40px", borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", textAlign: "center" }}>
              <p style={{ color: "#666", fontSize: "18px", marginBottom: "24px" }}>Generate a professional resume based on your profile!</p>
              {!form.name && <p style={{ color: "red" }}>⚠️ Please fill your profile first!</p>}
              <button onClick={handleResume} disabled={resumeLoading || !form.name}
                style={{ background: "#6366f1", color: "white", padding: "14px 40px", border: "none", borderRadius: "10px", fontSize: "18px", cursor: "pointer" }}>
                {resumeLoading ? "⏳ Generating Resume..." : "Generate Resume 📄"}
              </button>
            </div>
          ) : (
            <div>
              {renderResume(editMode ? editedResume : resume, selectedTemplate)}
              <div style={{ display: "flex", gap: "12px", marginTop: "20px", flexWrap: "wrap" }}>
                <button onClick={() => setEditMode(!editMode)}
                  style={{ background: editMode ? "#10b981" : "#f59e0b", color: "white", padding: "12px 24px", border: "none", borderRadius: "10px", fontSize: "16px", cursor: "pointer" }}>
                  {editMode ? "✅ Done Editing" : "✏️ Edit Resume"}
                </button>
                <button onClick={handleSaveResume}
                  style={{ background: "#6366f1", color: "white", padding: "12px 24px", border: "none", borderRadius: "10px", fontSize: "16px", cursor: "pointer" }}>
                  💾 Save Resume
                </button>
                <button onClick={() => window.print()}
                  style={{ background: "#333", color: "white", padding: "12px 24px", border: "none", borderRadius: "10px", fontSize: "16px", cursor: "pointer" }}>
                  🖨️ Print / PDF
                </button>
                <button onClick={() => { setResume(null); setEditMode(false); }}
                  style={{ background: "#ef4444", color: "white", padding: "12px 24px", border: "none", borderRadius: "10px", fontSize: "16px", cursor: "pointer" }}>
                  🔄 Regenerate
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Colleges Page */}
      {page === "colleges" && (
        <div style={{ maxWidth: "700px", margin: "40px auto", padding: "20px" }}>
          <h2 style={{ color: "#6366f1", textAlign: "center", marginBottom: "20px" }}>🏫 College Recommendations</h2>
          <div style={{ background: "white", padding: "30px", borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
            <input value={state} onChange={(e) => setState(e.target.value)} placeholder="Enter your state (e.g. Tamil Nadu)"
              style={{ display: "block", width: "93%", padding: "14px", margin: "10px 0", borderRadius: "10px", border: "1px solid #ddd", fontSize: "16px" }} />
            <button onClick={handleCollege} disabled={collegeLoading}
              style={{ background: "#6366f1", color: "white", padding: "14px", width: "100%", border: "none", borderRadius: "10px", fontSize: "18px", cursor: "pointer", marginTop: "10px" }}>
              {collegeLoading ? "⏳ Finding Colleges..." : "Find Colleges 🏫"}
            </button>
          </div>
          {colleges.map((c, i) => (
            <div key={i} style={{ background: "white", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ color: "#6366f1", margin: 0 }}>🏫 {c.name}</h3>
                <span style={{ background: c.type === "Government" ? "#10b981" : "#6366f1", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "14px" }}>{c.type}</span>
              </div>
              <p style={{ color: "#666", margin: "8px 0" }}>📍 {c.location}</p>
              <p style={{ color: "#555", margin: "4px 0" }}>📚 Course: {c.course}</p>
              <p style={{ color: "#555", margin: "4px 0" }}>✂️ Cutoff: {c.cutoff}</p>
            </div>
          ))}
        </div>
      )}

      {/* Dashboard Page */}
      {page === "dashboard" && (
        <div style={{ maxWidth: "800px", margin: "40px auto", padding: "20px" }}>
          <h2 style={{ color: "#6366f1", textAlign: "center", marginBottom: "30px" }}>📊 My Dashboard</h2>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "30px" }}>
            {[
              { icon: "👤", title: "Name", value: user?.name },
              { icon: "📧", title: "Email", value: user?.email },
              { icon: "🎓", title: "Grade", value: form.grade || "Not set" },
              { icon: "📊", title: "Marks", value: form.marks || "Not set" },
            ].map((s, i) => (
              <div key={i} style={{ background: "white", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", flex: "1", minWidth: "160px", textAlign: "center" }}>
                <div style={{ fontSize: "32px" }}>{s.icon}</div>
                <div style={{ color: "#888", fontSize: "14px", marginTop: "8px" }}>{s.title}</div>
                <div style={{ color: "#6366f1", fontWeight: "bold", fontSize: "16px", marginTop: "4px" }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {[
              { icon: "🤖", title: "Career Recommendations", desc: "Get AI career suggestions", pg: "profile" },
              { icon: "🗺️", title: "Career Roadmap", desc: "View your career path", pg: "result" },
              { icon: "💬", title: "AI Chatbot", desc: "Ask career questions", pg: "chatbot" },
              { icon: "📄", title: "Resume Generator", desc: "Create your resume", pg: "resume" },
              { icon: "🏫", title: "College Finder", desc: "Find best colleges", pg: "colleges" },
              { icon: "🎯", title: "Skill Gap Analysis", desc: "Find missing skills", pg: "skillgap" },
              { icon: "📅", title: "Exam Tracker", desc: "Track exam dates", pg: "exams" },
            ].map((f, i) => (
              <div key={i} style={{ background: "white", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                <div style={{ fontSize: "32px" }}>{f.icon}</div>
                <h3 style={{ color: "#6366f1", margin: "8px 0 4px 0" }}>{f.title}</h3>
                <p style={{ color: "#888", fontSize: "14px", margin: "0 0 12px 0" }}>{f.desc}</p>
                <button onClick={() => setPage(f.pg)} style={{ background: "#6366f1", color: "white", padding: "8px 20px", border: "none", borderRadius: "8px", cursor: "pointer" }}>Go →</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skill Gap Page */}
      {page === "skillgap" && (
        <div style={{ maxWidth: "700px", margin: "40px auto", padding: "20px" }}>
          <h2 style={{ color: "#6366f1", textAlign: "center", marginBottom: "20px" }}>🎯 Skill Gap Analysis</h2>
          <div style={{ background: "white", padding: "30px", borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", marginBottom: "20px" }}>
            <input value={targetCareer} onChange={(e) => setTargetCareer(e.target.value)}
              placeholder="Enter target career (e.g. Data Scientist)"
              style={{ display: "block", width: "93%", padding: "14px", margin: "10px 0", borderRadius: "10px", border: "1px solid #ddd", fontSize: "16px" }} />
            <button onClick={generateSkillGap} disabled={skillGapLoading}
              style={{ background: "#6366f1", color: "white", padding: "14px", width: "100%", border: "none", borderRadius: "10px", fontSize: "18px", cursor: "pointer", marginTop: "10px" }}>
              {skillGapLoading ? "⏳ Analyzing Skills..." : "Analyze Skill Gap 🎯"}
            </button>
          </div>
          {skillGap.length > 0 && (
            <div>
              <h3 style={{ color: "#6366f1", marginBottom: "16px" }}>Results for: {targetCareer}</h3>
              {skillGap.map((s, i) => (
                <div key={i} style={{ background: "white", padding: "16px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "bold", color: "#333" }}>{s.skill}</div>
                    <div style={{ color: "#888", fontSize: "14px" }}>{s.description}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                    <span style={{ fontSize: "24px" }}>{s.hasSkill ? "✅" : "❌"}</span>
                    <span style={{ fontSize: "12px", color: s.hasSkill ? "#10b981" : "#ef4444" }}>{s.hasSkill ? "Have it" : "Missing"}</span>
                  </div>
                </div>
              ))}
              <div style={{ background: "#f0f0ff", padding: "16px", borderRadius: "12px", marginTop: "16px" }}>
                <p style={{ color: "#6366f1", fontWeight: "bold", margin: 0 }}>
                  ✅ You have {skillGap.filter(s => s.hasSkill).length} out of {skillGap.length} required skills!
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ✅ FIXED Exam Tracker Page */}
      {page === "exams" && (
        <div style={{ maxWidth: "800px", margin: "40px auto", padding: "20px" }}>
          <h2 style={{ color: "#6366f1", textAlign: "center", marginBottom: "20px" }}>📅 Exam Tracker</h2>

          {/* ✅ Show inline error instead of alert */}
          {examError && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#ef4444" }}>⚠️ {examError}</span>
              <button onClick={loadExams} style={{ background: "#ef4444", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>Retry</button>
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap", justifyContent: "center" }}>
            {["All", "Engineering", "Medical", "Law", "MBA", "Defence", "University"].map((cat) => (
              <button key={cat} onClick={() => setExamFilter(cat)}
                style={{ background: examFilter === cat ? "#6366f1" : "white", color: examFilter === cat ? "white" : "#6366f1", border: "2px solid #6366f1", padding: "8px 16px", borderRadius: "20px", cursor: "pointer", fontWeight: "bold" }}>
                {cat}
              </button>
            ))}
          </div>

          {/* ✅ Loading state while exams fetch */}
          {exams.length === 0 && !examError && (
            <div style={{ textAlign: "center", padding: "40px", color: "#6366f1", fontSize: "18px" }}>
              ⏳ Loading exams...
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {exams.filter(e => examFilter === "All" || e.category === examFilter).map((e, i) => (
              <div key={i} style={{ background: "white", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ color: "#6366f1", margin: 0 }}>{e.name}</h3>
                  <span style={{ background: "#f0f0ff", color: "#6366f1", padding: "4px 10px", borderRadius: "12px", fontSize: "12px" }}>{e.category}</span>
                </div>
                <p style={{ color: "#888", margin: "8px 0 4px 0", fontSize: "14px" }}>📅 {e.date}</p>
                <p style={{ color: "#555", margin: "0 0 12px 0", fontSize: "14px" }}>{e.desc}</p>
                <button onClick={() => {
                  if (savedExams.includes(e.name)) {
                    setSavedExams(savedExams.filter(s => s !== e.name));
                  } else {
                    setSavedExams([...savedExams, e.name]);
                  }
                }} style={{ background: savedExams.includes(e.name) ? "#10b981" : "#6366f1", color: "white", padding: "8px 16px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}>
                  {savedExams.includes(e.name) ? "✅ Saved" : "🔔 Save Exam"}
                </button>
              </div>
            ))}
          </div>

          {savedExams.length > 0 && (
            <div style={{ background: "white", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", marginTop: "24px" }}>
              <h3 style={{ color: "#6366f1", margin: "0 0 12px 0" }}>🔔 My Saved Exams</h3>
              {savedExams.map((s, i) => (
                <span key={i} style={{ background: "#f0f0ff", color: "#6366f1", padding: "6px 14px", borderRadius: "20px", margin: "4px", display: "inline-block", fontSize: "14px" }}>
                  📅 {s}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default App;
