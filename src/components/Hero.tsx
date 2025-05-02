import { ArrowUpRight } from "lucide-react";
import React, { useEffect, useRef } from "react";

const Hero: React.FC = () => {
  const introRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const introElement = introRef.current;
    if (!introElement) return;

    const children = Array.from(introElement.children);

    children.forEach((child, index) => {
      child.classList.add("opacity-0");

      setTimeout(() => {
        child.classList.remove("opacity-0");
        child.classList.add("animate-fadeIn");
      }, 300 * (index + 1));
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <div ref={introRef} className="max-w-xl">
        <p className="text-2xl mb-4 transition-all duration-500">Hello!</p>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 transition-all duration-500">
          I'm <span className="text-blue-500">SUD</span>, a full stack
          developer.
        </h1>
        <p className="text-xl mb-8 transition-all duration-500">
          Feel free to connect with me on{" "}
          <a
            href="https://www.linkedin.com/in/alphacrash/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 transition-colors duration-300"
          >
            <span className="inline-flex items-center">
              linkedIn
              <ArrowUpRight size="16px" className="ml-1" />
            </span>
          </a>
        </p>
      </div>
    </div>
  );
};

export default Hero;
