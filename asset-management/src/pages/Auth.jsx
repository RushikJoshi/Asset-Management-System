import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, registerUser } from "../store/slices/authSlice";
import { getRoleHome, ROLE_OPTIONS } from "../utils/permissions";
import { fetchRoles, rolesToOptions } from "../utils/roleApi";
import { useToast } from "../components/toast/toastStore";
import "./Auth.css";

export function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (location.state?.message) {
      showToast({
        title: "Registration Success",
        message: location.state.message,
        type: "success",
      });
      // Preserve any existing redirect destination while clearing the toast message
      const preservedState = location.state.from ? { from: location.state.from } : {};
      navigate(location.pathname, { replace: true, state: preservedState });
    }
  }, [location.state, navigate, location.pathname, showToast]);

  const submit = async (event) => {
    event.preventDefault();
    const newErrors = {};

    if (!form.email.trim()) {
      newErrors.email = "Email or username is required";
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
      const redirectFrom = location.state?.from;
      const redirectPath = redirectFrom
        ? `${redirectFrom.pathname || "/"}${redirectFrom.search || ""}${redirectFrom.hash || ""}`
        : getRoleHome(result.payload.user.role);
      navigate(redirectPath, { replace: true });
    }
  };

  return (
    <AuthSplitShell title="Login" subtitle="Use your GT AMS account to continue.">
      <form className="auth-form" onSubmit={submit} noValidate>
        <label>Email or Username</label>
        <input
          type="text"
          value={form.email}
          onChange={(e) => {
            setForm({ ...form, email: e.target.value });
            if (errors.email) setErrors({ ...errors, email: "" });
          }}
          className={errors.email ? "input-error-border" : ""}
        />
        {errors.email && <span className="field-error">{errors.email}</span>}

        <label>Password</label>
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

        {error && <p className="auth-error">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? "Signing in..." : "Login"}</button>
        <p className="auth-link">New user? <Link to="/register">Register account</Link></p>
      </form>
    </AuthSplitShell>
  );
}

export function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [roleOptions, setRoleOptions] = useState(ROLE_OPTIONS);
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    employeeId: "",
    role: "EMPLOYEE",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchRoles().then((roles) => {
      const options = rolesToOptions(roles);
      if (options.length) setRoleOptions(options);
    });
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!form.username.trim()) {
      newErrors.username = "Username is required";
    } else if (!/^[a-zA-Z0-9_]{3,30}$/.test(form.username.trim())) {
      newErrors.username = "Username must be 3-30 characters (letters, numbers, underscore only)";
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
      username: form.username.trim(),
      email: form.email,
      employeeId: form.employeeId,
      role: form.role,
      password: form.password,
    };
    const result = await dispatch(registerUser(payload));

    if (registerUser.fulfilled.match(result)) {
      navigate("/login", {
        replace: true,
        state: { message: "Registration completed. Please login with your email/username and password." },
      });
    }
  };

  return (
    <AuthSplitShell title="Register" subtitle="Create a role-based account for GT AMS.">
      <form className="auth-form" onSubmit={submit} noValidate>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label>Name</label>
            <input
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: "" });
              }}
              className={errors.name ? "input-error-border" : ""}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label>Username</label>
            <input
              value={form.username}
              onChange={(e) => {
                setForm({ ...form, username: e.target.value });
                if (errors.username) setErrors({ ...errors, username: "" });
              }}
              className={errors.username ? "input-error-border" : ""}
            />
            {errors.username && <span className="field-error">{errors.username}</span>}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label>Email</label>
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
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label>Employee ID</label>
            <input
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label>Role</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {roleOptions.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label>Password</label>
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
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label>Confirm Password</label>
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
          </div>
        </div>

        {error && <p className="auth-error">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Account"}</button>
        <p className="auth-link">Already registered? <Link to="/login">Login</Link></p>
      </form>
    </AuthSplitShell>
  );
}

function AuthSplitShell({ title, subtitle, children }) {
  return (
    <div className="auth-split-wrapper">
      
      {/* Left Pane: White background with Logo and Title */}
      <div className="auth-left-pane">
        <div className="auth-left-content">
          <img 
            src="/logo.png" 
            alt="Gitakshmi logo" 
            className="auth-logo-img"
          />
          <h1 className="auth-left-title">Asset Management System</h1>
          <p className="auth-left-subtitle">
            Streamline your team's assets, lifecycles, specifications, and workflows with secure tracking and real-time management.
          </p>
        </div>
      </div>

      {/* Right Pane: Vibrant Blue background containing the clean white login card */}
      <div className="auth-right-pane">
        <div className="auth-card" style={{ maxWidth: title === "Register" ? "560px" : "440px" }}>
          <div className="auth-card-header">
            <h2 className="auth-card-title">
              {title === "Login" ? "Welcome Back!!" : title}
            </h2>
            <p className="auth-card-subtitle">
              {title === "Login" ? "Sign in with your email and password" : subtitle}
            </p>
          </div>
          {children}
        </div>
      </div>

    </div>
  );
}

function AuthClassicShell({ title, subtitle, children }) {
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
