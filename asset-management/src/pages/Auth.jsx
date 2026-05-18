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
  const [errors, setErrors] = useState({});

  const submit = async (event) => {
    event.preventDefault();
    const newErrors = {};

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    }
    if (!form.password) {
      newErrors.password = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    const result = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(result)) {
      navigate(getRoleHome(result.payload.user.role), { replace: true });
    }
  };

  return (
    <AuthShell title="Login" subtitle="Use your GT AMS account to continue.">
      <form className="auth-form" onSubmit={submit} noValidate>
        <label>Email <span className="required">*</span></label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => {
            setForm({ ...form, email: e.target.value });
            if (errors.email) setErrors({ ...errors, email: "" });
          }}
          className={errors.email ? "input-error-border" : ""}
        />
        {errors.email && <span className="field-error">{errors.email}</span>}

        <label>Password <span className="required">*</span></label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => {
            setForm({ ...form, password: e.target.value });
            if (errors.password) setErrors({ ...errors, password: "" });
          }}
          className={errors.password ? "input-error-border" : ""}
        />
        {errors.password && <span className="field-error">{errors.password}</span>}

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
  const [errors, setErrors] = useState({});

  const submit = async (event) => {
    event.preventDefault();
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Password and confirm password must match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
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
      <form className="auth-form" onSubmit={submit} noValidate>
        <label>Name <span className="required">*</span></label>
        <input
          value={form.name}
          onChange={(e) => {
            setForm({ ...form, name: e.target.value });
            if (errors.name) setErrors({ ...errors, name: "" });
          }}
          className={errors.name ? "input-error-border" : ""}
        />
        {errors.name && <span className="field-error">{errors.name}</span>}

        <label>Email <span className="required">*</span></label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => {
            setForm({ ...form, email: e.target.value });
            if (errors.email) setErrors({ ...errors, email: "" });
          }}
          className={errors.email ? "input-error-border" : ""}
        />
        {errors.email && <span className="field-error">{errors.email}</span>}

        <label>Employee ID</label>
        <input
          value={form.employeeId}
          onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
        />

        <label>Role</label>
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          {ROLE_OPTIONS.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
        </select>

        <label>Password <span className="required">*</span></label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => {
            setForm({ ...form, password: e.target.value });
            if (errors.password) setErrors({ ...errors, password: "" });
          }}
          className={errors.password ? "input-error-border" : ""}
        />
        {errors.password && <span className="field-error">{errors.password}</span>}

        <label>Confirm Password <span className="required">*</span></label>
        <input
          type="password"
          value={form.confirmPassword}
          onChange={(e) => {
            setForm({ ...form, confirmPassword: e.target.value });
            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
          }}
          className={errors.confirmPassword ? "input-error-border" : ""}
        />
        {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}

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
