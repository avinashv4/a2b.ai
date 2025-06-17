import React from "react";
import { gsap } from "gsap";
import { ChevronRight } from "lucide-react";

interface MenuItemProps {
  link: string;
  text: string;
  image: string;
  members?: { name: string; avatar: string }[];
  additionalMembers?: number;
}

interface FlowingMenuProps {
  items?: MenuItemProps[];
}

const FlowingMenu: React.FC<FlowingMenuProps> = ({ items = [] }) => {
  return (
    <div className="w-full overflow-hidden" style={{ minHeight: '400px', height: 'auto' }}>
      <nav className="flex flex-col h-full m-0 p-0">
        {items.map((item, idx) => (
          <MenuItem key={idx} {...item} />
        ))}
      </nav>
    </div>
  );
};

const MenuItem: React.FC<MenuItemProps> = ({ link, text, image, members = [], additionalMembers = 0 }) => {
  const itemRef = React.useRef<HTMLDivElement>(null);
  const marqueeRef = React.useRef<HTMLDivElement>(null);
  const marqueeInnerRef = React.useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);

  const animationDefaults = { duration: 0.6, ease: "expo" };

  const findClosestEdge = (
    mouseX: number,
    mouseY: number,
    width: number,
    height: number
  ): "top" | "bottom" => {
    const topEdgeDist = Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY, 2);
    const bottomEdgeDist =
      Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY - height, 2);
    return topEdgeDist < bottomEdgeDist ? "top" : "bottom";
  };

  const handleMouseEnter = (ev: React.MouseEvent<HTMLAnchorElement>) => {
    setIsHovered(true);
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current)
      return;
    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(
      ev.clientX - rect.left,
      ev.clientY - rect.top,
      rect.width,
      rect.height
    );

    const tl = gsap.timeline({ defaults: animationDefaults });
    tl.set(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" })
      .set(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%" })
      .to([marqueeRef.current, marqueeInnerRef.current], { y: "0%" });
  };

  const handleMouseLeave = (ev: React.MouseEvent<HTMLAnchorElement>) => {
    setIsHovered(false);
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current)
      return;
    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(
      ev.clientX - rect.left,
      ev.clientY - rect.top,
      rect.width,
      rect.height
    );

    const tl = gsap.timeline({ defaults: animationDefaults });
    tl.to(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }).to(
      marqueeInnerRef.current,
      { y: edge === "top" ? "101%" : "-101%" },
      "<"
    );
  };

  const repeatedMarqueeContent = React.useMemo(() => {
    return Array.from({ length: 10 }).map((_, idx) => (
      <React.Fragment key={idx}>
        <span className="text-[#000000] uppercase font-normal text-[4vh] leading-[1.2] p-[1vh_1vw_0]">
          {text}
        </span>
        <div
          className="w-[200px] h-[7vh] my-[2em] mx-[2vw] p-[1em_0] rounded-[50px] bg-cover bg-center"
          style={{ backgroundImage: `url(${image})` }}
        />
      </React.Fragment>
    ));
  }, [text, image]);

  return (
    <div
      className="flex-1 relative overflow-hidden text-center shadow-[0_-1px_0_0_#fff]"
      ref={itemRef}
    >
      <a
        className="flex items-center h-full relative cursor-pointer no-underline bg-[#1d4ed8] hover:bg-[#f8ff6c] transition-colors duration-300 px-8"
        href={link}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Left Side - Destination and Members */}
        <div className="flex-1 text-left">
          <h3 className="text-[#f8ff6c] hover:text-[#1d4ed8] text-[4vh] font-bold uppercase mb-2 transition-colors duration-300">
            {text}
          </h3>
          
          {/* Member Avatars */}
          <div className={`flex items-center space-x-2 transition-all duration-300 ${
            isHovered ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'
          }`}>
            <div className="flex -space-x-2">
              {members.slice(0, 3).map((member, index) => (
                <div
                  key={index}
                  className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-200"
                  style={{ zIndex: members.length - index }}
                >
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            {(additionalMembers > 0 || members.length > 3) && (
              <span className="text-[#f8ff6c] hover:text-[#1d4ed8] font-medium ml-2 text-sm transition-colors duration-300">
                +{members.length > 3 ? additionalMembers + (members.length - 3) : additionalMembers} others
              </span>
            )}
          </div>
        </div>

        {/* Right Side - Go Button */}
        <div className="flex items-center">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
            style={{ 
              backgroundColor: '#f8ff6c',
              opacity: isHovered ? 0 : 1,
              transform: isHovered ? 'scale(0.8)' : 'scale(1)'
            }}
          >
            <ChevronRight className="w-6 h-6" style={{ color: '#1d4ed8' }} />
          </div>
        </div>
      </a>
      <div
        className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none bg-white translate-y-[101%]"
        ref={marqueeRef}
      >
        <div className="h-full w-[200%] flex" ref={marqueeInnerRef}>
          <div className="flex items-center relative h-full w-[200%] will-change-transform animate-marquee">
            {repeatedMarqueeContent}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowingMenu;