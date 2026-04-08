import React from 'react';
import SnowEffect from '../components/SnowEffect';

const FormPage = () => {
  return (
    <div className="relative min-h-screen bg-terminal overflow-hidden">
      
      {/* Snow background */}
      <SnowEffect />

      {/* Form content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="terminal-window max-w-md w-full p-6">
          <h1 className="text-2xl font-bold text-center text-terminal-text mb-6">
            Application Form
          </h1>

          <form className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              className="terminal-input w-full"
            />

            <input
              type="email"
              placeholder="Email"
              className="terminal-input w-full"
            />

            <input
              type="url"
              placeholder="GitHub Profile URL"
              className="terminal-input w-full"
            />

            <input
              type="url"
              placeholder="LinkedIn Profile URL"
              className="terminal-input w-full"
            />

            <input
              type="text"
              placeholder="Project you want to apply for"
              className="terminal-input w-full"
            />

            <textarea
              placeholder="Why do you want to contribute?"
              className="terminal-input w-full h-28"
            />

            <button
              type="submit"
              className="w-full bg-terminal-accent text-black py-2 rounded-md font-semibold"
            >
              Submit Application
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormPage;
