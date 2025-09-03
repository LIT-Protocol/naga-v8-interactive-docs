import { Link } from "react-router-dom";
import litPrimaryOrangeIcon from "../../assets/lit-primary-orange.svg";

export const Header = () => {
  return (
    <div className="max-w-8xl mx-auto relative text-black">
      <div>
        <div className="relative">
          <div className="flex items-center lg:px-12 h-16 min-w-0 mx-4 lg:mx-0 w-8xl">
            <div className="h-full relative flex items-center justify-between gap-x-4 min-w-0 border-b border-gray-500/5 dark:border-gray-300/[0.06] pl-4 lg:pl-0">
              {/* Left side - Logo */}
              <div className="flex items-center">
                <Link to="/">
                  <span className="sr-only">
                    Lit JS SDK Documentation home page
                  </span>
                  <img
                    className="nav-logo w-auto h-7 relative object-contain"
                    alt="Lit logo"
                    src={litPrimaryOrangeIcon}
                  />
                </Link>
              </div>

              {/* Center - Search bar */}
              <div className="flex-1 max-w-2xl mx-8"></div>

              {/* Right side - Controls */}
              <div className="flex items-center gap-3"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
