import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "sonner";
import { notify } from "@/lib/toast";

// ── Mock sonner ─────────────────────────────────────────────────────────────────
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
    promise: vi.fn(),
  },
}));

describe("notify helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("notify.success calls toast.success", () => {
    notify.success("Saved!", "Student record updated");

    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith("Saved!", {
      description: "Student record updated",
    });
  });

  it("notify.error calls toast.error with 6s duration", () => {
    notify.error("Something went wrong", "Check your connection");

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith("Something went wrong", {
      description: "Check your connection",
      duration: 6000,
    });
  });

  it("notify.mutation returns onSuccess/onError handlers", () => {
    const onSuccessSpy = vi.fn();
    const onErrorSpy = vi.fn();

    const handlers = notify.mutation({
      success: "Created!",
      error: "Failed to create",
      onSuccess: onSuccessSpy,
      onError: onErrorSpy,
    });

    // Verify shape
    expect(handlers).toHaveProperty("onSuccess");
    expect(handlers).toHaveProperty("onError");
    expect(typeof handlers.onSuccess).toBe("function");
    expect(typeof handlers.onError).toBe("function");

    // Invoke onSuccess
    handlers.onSuccess({ id: 1 });
    expect(toast.success).toHaveBeenCalledWith("Created!", {
      description: undefined,
    });
    expect(onSuccessSpy).toHaveBeenCalledWith({ id: 1 });

    // Invoke onError
    const testError = new Error("Network error");
    handlers.onError(testError);
    expect(toast.error).toHaveBeenCalledWith("Failed to create", {
      duration: 6000,
    });
    expect(onErrorSpy).toHaveBeenCalledWith(testError);
  });

  it("notify.mutation onError falls back to error.message when no custom error message", () => {
    const handlers = notify.mutation({
      success: "Done",
      // no error string provided
    });

    const err = new Error("Custom error message");
    handlers.onError(err);

    expect(toast.error).toHaveBeenCalledWith("Custom error message", {
      duration: 6000,
    });
  });

  it("notify.warning calls toast.warning with 5s duration", () => {
    notify.warning("Watch out");

    expect(toast.warning).toHaveBeenCalledWith("Watch out", {
      description: undefined,
      duration: 5000,
    });
  });

  it("notify.info calls toast.info", () => {
    notify.info("FYI", "Some detail");

    expect(toast.info).toHaveBeenCalledWith("FYI", {
      description: "Some detail",
    });
  });
});
