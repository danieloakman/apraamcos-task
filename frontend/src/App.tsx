import React, { useState, useEffect } from "react";
import UserProfile from "./components/UserProfile";
import Login from "./components/Login";
import { useLogout, useCurrentUser, isAuthenticated } from "./services/api";
import "./styles/App.css";

const App: React.FC = () => {
  const currentUser = useCurrentUser();
  const logout = useLogout();

  if (currentUser.isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => {}} />;
  }

  return (
    <div className="container">
      <header className="header">
        <h1>My Account</h1>
        <p>Manage your account information and preferences</p>
        <button
          className="btn btn-secondary logout-btn"
          onClick={() => logout.mutateAsync()}
        >
          Logout
        </button>
      </header>
      <UserProfile />
    </div>
  );
};

export default App;
