import SnowEffect from "../components/SnowEffect";
import { mentors } from "../data/mentors";
import { FaGithub, FaLinkedinIn } from "react-icons/fa";
import { useTheme } from "../components/ThemeProvider";

const Mentors = () => {
  const { showSnow } = useTheme();

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

      {/* HERO */}
      <section className="text-center pt-32 pb-16 px-6 relative z-10">
        <h1 className="text-5xl md:text-6xl font-bold">
          DevLUp Mentors
        </h1>

        <p className="mt-6 text-[var(--terminal-dim)] max-w-2xl mx-auto">
          Connect with mentors and explore guidance across DevLUp projects.
        </p>
      </section>

      {/* MENTOR BLOCKS — SAME AS BROWSE PROJECTS */}
      <section className="max-w-5xl mx-auto px-6 pb-24 relative z-10 space-y-8">

        {mentors.map((mentor, i) => (
          <div
            key={i}
            className="rounded-lg p-8 backdrop-blur-sm transition hover:-translate-y-[2px]"
            style={{
              background: "var(--terminal-window-bg)",
              border: "1px solid var(--terminal-window-border)",
              boxShadow: "var(--window-shadow-5)",
            }}
          >
            <h2 className="text-xl font-semibold">
              {mentor.name}
            </h2>

            <p className="mt-2 text-[var(--terminal-dim)]">
              {mentor.expertise}
            </p>

            <div className="flex gap-6 mt-4 text-lg">
              <a
                href={mentor.github}
                target="_blank"
                className="hover:text-[var(--accent-color)]"
              >
                <FaGithub />
              </a>

              <a
                href={mentor.linkedin}
                target="_blank"
                className="hover:text-[var(--accent-color)]"
              >
                <FaLinkedinIn />
              </a>
            </div>
          </div>
        ))}

      </section>
    </div>
  );
};

export default Mentors;