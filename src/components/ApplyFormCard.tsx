import { useState, useEffect } from "react";
import { fetchFormFields, fetchMyApplication, updateMyApplication, fetchDeadlineInfo, fetchProjects } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import { LogIn, Clock, CheckCircle, AlertTriangle } from "lucide-react";

const bgImage = "/avatars/bg_web.jpg";

interface FormField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  order: number;
  options?: string[];
}

interface ProjectOption {
  id: string;
  title: string;
}

const ApplyFormCard = () => {
  const { isGoogleUser, googleUser, isAuthenticated } = useAuth();
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [form, setForm] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  const [submitted, setSubmitted] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deadline state fetched from backend
  const [deadlinePassed, setDeadlinePassed] = useState(false);
  const [deadlineText, setDeadlineText] = useState("");
  const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([]);

  const hasValidEmail = isGoogleUser && googleUser?.email?.endsWith("@iitj.ac.in");

  // Load deadline, form fields, and check for existing application
  useEffect(() => {
    const load = async () => {
      setError(null);
      setSuccessMsg(null);
      try {
        // Fetch deadline from backend
        try {
          const deadlineInfo = await fetchDeadlineInfo();
          if (deadlineInfo.deadline) {
            const dl = new Date(deadlineInfo.deadline);
            setDeadlineText(
              dl.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            );
            setDeadlinePassed(!deadlineInfo.is_open);
          }
        } catch {
          // If deadline endpoint fails, don't block
        }

        const fields = await fetchFormFields();
        setFormFields(fields);

        // Check if any field needs project data
        const hasProjectDropdown = fields.some((f: FormField) => f.type === 'project_dropdown');
        if (hasProjectDropdown) {
          try {
            const projects = await fetchProjects({ approval_status: 'accepted', status: 'ongoing' });
            setProjectOptions(projects.map((p: any) => ({ id: p.id || p._id, title: p.project_title || p.name || '' })));
          } catch {
            // If project fetch fails, dropdown will be empty
          }
        }

        // Initialize form state
        const initialForm: Record<string, any> = {};
        fields.forEach((field: FormField) => {
          initialForm[field.name] = field.type === 'checkbox' ? false : "";
        });

        // Try to fetch existing application
        if (isAuthenticated && isGoogleUser && hasValidEmail) {
          try {
            const myApp = await fetchMyApplication();
            if (myApp) {
              setExistingApplication(myApp);
              // Populate form with existing data
              fields.forEach((field: FormField) => {
                if (myApp[field.name] !== undefined && myApp[field.name] !== null) {
                  initialForm[field.name] = myApp[field.name];
                }
              });
            }
          } catch {
            // No existing application, that's fine
          }
        }

        // Pre-fill email if not already filled
        if (googleUser?.email) {
          const emailField = fields.find(
            (f: FormField) =>
              f.name.toLowerCase().includes("email") ||
              f.label.toLowerCase().includes("email")
          );
          if (emailField && !initialForm[emailField.name]) {
            initialForm[emailField.name] = googleUser.email;
          }
        }

        // Pre-fill name if not already filled
        if (googleUser?.name) {
          const nameField = fields.find(
            (f: FormField) =>
              f.name.toLowerCase().includes("name") ||
              f.label.toLowerCase().includes("name")
          );
          if (nameField && !initialForm[nameField.name]) {
            initialForm[nameField.name] = googleUser.name;
          }
        }

        setForm(initialForm);
      } catch (err) {
        console.error("Failed to load form fields", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [googleUser, isAuthenticated, isGoogleUser, hasValidEmail]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    if (!hasValidEmail) {
      setError("You must be signed in with an @iitj.ac.in Google account.");
      setIsSubmitting(false);
      return;
    }

    // Validate required checkboxes
    const uncheckedRequired = formFields.find(
      (f) => f.type === 'checkbox' && f.required && !form[f.name]
    );
    if (uncheckedRequired) {
      setError(`Please check "${uncheckedRequired.label}" to continue.`);
      setIsSubmitting(false);
      return;
    }

    try {
      if (existingApplication) {
        // Update existing application
        const updated = await updateMyApplication(form as any);
        setExistingApplication(updated);
        setIsEditing(false);
        setSuccessMsg("Application updated successfully!");
      } else {
        // Create new application
        const { submitApplication } = await import("../services/apiClient");
        const created = await submitApplication(form as any);
        setExistingApplication(created);
        setSubmitted(true);
        setSuccessMsg("Application submitted successfully!");
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (detail) {
        setError(detail);
        // If backend says deadline passed, update frontend state too
        if (detail.toLowerCase().includes("deadline")) {
          setDeadlinePassed(true);
        }
      } else {
        setError("Failed to submit application");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const glowOn = (e: any) =>
    (e.currentTarget.style.boxShadow = "0 0 12px var(--accent-glow)");
  const glowOff = (e: any) => (e.currentTarget.style.boxShadow = "none");

  // --- GATE SCREENS ---

  // Not signed in
  if (!isAuthenticated || !isGoogleUser) {
    return (
      <div className="max-w-2xl w-full mx-auto px-6 py-10 relative">
        <div className="rounded-lg p-10 transition-all duration-300 relative overflow-hidden"
          style={{ border: "1px solid var(--terminal-window-border)", boxShadow: "var(--window-shadow-5)" }}>
          <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(5px)" }} />
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} />
          <div className="relative text-center space-y-5 py-6">
            <LogIn size={48} className="mx-auto text-terminal-accent" />
            <h1 className="text-3xl font-bold text-[var(--terminal-text)]">Sign In Required</h1>
            <p className="text-[var(--terminal-dim)] text-base max-w-md mx-auto">
              You must sign in with your <strong className="text-terminal-accent">@iitj.ac.in</strong> Google account to submit an application.
            </p>
            <p className="text-[var(--terminal-dim)] text-sm">
              Use the <strong>Sign In</strong> button in the navigation bar to continue.
            </p>
            {deadlineText && (
              <p className="text-[var(--terminal-dim)] text-xs flex items-center justify-center gap-1">
                <Clock size={14} /> Deadline: {deadlineText}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Wrong email domain
  if (!hasValidEmail) {
    return (
      <div className="max-w-2xl w-full mx-auto px-6 py-10 relative">
        <div className="rounded-lg p-10 transition-all duration-300 relative overflow-hidden"
          style={{ border: "1px solid var(--terminal-window-border)", boxShadow: "var(--window-shadow-5)" }}>
          <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(5px)" }} />
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} />
          <div className="relative text-center space-y-5 py-6">
            <div className="mx-auto w-16 h-16 rounded-full border-2 border-red-500/50 flex items-center justify-center">
              {googleUser?.picture ? (
                <img src={googleUser.picture} alt="" className="w-14 h-14 rounded-full" />
              ) : (
                <span className="text-2xl">⚠️</span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-[var(--terminal-text)]">IIT Jodhpur Email Required</h1>
            <p className="text-[var(--terminal-dim)] text-base max-w-md mx-auto">
              You are signed in as <strong className="text-terminal-accent">{googleUser?.email}</strong>, but applications can only be submitted from an <strong className="text-terminal-accent">@iitj.ac.in</strong> email address.
            </p>
            <p className="text-[var(--terminal-dim)] text-sm">
              Please sign out and sign in again with your IIT Jodhpur Google account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Deadline passed
  if (deadlinePassed) {
    return (
      <div className="max-w-2xl w-full mx-auto px-6 py-10 relative">
        <div className="rounded-lg p-10 transition-all duration-300 relative overflow-hidden"
          style={{ border: "1px solid var(--terminal-window-border)", boxShadow: "var(--window-shadow-5)" }}>
          <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(5px)" }} />
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} />
          <div className="relative text-center space-y-5 py-6">
            <AlertTriangle size={48} className="mx-auto text-red-400" />
            <h1 className="text-3xl font-bold text-[var(--terminal-text)]">Submissions Closed</h1>
            <p className="text-[var(--terminal-dim)] text-base max-w-md mx-auto">
              The application deadline was <strong className="text-terminal-accent">{deadlineText}</strong>. Submissions and edits are no longer accepted.
            </p>
            {existingApplication && (
              <p className="text-[var(--accent-color)] text-sm">
                Your application was submitted successfully before the deadline.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN FORM ---

  // Already submitted and not editing — show summary + edit button
  if (existingApplication && !isEditing && !submitted) {
    return (
      <div className="max-w-2xl w-full mx-auto px-6 py-10 relative">
        <div className="rounded-lg p-10 transition-all duration-300 relative overflow-hidden"
          style={{ border: "1px solid var(--terminal-window-border)", boxShadow: "var(--window-shadow-5)" }}>
          <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(5px)" }} />
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} />
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle size={32} className="text-green-400" />
              <div>
                <h1 className="text-3xl font-bold">Application Submitted</h1>
                <p className="text-sm text-[var(--terminal-dim)]">
                  Signed in as {googleUser?.email}
                </p>
              </div>
            </div>

            {successMsg && (
              <p className="text-center text-green-400 bg-green-500/10 p-2 rounded-md border border-green-500/20 mb-4">
                {successMsg}
              </p>
            )}

            <div className="space-y-3 mb-6">
              {formFields.map((field) => (
                <div key={field.id} className="border-b border-[var(--terminal-window-border)] pb-2">
                  <p className="text-xs text-[var(--terminal-dim)]">{field.label}</p>
                  <p className="text-[var(--terminal-text)]">
                    {existingApplication[field.name] || <span className="text-[var(--terminal-dim)] italic">Not provided</span>}
                  </p>
                </div>
              ))}
            </div>

            {deadlineText && (
              <p className="text-xs text-[var(--terminal-dim)] flex items-center gap-1 mb-4">
                <Clock size={14} /> You can edit your application until {deadlineText}
              </p>
            )}

            <div className="flex justify-center">
              <button
                onClick={() => setIsEditing(true)}
                className="px-8 py-3 rounded-lg font-semibold transition-all duration-500 hover:scale-105"
                style={{
                  background: "var(--accent-color)",
                  color: "black",
                  boxShadow: "0 0 10px var(--accent-glow)",
                }}
              >
                Edit Application
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form view (new submission or editing)
  return (
    <div className="max-w-2xl w-full mx-auto px-6 py-10 relative">
      <div className="rounded-lg p-10 transition-all duration-300 relative overflow-hidden"
        style={{ border: "1px solid var(--terminal-window-border)", boxShadow: "var(--window-shadow-5)" }}>
        <div className="absolute inset-0 scale-110" style={{ backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(5px)" }} />
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} />

        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            {googleUser?.picture && (
              <img src={googleUser.picture} alt="" className="w-10 h-10 rounded-full border border-terminal-accent/50" />
            )}
            <div>
              <h1 className="text-3xl font-bold">
                {existingApplication ? "Edit Application" : "Contributor Application"}
              </h1>
              <p className="text-sm text-[var(--terminal-dim)]">
                Signed in as {googleUser?.email}
              </p>
            </div>
          </div>

          {deadlineText && (
            <p className="text-xs text-[var(--terminal-dim)] flex items-center gap-1 mb-4">
              <Clock size={14} /> Deadline: {deadlineText}
            </p>
          )}

          {isLoading ? (
            <div className="text-center text-[var(--terminal-text)]">Loading form...</div>
          ) : submitted && !isEditing ? (
            <p className="text-center text-[var(--accent-color)]">Application submitted successfully.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <p className="text-center text-red-500 bg-red-500/10 p-2 rounded-md border border-red-500/20">
                  {error}
                </p>
              )}
              {successMsg && (
                <p className="text-center text-green-400 bg-green-500/10 p-2 rounded-md border border-green-500/20">
                  {successMsg}
                </p>
              )}

              {formFields.map((field) => {
                if (field.type === 'checkbox') {
                  return (
                    <label
                      key={field.id}
                      className="group flex items-center gap-3 p-3 rounded-md cursor-pointer transition-all duration-300 hover:bg-white/5"
                      style={{ border: '1px solid var(--terminal-window-border)' }}
                      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 8px var(--accent-glow)'}
                      onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                    >
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          name={field.name}
                          checked={!!form[field.name]}
                          onChange={(e) => setForm({ ...form, [field.name]: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div
                          className="w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center peer-checked:scale-110"
                          style={{
                            borderColor: form[field.name] ? 'var(--accent-color)' : 'var(--terminal-window-border)',
                            background: form[field.name] ? 'var(--accent-color)' : 'transparent',
                            boxShadow: form[field.name] ? '0 0 8px var(--accent-glow)' : 'none',
                          }}
                        >
                          {form[field.name] && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="2 6 5 9 10 3" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span style={{ color: 'var(--terminal-text)' }}>{field.label}</span>
                      {field.required && <span className="text-red-400 text-xs">*</span>}
                    </label>
                  );
                }

                if (field.type === 'dropdown') {
                  const options = field.options || [];
                  const selectedLabel = form[field.name] || '';
                  return (
                    <div key={field.id} className="relative">
                      <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--terminal-dim)' }}>
                        {field.label} {field.required && <span className="text-red-400">*</span>}
                      </label>
                      <div className="relative">
                        <select
                          name={field.name}
                          required={field.required}
                          value={form[field.name] || ''}
                          onChange={handleChange}
                          className="w-full p-3 pr-10 rounded-md outline-none transition-all duration-300 appearance-none cursor-pointer hover:scale-[1.01]"
                          style={{
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid var(--terminal-window-border)',
                            color: selectedLabel ? 'var(--terminal-text)' : 'var(--terminal-dim)',
                            backdropFilter: 'blur(8px)',
                          }}
                          onFocus={glowOn}
                          onBlur={glowOff}
                        >
                          <option value="" disabled style={{ background: '#0a0a0a', color: '#666' }}>
                            Select {field.label}
                          </option>
                          {options.map((opt) => (
                            <option key={opt} value={opt} style={{ background: '#0a0a0a', color: '#e0e0e0', padding: '8px' }}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        {/* Custom chevron */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--accent-color)' }}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="4 6 8 10 12 6" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (field.type === 'project_dropdown') {
                  const selectedLabel = form[field.name] || '';
                  return (
                    <div key={field.id} className="relative">
                      <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--terminal-dim)' }}>
                        {field.label} {field.required && <span className="text-red-400">*</span>}
                      </label>
                      <div className="relative">
                        <select
                          name={field.name}
                          required={field.required}
                          value={form[field.name] || ''}
                          onChange={handleChange}
                          className="w-full p-3 pr-10 rounded-md outline-none transition-all duration-300 appearance-none cursor-pointer hover:scale-[1.01]"
                          style={{
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid var(--terminal-window-border)',
                            color: selectedLabel ? 'var(--terminal-text)' : 'var(--terminal-dim)',
                            backdropFilter: 'blur(8px)',
                          }}
                          onFocus={glowOn}
                          onBlur={glowOff}
                        >
                          <option value="" disabled style={{ background: '#0a0a0a', color: '#666' }}>
                            Select a project...
                          </option>
                          {projectOptions.map((proj) => (
                            <option key={proj.id} value={proj.title} style={{ background: '#0a0a0a', color: '#e0e0e0', padding: '8px' }}>
                              {proj.title}
                            </option>
                          ))}
                        </select>
                        {/* Custom chevron */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--accent-color)' }}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="4 6 8 10 12 6" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Default: text/email/url/number input
                return (
                  <div key={field.id}>
                    <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--terminal-dim)' }}>
                      {field.label} {field.required && <span className="text-red-400">*</span>}
                    </label>
                    <input
                      name={field.name}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                      type={field.type || "text"}
                      required={field.required}
                      value={form[field.name] || ""}
                      onChange={handleChange}
                      className="w-full p-3 rounded-md outline-none transition-all duration-300 hover:scale-[1.01]"
                      style={{
                        background: "rgba(0, 0, 0, 0.4)",
                        border: "1px solid var(--terminal-window-border)",
                        color: "var(--terminal-text)",
                        backdropFilter: "blur(8px)",
                      }}
                      onFocus={glowOn}
                      onBlur={glowOff}
                    />
                  </div>
                );
              })}

              <div className="flex justify-center gap-3 pt-6">
                {existingApplication && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 border"
                    style={{
                      borderColor: "var(--terminal-window-border)",
                      color: "var(--terminal-text)",
                    }}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-8 py-3 rounded-lg font-semibold transition-all duration-500 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                  style={{
                    background: "var(--accent-color)",
                    color: "black",
                    boxShadow: "0 0 10px var(--accent-glow)",
                  }}
                >
                  {isSubmitting
                    ? (existingApplication ? 'Updating...' : 'Submitting...')
                    : (existingApplication ? 'Update Application' : 'Submit Application')
                  }
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplyFormCard;
