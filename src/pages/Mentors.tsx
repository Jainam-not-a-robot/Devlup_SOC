import SnowEffect from "../components/SnowEffect";
import { FaGithub, FaLinkedinIn, FaEnvelope } from "react-icons/fa";
import { useTheme } from "../components/ThemeProvider";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fetchMentors } from "../services/apiClient";

const Mentors = () => {
  const { showSnow } = useTheme();
  const [selectedYear, setSelectedYear] = useState("All");
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMentors = async () => {
      try {
        const data = await fetchMentors();
        setMentors(data);
      } catch (error) {
        console.error("Failed to load mentors:", error);
      } finally {
        setLoading(false);
      }
    };
    loadMentors();
  }, []);

  const years = ["All", ...new Set(mentors.map((m) => String(m.year)))];

  const filteredMentors =
    selectedYear === "All"
      ? mentors
      : mentors.filter((m) => String(m.year) === selectedYear);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--terminal-text)]">
        Loading Mentors...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-mono relative text-[var(--terminal-text)]"
      style={{
        background: `
          radial-gradient(circle at center,
            var(--bg-gradient-start),
            var(--bg-gradient-mid1),
            var(--bg-gradient-mid2),
            var(--bg-gradient-mid3),
            var(--bg-gradient-end)
          )
        `,
      }}
    >
      {showSnow && <SnowEffect />}

      {/* YEAR FILTER */}
      <div className="fixed top-28 right-6 z-50">
        <div
          className="relative rounded-full transition-all duration-300 hover:scale-105"
          style={{
            background: "rgba(15,25,40,0.5)",
            backdropFilter: "blur(10px)",
            border: "1px solid var(--terminal-window-border)",
            boxShadow: "var(--window-shadow-5)",
          }}
        >
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="appearance-none bg-transparent px-6 py-3 pr-10 rounded-full outline-none cursor-pointer"
            style={{
              color: "var(--terminal-text)",
            }}
          >
            {years.map((year, i) => (
              <option
                key={i}
                value={year}
                style={{
                  background: "var(--terminal-window-bg)",
                  color: "var(--terminal-text)",
                }}
              >
                {year}
              </option>
            ))}
          </select>

          <span
            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--terminal-dim)" }}
          >
            ▼
          </span>
        </div>
      </div>

      {/* HERO */}
      <section className="text-center pt-32 pb-10 px-6 relative z-10">
        <h1 className="text-5xl md:text-6xl font-bold">DevlUp Mentors</h1>

        <p className="mt-6 text-[var(--terminal-dim)] max-w-2xl mx-auto">
          Connect with the mentors and explore the guidance across DevlUp projects.
        </p>
      </section>

      {/* GRID */}
      <section className="max-w-6xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">

        {filteredMentors.map((mentor, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            whileHover={{ scale: 1.04 }}
            className="group relative h-[420px] rounded-xl overflow-hidden transition-all duration-300 backdrop-blur-md"
            style={{
              background: "rgba(20,35,60,0.22)",
              border: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
            }}
          >

            {/* PREVIEW */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 transition-opacity duration-300 group-hover:opacity-0">

              <img
                src={mentor.image}
                alt={mentor.name}
                className="w-36 h-36 rounded-full object-cover border"
                style={{
                  borderColor: "rgba(255,255,255,0.3)"
                }}
              />

              <h2 className="text-2xl font-semibold">
                {mentor.name}
              </h2>

            </div>

            {/* HOVER CONTENT */}
            <div className="absolute inset-0 flex flex-col opacity-0 translate-y-40 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">

              {/* IMAGE */}
              <div className="px-6 pt-6">
                <img
                  src={mentor.image}
                  alt={mentor.name}
                  className="w-full h-[180px] object-cover rounded-lg"
                />
              </div>

              {/* CONTENT */}
              <div className="px-6 pt-4 flex flex-col">

                <div className="flex gap-2 mb-2">
                  <span className="text-xs px-3 py-1 border rounded-full border-white/30">
                    {mentor.role}
                  </span>

                  <span className="text-xs px-3 py-1 border rounded-full border-white/30">
                    {mentor.year}
                  </span>
                </div>

                <h3 className="text-lg font-semibold">
                  {mentor.name}
                </h3>

                <p className="text-sm text-[var(--terminal-dim)] mt-1">
                  {mentor.expertise || mentor.description}
                </p>

                <p className="text-sm mt-2 text-[var(--terminal-dim)]">
                  📧 {mentor.email}
                </p>

                <div className="flex gap-4 mt-4 text-lg">

                  <a
                    href={mentor.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--accent-color)]"
                  >
                    <FaGithub />
                  </a>

                  <a
                    href={mentor.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--accent-color)]"
                  >
                    <FaLinkedinIn />
                  </a>

                  <a
                    href={`mailto:${mentor.email}`}
                    className="hover:text-[var(--accent-color)]"
                  >
                    <FaEnvelope />
                  </a>

                </div>

              </div>

            </div>
          </motion.div>
        ))}

      </section>
    </div>
  );
};

export default Mentors;