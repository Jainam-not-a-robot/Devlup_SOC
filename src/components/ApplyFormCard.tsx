import { useState } from "react";

const bgImage = "/avatars/bg_web.jpg";

const ApplyFormCard = () => {
  const [form, setForm] = useState({
    mentee_name: "",
    mentee_roll_number: "",
    mentee_github_id: "",
    mentee_email_id: "",
    mentee_proposal_url: "",
    project_name_1: "",
    project_name_2: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const { submitApplication } = await import("../services/apiClient");
      
      // Map the frontend form to the backend ApplicationCreate schema
      const payload = {
        mentee_name: form.mentee_name,
        mentee_roll_number: form.mentee_roll_number,
        mentee_github_id: form.mentee_github_id,
        mentee_email_id: form.mentee_email_id,
        mentee_proposal_url: form.mentee_proposal_url,
        project_name_1: form.project_name_1,
        project_name_2: form.project_name_2 || undefined,
      };
      
      await submitApplication(payload);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  const glowOn = (e: any) =>
    (e.currentTarget.style.boxShadow = "0 0 12px var(--accent-glow)");
  const glowOff = (e: any) => (e.currentTarget.style.boxShadow = "none");

  return (
    <div className="max-w-2xl w-full mx-auto px-6 py-10 relative">
      <div
        className="rounded-lg p-10 transition-all duration-300 relative overflow-hidden"
        style={{
          border: "1px solid var(--terminal-window-border)",
          boxShadow: "var(--window-shadow-5)",
        }}
      >
        {/* BLURRED BACKGROUND */}
        <div
          className="absolute inset-0 scale-110"
          style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(5px)",
          }}
        />

        {/* DARK OVERLAY */}
        <div
          className="absolute inset-0"
          style={{ background: "rgba(0,0,0,0.45)" }}
        />

        <div className="relative">
          <h1 className="text-3xl font-bold mb-6">
            Contributor Application
          </h1>

          {submitted ? (
            <p className="text-center text-[var(--accent-color)]">
              Application submitted successfully.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <p className="text-center text-red-500 bg-red-500/10 p-2 rounded-md border border-red-500/20">
                  {error}
                </p>
              )}

              {/* BASIC INFO */}
              {[
                ["mentee_name", "Full Name"],
                ["mentee_roll_number", "Roll Number"],
                ["mentee_github_id", "GitHub ID"],
                ["mentee_email_id", "Email ID"],
                ["project_name_1", "Project Name 1"],
                ["project_name_2", "Project Name 2 (Optional)"],
                ["mentee_proposal_url", "Proposal URL / Link"],
              ].map(([name, placeholder]) => (
                <input
                  key={name}
                  name={name}
                  placeholder={placeholder}
                  type={name === "mentee_email_id" ? "email" : name === "mentee_proposal_url" ? "url" : "text"}
                  required={name !== "project_name_2" && name !== "mentee_proposal_url"}
                  onChange={handleChange}
                  className="w-full p-3 rounded-md outline-none transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: "transparent",
                    border: "1px solid var(--terminal-window-border)",
                    color: "var(--terminal-text)",
                  }}
                  onFocus={glowOn}
                  onBlur={glowOff}
                />
              ))}

              <div className="flex justify-center pt-6">
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
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
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
