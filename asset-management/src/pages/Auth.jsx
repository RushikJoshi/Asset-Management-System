import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, registerUser } from "../store/slices/authSlice";
import { getRoleHome, ROLE_OPTIONS } from "../utils/permissions";
import "./Auth.css";

export function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: "", password: "" });

  const submit = async (event) => {
    event.preventDefault();
    const result = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(result)) {
      navigate(getRoleHome(result.payload.user.role), { replace: true });
    }
  };

  return (
    <AuthShell title="Login" subtitle="Use your GT AMS account to continue.">
      <form className="auth-form" onSubmit={submit}>
        <label>Email</label>
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <label>Password</label>
        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        {location.state?.message && <p className="auth-success">{location.state.message}</p>}
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? "Signing in..." : "Login"}</button>
        <p className="auth-link">New user? <Link to="/register">Register account</Link></p>
      </form>
    </AuthShell>
  );
}

export function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({
    name: "",
    email: "",
    employeeId: "",
    role: "EMPLOYEE",
    password: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");

  const submit = async (event) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      setPasswordError("Password and confirm password must match");
      return;
    }

    setPasswordError("");
    const payload = {
      name: form.name,
      email: form.email,
      employeeId: form.employeeId,
      role: form.role,
      password: form.password,
    };
    const result = await dispatch(registerUser(payload));

    if (registerUser.fulfilled.match(result)) {
      navigate("/login", {
        replace: true,
        state: { message: "Registration completed. Please login with your email and password." },
      });
    }
  };

  return (
    <AuthShell title="Register" subtitle="Create a role-based account for GT AMS.">
      <form className="auth-form" onSubmit={submit}>
        <label>Name</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <label>Email</label>
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <label>Employee ID</label>
        <input value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
        <label>Role</label>
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          {ROLE_OPTIONS.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
        </select>
        <label>Password</label>
        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
        <label>Confirm Password</label>
        <input
          type="password"
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          required
          minLength={6}
        />
        {passwordError && <p className="auth-error">{passwordError}</p>}
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Account"}</button>
        <p className="auth-link">Already registered? <Link to="/login">Login</Link></p>
      </form>
    </AuthShell>
  );
}

function AuthShell({ title, subtitle, children }) {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-brand">
          <span>GT AMS</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {children}
      </section>
    </main>
  );
}
