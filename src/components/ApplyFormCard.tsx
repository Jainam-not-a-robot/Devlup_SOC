import { useState, useEffect } from "react";
import { fetchFormFields } from "../services/apiClient";

const bgImage = "/avatars/bg_web.jpg";

interface FormField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  order: number;
}

const ApplyFormCard = () => {
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [form, setForm] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadFields = async () => {
      try {
        const fields = await fetchFormFields();
        setFormFields(fields);
        
        // Initialize form state with empty strings for all fields
        const initialForm: Record<string, string> = {};
        fields.forEach((field: FormField) => {
          initialForm[field.name] = "";
        });
        setForm(initialForm);
      } catch (err) {
        console.error("Failed to load form fields", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadFields();
  }, []);

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
      
      // Submit the dynamic payload
      await submitApplication(form as any);
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

          {isLoading ? (
            <div className="text-center text-[var(--terminal-text)]">
              Loading form...
            </div>
          ) : submitted ? (
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

              {/* DYNAMIC INFO */}
              {formFields.map((field) => (
                <input
                  key={field.id}
                  name={field.name}
                  placeholder={field.label}
                  type={field.type || "text"}
                  required={field.required}
                  value={form[field.name] || ""}
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
