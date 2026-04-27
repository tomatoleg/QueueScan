import { useState, useEffect } from "react";
import { config } from "../config";
import { useAuthStore } from "../store/useAuthStore";

export default function Login() {
  const login = useAuthStore((s) => s.login);

  const [username, setUsername] = useState("guest");
  const [password, setPassword] = useState("guest");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const autoGuestLogin = async () => {
     try {
       const res = await fetch(`${config.backendUrl}/login`, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           username: "guest",
           password: "guest",
         }),
       });

       if (!res.ok) return;
   
       const data = await res.json();
   
       login(data.access_token, "guest");
   
       window.location.reload();
     } catch (err) {
       console.error("TV auto-login failed", err);
     }
   };

useEffect(() => {
  const urlParams = new URLSearchParams(
    window.location.search
  );

  const forceTVMode =
    urlParams.get("mode") === "tv";

  const hostname = window.location.hostname;

  const isLAN =
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("172.");

  if (forceTVMode && isLAN) {
    autoGuestLogin();
  }
}, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${config.backendUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!res.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await res.json();

      login(data.access_token, username);

      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">
            QueueScan
          </h1>

          <div className="text-zinc-400 mt-2">
            Login to Monitoring Console
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm mb-2 text-zinc-400">
              Username
            </label>

            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-zinc-400">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 rounded-lg py-3 font-semibold transition"
          >
            {loading ? "Logging In..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

