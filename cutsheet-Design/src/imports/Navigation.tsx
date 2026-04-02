import svgPaths from "./svg-h1dhpnr5i2";

function Logo() {
  return (
    <div className="relative shrink-0 size-[19.939px]" data-name="Logo">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.939 19.9388">
        <g id="Logo">
          <g id="Vector">
            <path d={svgPaths.p1f948200} fill="var(--fill-0, white)" fillOpacity="0.49" />
            <path d={svgPaths.p2aeb0d70} stroke="url(#paint0_linear_31_2702)" strokeOpacity="0.5" strokeWidth="0.0645734" />
          </g>
          <path d={svgPaths.p39182a00} fill="var(--fill-0, white)" fillOpacity="0.7" id="Vector_2" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_31_2702" x1="9.96942" x2="9.96942" y1="0" y2="19.9388">
            <stop stopColor="white" stopOpacity="0.5" />
            <stop offset="1" stopColor="#666666" stopOpacity="0.5" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function Text() {
  return (
    <div className="h-[29.04px] relative shrink-0 w-[85.91px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[29.04px] left-0 text-[#f4f4f5] text-[19.36px] top-[0.6px] tracking-[0.484px] whitespace-nowrap">cutsheet</p>
      </div>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="h-[29.04px] relative shrink-0" data-name="LandingPage">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4.84px] h-full items-center relative">
        <Logo />
        <Text />
      </div>
    </div>
  );
}

function LandingPage1() {
  return (
    <div className="bg-[rgba(255,255,255,0.03)] h-[42px] relative rounded-[16777200px] shrink-0 w-[161.07px]" data-name="LandingPage">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[16777200px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Geist:Medium',sans-serif] font-medium leading-[20px] left-[81.5px] text-[#d4d4d8] text-[14px] text-center top-[12px] whitespace-nowrap">Enter Access Code</p>
      </div>
    </div>
  );
}

export default function Navigation() {
  return (
    <div className="bg-[rgba(9,9,11,0.6)] content-stretch flex items-center justify-between pb-px px-[64px] relative size-full" data-name="Navigation">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.04)] border-b border-solid inset-0 pointer-events-none" />
      <LandingPage />
      <LandingPage1 />
    </div>
  );
}