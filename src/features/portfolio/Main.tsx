import BlurText from "./components/react-bits/BlurText";
import FadeContent from "./components/react-bits/FadeContent";
import SplitText from "./components/react-bits/SplitText";
import Threads from "./components/react-bits/Threads";
import SocialLink from "./components/SocialLink";
import { socials } from "./data";

const Main = () => {
  return (
    <main className="w-full h-[90vh] flex flex-col justify-center items-center">
      <div className="flex flex-col gap-2 mx-2">
        <div>
          <SplitText
            text="Hello!"
            className="text-6xl text-blue-500 font-semibold"
            delay={10}
            animationFrom={{ opacity: 0, transform: "translate3d(0,50px,0)" }}
            animationTo={{ opacity: 1, transform: "translate3d(0,0,0)" }}
            easing="easeOutCubic"
            threshold={0.2}
            rootMargin="-50px"
            onLetterAnimationComplete={() => {}}
          />
        </div>
        <div>
          <SplitText
            text="I'm SUD, a full stack developer."
            className="text-4xl font-semibold"
            delay={10}
            animationFrom={{ opacity: 0, transform: "translate3d(0,50px,0)" }}
            animationTo={{ opacity: 1, transform: "translate3d(0,0,0)" }}
            easing="easeOutCubic"
            threshold={0.2}
            rootMargin="-50px"
            onLetterAnimationComplete={() => {}}
          />
        </div>
        <div>
          <FadeContent
            blur={true}
            duration={1000}
            easing="ease-out"
            initialOpacity={0}
          >
            <div className="md:flex md:flex-row md:gap-2">
              Feel free to connect with me on
              <SocialLink
                name="linkedin"
                url="https://www.linkedin.com/in/alphacrash/"
              />
              or follow me on
              <SocialLink name="github" url="https://github.com/alphacrash/" />
            </div>
          </FadeContent>
        </div>

        <div className="my-4">
          <BlurText
            text="Built this site for my own practice and to help others with DSA, SQL, and System Design. 🚀"
            delay={30}
            animateBy="words"
            direction="bottom"
            onAnimationComplete={() => {}}
            className="text-xl text-gray-500 dark:text-gray-400"
          />
        </div>
      </div>
      <div className="w-full flex justify-center items-center mt-8">
        <Threads amplitude={5} distance={0} enableMouseInteraction={true} />
      </div>
    </main>
  );
};

export default Main;
