import { useState } from "react";

import {
  useVerifySensitiveCode,
  useRequestSensitiveCode,
} from "../services/api";
import { useAuthStore } from "../services/authStore";
import { useShallow } from "zustand/react/shallow";

interface SensitiveInfoProps {
  children: React.ReactNode;
}

export default function SensitiveInfo({ children }: SensitiveInfoProps) {
  const sensitiveAuthToken = useAuthStore(
    useShallow(s => s.sensitiveAuthToken)
  );
  const [code, setCode] = useState("");
  const verifyCode = useVerifySensitiveCode(code);
  const requestCode = useRequestSensitiveCode();

  if (sensitiveAuthToken || verifyCode.isSuccess) {
    return children;
  }

  return (
    <div className="section">
      <div className="section-header">
        <h3>Sensitive Information - {requestCode.isSuccess ? "Verify Code" : "Request Code"}</h3>
      </div>

      {requestCode.isSuccess && (
        <div className="form-group">
          <label htmlFor="code">Code:</label>
          <input
            type="text"
            id="code"
            value={code}
            disabled={verifyCode.isLoading}
            onChange={e => setCode(e.target.value)}
            placeholder="Enter code"
          />
          {verifyCode.isError && (
            <div className="error">{verifyCode.error?.message}</div>
          )}
        </div>
      )}
      <div className="button-group">
        <button
          className="btn btn-primary"
          onClick={() => requestCode.mutate()}
          disabled={requestCode.isPending}
        >
          {requestCode.isPending ? "Requesting..." : "Request Code"}
        </button>
        {requestCode.isError && (
          <div className="error">{requestCode.error?.message}</div>
        )}
      </div>
    </div>
  );
}
