import svgPaths from "./svg-saaeffakjq";

export default function AppIcon() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[156px] pt-[154px] px-[156px] relative rounded-[120px] size-full" data-name="App Icon" style={{ backgroundImage: "linear-gradient(155.709deg, rgb(70, 72, 196) 15.577%, rgb(91, 94, 232) 123.94%)" }}>
      <div className="relative shrink-0 size-[444.64px]" data-name="Logo">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 444.64 444.64">
          <g id="Logo">
            <g id="Vector">
              <path d={svgPaths.p214df500} fill="var(--fill-0, white)" fillOpacity="0.49" />
              <path d={svgPaths.p9278780} stroke="url(#paint0_linear_4_413)" strokeOpacity="0.5" strokeWidth="1.44" />
            </g>
            <path d={svgPaths.p3c99e670} fill="var(--fill-0, white)" fillOpacity="0.7" id="Vector_2" />
          </g>
          <defs>
            <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_4_413" x1="222.32" x2="222.32" y1="0" y2="444.64">
              <stop stopColor="white" stopOpacity="0.5" />
              <stop offset="1" stopColor="#666666" stopOpacity="0.5" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}