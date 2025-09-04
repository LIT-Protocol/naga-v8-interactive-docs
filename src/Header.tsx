import { Link } from "react-router-dom";
import litPrimaryOrangeIcon from "./assets/lit-primary-orange.svg";
import { useOptionalLitAuth } from "./lit-login-modal/LitAuthProvider";

export const Header = () => {
  const litAuth = useOptionalLitAuth();
  return (
    <div className="sticky top-0 z-50 bg-white">
      <div className="max-w-8xl mx-auto relative text-black">
        <div>
          <div className="relative">
            <div className="flex items-center lg:px-12 h-16 min-w-0 mx-4 lg:mx-0 w-8xl">
              <div className="h-full relative flex items-center justify-between gap-x-4 min-w-0 border-b border-gray-500/5 dark:border-gray-300/[0.06] pl-4 lg:pl-0 w-full">
                {/* Left side - Logo */}
                <div className="flex items-center">
                  <Link to="/">
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
                <div className="text-sm flex items-center gap-3 ml-auto text-[#837F7E] pr-16">
                  {litAuth?.isAuthenticated && (
                    <button
                      className="cursor-pointer"
                      onClick={litAuth.logout}
                      aria-label="Logout"
                    >
                      Logout
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
