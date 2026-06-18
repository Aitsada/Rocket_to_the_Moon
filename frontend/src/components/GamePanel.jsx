import { useEffect, useRef, useState } from "react";
import { CircleDollarSign, Play, Square } from "lucide-react";
import errorSound from "../assets/sounds/error.mp3";
import rocketBoomSound from "../assets/sounds/rocket-boom.mp3";
import bingSound from "../assets/sounds/bing.mp3";
import dropcoinSound from "../assets/sounds/drop-coin.mp3";
import { gameApi } from "../services/api.js";
import { displayMultiplier, MAX_TRAVEL_SECONDS } from "../utils/gameMath.js";
import { useAuth } from "../hooks/useAuth.jsx";
import RocketScene from "./RocketScene.jsx";
import LoadingButton from "./LoadingButton.jsx";

const GUEST_BALANCE_KEY = "rtm_guest_points";

function initialGuestPoints() {
  const stored = sessionStorage.getItem(GUEST_BALANCE_KEY);
  if (stored === null) {
    sessionStorage.setItem(GUEST_BALANCE_KEY, "300");
    return 300;
  }
  return Number(stored);
}

export default function GamePanel() {
  const { user, setUser } = useAuth();
  const [guestPoints, setGuestPoints] = useState(initialGuestPoints);
  const [bet, setBet] = useState(10);
  const [round, setRound] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("Enter a bet and launch.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [launchErrorActive, setLaunchErrorActive] = useState(false);
  const timerRef = useRef(null);
  const launchErrorTimerRef = useRef(null);
  const checkingCrashRef = useRef(false);
  const lastCrashCheckRef = useRef(0);
  const cashingOutRef = useRef(false);
  const previousStatusRef = useRef(status);

  const balance = user ? user.points : guestPoints;
  const multiplier = displayMultiplier(elapsed);

  useEffect(() => {
    if (status !== "flying") {
      return undefined;
    }

    const start = Date.now() - elapsed * 1000;
    timerRef.current = window.setInterval(() => {
      const nextElapsed = Math.min(
        (Date.now() - start) / 1000,
        MAX_TRAVEL_SECONDS,
      );
      setElapsed(nextElapsed);

      if (round) {
        checkServerRound(nextElapsed, nextElapsed >= MAX_TRAVEL_SECONDS);
      }
    }, 50);

    return () => window.clearInterval(timerRef.current);
  }, [status, round, user]);

  useEffect(() => {
    return () => window.clearTimeout(launchErrorTimerRef.current);
  }, []);

  useEffect(() => {
    if (status === "lost" && previousStatusRef.current !== "lost") {
      const audio = new Audio(rocketBoomSound);
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }

    previousStatusRef.current = status;
  }, [status]);

  function persistGuestPoints(points) {
    sessionStorage.setItem(GUEST_BALANCE_KEY, String(points));
    setGuestPoints(points);
  }

  function validateLocalBet() {
    const betValue = Number(bet);
    if (!Number.isInteger(betValue) || betValue <= 0) {
      throw new Error("Bet must be a positive whole number.");
    }
    if (betValue > balance) {
      const insufficientPointsError = new Error(
        "Bet cannot exceed your points.",
      );
      insufficientPointsError.code = "INSUFFICIENT_POINTS";
      throw insufficientPointsError;
    }
    return betValue;
  }

  function triggerLaunchErrorFeedback() {
    window.clearTimeout(launchErrorTimerRef.current);
    setLaunchErrorActive(false);

    window.requestAnimationFrame(() => {
      setLaunchErrorActive(true);
      launchErrorTimerRef.current = window.setTimeout(() => {
        setLaunchErrorActive(false);
      }, 1000);
    });

    const audio = new Audio(errorSound);
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  async function start() {
    const audio = new Audio(bingSound);
    audio.play();
    setError("");
    cashingOutRef.current = false;
    try {
      const betValue = validateLocalBet();
      setLoading(true);
      setElapsed(0);
      lastCrashCheckRef.current = 0;
      setMessage("Rocket is climbing. Stop before it crashes.");

      const data = await gameApi.start(betValue);
      if (user) {
        setUser(data.user);
      } else {
        persistGuestPoints(guestPoints - betValue);
      }
      setRound(data.round);

      setStatus("flying");
    } catch (err) {
      if (err.code === "INSUFFICIENT_POINTS") {
        triggerLaunchErrorFeedback();
      }
      setError(err.message);
      setMessage("Launch failed.");
    } finally {
      setLoading(false);
    }
  }

  async function cashout() {
    if (!round || status !== "flying") {
      return;
    }

    const audio = new Audio(dropcoinSound);
    audio.play();
    setError("");
    setLoading(true);
    cashingOutRef.current = true;

    try {
      const data = await gameApi.cashout(round.id);
      if (user) {
        setUser(data.user);
      } else if (data.round.result === "won") {
        persistGuestPoints(guestPoints + Number(data.round.payout_points));
      }
      setRound(data.round);
      setElapsed(
        Number(data.round.stopped_at || data.round.crash_time || elapsed),
      );
      setStatus(data.round.result === "won" ? "won" : "lost");
      setMessage(
        data.round.result === "won"
          ? `Cashed out at ${Number(data.round.multiplier).toFixed(2)}x for ${data.round.payout_points} points.`
          : "Rocket crashed before cashout.",
      );
    } catch (err) {
      if (err.data?.round) {
        setRound(err.data.round);
        setElapsed(Number(err.data.round.crash_time || elapsed));
        setStatus("lost");
        setMessage("Rocket crashed before cashout.");
      }
      setError(err.message);
    } finally {
      setLoading(false);
      cashingOutRef.current = false;
    }
  }

  async function checkServerRound(currentElapsed, force = false) {
    if (!round || checkingCrashRef.current) {
      return;
    }

    const now = Date.now();
    if (
      !force &&
      (currentElapsed < 0.4 || now - lastCrashCheckRef.current < 350)
    ) {
      return;
    }

    checkingCrashRef.current = true;
    lastCrashCheckRef.current = now;
    try {
      const data = await gameApi.crash(round.id);
      if (data.round.result === "active") {
        setRound(data.round);
        return;
      }

      if (cashingOutRef.current) {
        return;
      }

      const stoppedAt = Number(data.round.stopped_at);
      const reachedMoon =
        data.round.result === "won" && stoppedAt >= MAX_TRAVEL_SECONDS;

      if (data.round.result === "won" && !reachedMoon) {
        return;
      }

      if (user) {
        setUser(data.user);
      } else if (data.round.result === "won") {
        persistGuestPoints(guestPoints + Number(data.round.payout_points));
      }
      setRound(data.round);
      setElapsed(
        reachedMoon
          ? MAX_TRAVEL_SECONDS
          : Number(data.round.crash_time || elapsed),
      );
      setStatus(data.round.result === "won" ? "won" : "lost");
      setMessage(
        reachedMoon
          ? `Moon reached at 20.00x for ${data.round.payout_points} points.`
          : "Rocket crashed. Bet lost.",
      );
    } catch (err) {
      if (err.status !== 409) {
        setError(err.message);
      }
    } finally {
      checkingCrashRef.current = false;
    }
  }

  function resetGuest() {
    if (user || status === "flying") {
      return;
    }
    persistGuestPoints(300);
    setMessage("Guest points reset to 300.");
  }

  return (
    <div className="game-grid">
      <RocketScene elapsed={elapsed} status={status} />

      <aside className="control-panel">
        <div className="stat-row">
          <span>Balance</span>
          <strong>{balance} pts</strong>
        </div>
        <div className="multiplier">
          <span>{multiplier.toFixed(2)}x</span>
          <small>
            {elapsed.toFixed(1)}s / {MAX_TRAVEL_SECONDS.toFixed(1)}s
          </small>
        </div>

        <label className="field">
          <small>Reach 20s for 20.00x</small>
          Fuel points
          <input
            type="number"
            min="1"
            value={bet}
            disabled={status === "flying"}
            onChange={(event) => setBet(event.target.value)}
          />
        </label>

        {status === "flying" ? (
          <LoadingButton
            className="stop-button"
            loading={loading}
            onClick={cashout}
          >
            <Square size={18} /> Stop
          </LoadingButton>
        ) : (
          <LoadingButton
            className={`launch-button${launchErrorActive ? " launch-button-error" : ""}`}
            loading={loading}
            onClick={start}
          >
            <Play size={18} /> Launch
          </LoadingButton>
        )}

        {!user && (
          <button
            className="ghost-button"
            onClick={resetGuest}
            disabled={status === "flying"}
          >
            <CircleDollarSign size={18} /> Reset guest points
          </button>
        )}

        <p className="message">{message}</p>
        {error && <p className="error">{error}</p>}
        {!user && (
          <p className="hint">
            Guest rounds use session points and are not saved.
          </p>
        )}
      </aside>
    </div>
  );
}
