import React, { useState } from "react";
import { useLogin } from "../services/api";

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // const [error, setError] = useState<string | null>(null);
  // const [loading, setLoading] = useState(false);
  const { mutateAsync: login, isPending: loading, error } = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await login({ email, password });
    onLogin();
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Login to Your Account</h2>

        {error && (
          <div className="error">
            {error instanceof Error ? error.message : "Login failed"}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="login-help">
          <p>Test accounts:</p>
          <ul>
            <li>Email: john.doe@example.com | Password: password123</li>
            <li>Email: jane.smith@example.com | Password: password123</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;
