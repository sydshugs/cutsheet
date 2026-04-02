import svgPaths from "./svg-akeujvf9kj";
import imgImageAdPreview from "figma:asset/564e348f074c7af2ac74818d467ea893c3c8d860.png";
import { imgCutsheet } from "./svg-m0lg7";

function Heading() {
  return <div className="absolute h-[201.586px] left-[329px] top-0 w-[576px]" data-name="Heading 2" />;
}

function Vector() {
  return (
    <div className="absolute contents inset-0" data-name="Vector">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.5137 12.5137">
        <path d={svgPaths.p351e0a80} fill="var(--fill-0, white)" fillOpacity="0.49" id="Vector" />
      </svg>
      <div className="absolute inset-[0.16%]" data-name="Vector">
        <div className="absolute inset-[-0.16%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.5138 12.5138">
            <path d={svgPaths.p39b5df00} id="Vector" stroke="url(#paint0_linear_81_2243)" strokeOpacity="0.5" strokeWidth="0.0405267" />
            <defs>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_81_2243" x1="6.25688" x2="6.25688" y1="7.68362e-06" y2="12.5138">
                <stop stopColor="white" stopOpacity="0.5" />
                <stop offset="1" stopColor="#666666" stopOpacity="0.5" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="absolute contents inset-0" data-name="Logo">
      <Vector />
      <div className="absolute inset-[0_0_76.47%_76.47%]" data-name="Vector_2">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2.94441 2.94441">
          <path d={svgPaths.p14f7b1c0} fill="var(--fill-0, white)" fillOpacity="0.7" id="Vector_2" />
        </svg>
      </div>
    </div>
  );
}

function Icon() {
  return (
    <div className="h-[12.514px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <Logo />
    </div>
  );
}

function Container3() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[4.39px] size-[12.514px] top-[4.33px]" data-name="Container">
      <Icon />
    </div>
  );
}

function AppIcon() {
  return (
    <div className="h-[21.238px] relative rounded-[79.86px] shrink-0 w-full" data-name="AppIcon" style={{ backgroundImage: "linear-gradient(155.766deg, rgb(70, 72, 196) 21.45%, rgb(91, 94, 232) 111.32%)" }}>
      <Container3 />
    </div>
  );
}

function Container2() {
  return (
    <div className="relative rounded-[5.324px] shrink-0 size-[21.296px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip pr-[0.001px] relative rounded-[inherit] size-full">
        <AppIcon />
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="h-[47.916px] relative shrink-0 w-[145.744px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center pl-[13.31px] relative size-full">
        <Container2 />
      </div>
    </div>
  );
}

function Container4() {
  return <div className="bg-[rgba(255,255,255,0.06)] h-[0.666px] shrink-0 w-[145.744px]" data-name="Container" />;
}

function Container7() {
  return (
    <div className="h-[24.624px] relative shrink-0 w-[129.772px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[9.983px] left-[7.99px] text-[#52525c] text-[6.655px] top-[10.65px] tracking-[0.7986px] uppercase whitespace-nowrap">Analyze</p>
      </div>
    </div>
  );
}

function Icon1() {
  return (
    <div className="absolute left-[7.99px] size-[10.648px] top-[6.65px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.648 10.648">
        <g clipPath="url(#clip0_81_2127)" id="Icon">
          <path d={svgPaths.p319a4900} id="Vector" stroke="var(--stroke-0, #7C86FF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
        </g>
        <defs>
          <clipPath id="clip0_81_2127">
            <rect fill="white" height="10.648" width="10.648" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Link() {
  return (
    <div className="absolute bg-[rgba(99,102,241,0.08)] border-[#6366f1] border-l-[1.331px] border-solid h-[23.958px] left-0 rounded-bl-[2.662px] rounded-br-[5.324px] rounded-tl-[2.662px] rounded-tr-[5.324px] top-0 w-[129.772px]" data-name="Link">
      <Icon1 />
      <p className="absolute font-['Geist:Medium',sans-serif] font-medium leading-[12.977px] left-[25.29px] text-[#a3b3ff] text-[8.652px] top-[5.49px] whitespace-nowrap">Paid Ad</p>
    </div>
  );
}

function NavItem() {
  return (
    <div className="h-[23.958px] relative shrink-0 w-[129.772px]" data-name="NavItem">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Link />
      </div>
    </div>
  );
}

function Icon2() {
  return (
    <div className="absolute left-[9.32px] size-[10.648px] top-[6.65px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.648 10.648">
        <g clipPath="url(#clip0_81_2211)" id="Icon">
          <path d={svgPaths.p13e9be80} id="Vector" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.p170ad400} id="Vector_2" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
        </g>
        <defs>
          <clipPath id="clip0_81_2211">
            <rect fill="white" height="10.648" width="10.648" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Link1() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative rounded-bl-[2.662px] rounded-br-[5.324px] rounded-tl-[2.662px] rounded-tr-[5.324px] w-[129.772px]" data-name="Link">
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0)] border-l-[1.331px] border-solid inset-0 pointer-events-none rounded-bl-[2.662px] rounded-br-[5.324px] rounded-tl-[2.662px] rounded-tr-[5.324px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon2 />
        <p className="absolute font-['Geist:Medium',sans-serif] font-medium leading-[12.977px] left-[26.62px] text-[#9f9fa9] text-[8.652px] top-[5.49px] whitespace-nowrap">Organic</p>
      </div>
    </div>
  );
}

function NavItem1() {
  return (
    <div className="h-[23.958px] relative shrink-0 w-[129.772px]" data-name="NavItem">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Link1 />
      </div>
    </div>
  );
}

function Icon3() {
  return (
    <div className="absolute left-[9.32px] size-[10.648px] top-[6.65px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.648 10.648">
        <g clipPath="url(#clip0_81_2206)" id="Icon">
          <path d={svgPaths.p15193d00} id="Vector" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d="M3.54935 9.3171H7.09868" id="Vector_2" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d="M5.32402 7.54249V9.31716" id="Vector_3" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
        </g>
        <defs>
          <clipPath id="clip0_81_2206">
            <rect fill="white" height="10.648" width="10.648" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Link2() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative rounded-bl-[2.662px] rounded-br-[5.324px] rounded-tl-[2.662px] rounded-tr-[5.324px] w-[129.772px]" data-name="Link">
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0)] border-l-[1.331px] border-solid inset-0 pointer-events-none rounded-bl-[2.662px] rounded-br-[5.324px] rounded-tl-[2.662px] rounded-tr-[5.324px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon3 />
        <p className="absolute font-['Geist:Medium',sans-serif] font-medium leading-[12.977px] left-[26.62px] text-[#9f9fa9] text-[8.652px] top-[5.49px] whitespace-nowrap">Display</p>
      </div>
    </div>
  );
}

function NavItem2() {
  return (
    <div className="h-[23.958px] relative shrink-0 w-[129.772px]" data-name="NavItem">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Link2 />
      </div>
    </div>
  );
}

function Icon4() {
  return (
    <div className="absolute left-[9.32px] size-[10.648px] top-[6.66px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.648 10.648">
        <g id="Icon">
          <path d={svgPaths.p9d9ea0} id="Vector" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.p3fb36b00} id="Vector_2" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.p2fcfbf00} id="Vector_3" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.p212d3ae0} id="Vector_4" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.p26e43e80} id="Vector_5" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.p2f090104} id="Vector_6" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
        </g>
      </svg>
    </div>
  );
}

function Link3() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative rounded-bl-[2.662px] rounded-br-[5.324px] rounded-tl-[2.662px] rounded-tr-[5.324px] w-[129.772px]" data-name="Link">
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0)] border-l-[1.331px] border-solid inset-0 pointer-events-none rounded-bl-[2.662px] rounded-br-[5.324px] rounded-tl-[2.662px] rounded-tr-[5.324px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon4 />
        <p className="absolute font-['Geist:Medium',sans-serif] font-medium leading-[12.977px] left-[26.62px] text-[#9f9fa9] text-[8.652px] top-[5.49px] whitespace-nowrap">Ad Breakdown</p>
      </div>
    </div>
  );
}

function NavItem3() {
  return (
    <div className="h-[23.958px] relative shrink-0 w-[129.772px]" data-name="NavItem">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Link3 />
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="h-[125.779px] relative shrink-0 w-[129.772px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[1.331px] items-start relative size-full">
        <Container7 />
        <NavItem />
        <NavItem1 />
        <NavItem2 />
        <NavItem3 />
      </div>
    </div>
  );
}

function Container9() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[129.772px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[9.983px] left-[7.99px] text-[#52525c] text-[6.655px] top-[10.65px] tracking-[0.7986px] uppercase whitespace-nowrap">Compare</p>
      </div>
    </div>
  );
}

function Icon5() {
  return (
    <div className="absolute left-[9.32px] size-[10.648px] top-[6.66px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.648 10.648">
        <g id="Icon">
          <path d="M2.66201 1.33091V6.65491" id="Vector" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.p2f94ff80} id="Vector_2" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.pecbcd00} id="Vector_3" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.p16c28098} id="Vector_4" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
        </g>
      </svg>
    </div>
  );
}

function Link4() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative rounded-bl-[2.662px] rounded-br-[5.324px] rounded-tl-[2.662px] rounded-tr-[5.324px] w-[129.772px]" data-name="Link">
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0)] border-l-[1.331px] border-solid inset-0 pointer-events-none rounded-bl-[2.662px] rounded-br-[5.324px] rounded-tl-[2.662px] rounded-tr-[5.324px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon5 />
        <p className="absolute font-['Geist:Medium',sans-serif] font-medium leading-[12.977px] left-[26.62px] text-[#9f9fa9] text-[8.652px] top-[5.49px] whitespace-nowrap">A/B Test</p>
      </div>
    </div>
  );
}

function NavItem4() {
  return (
    <div className="h-[23.958px] relative shrink-0 w-[129.772px]" data-name="NavItem">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Link4 />
      </div>
    </div>
  );
}

function Icon6() {
  return (
    <div className="absolute left-[9.32px] size-[10.648px] top-[6.66px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.648 10.648">
        <g id="Icon">
          <path d={svgPaths.p1681580} id="Vector" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.pef61990} id="Vector_2" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.p11835800} id="Vector_3" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.p2e0f9f80} id="Vector_4" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.p3b647f00} id="Vector_5" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.pdfc6a00} id="Vector_6" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.pe4b7b40} id="Vector_7" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.p1e5ed600} id="Vector_8" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
        </g>
      </svg>
    </div>
  );
}

function Link5() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative rounded-bl-[2.662px] rounded-br-[5.324px] rounded-tl-[2.662px] rounded-tr-[5.324px] w-[129.772px]" data-name="Link">
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0)] border-l-[1.331px] border-solid inset-0 pointer-events-none rounded-bl-[2.662px] rounded-br-[5.324px] rounded-tl-[2.662px] rounded-tr-[5.324px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon6 />
        <p className="absolute font-['Geist:Medium',sans-serif] font-medium leading-[12.977px] left-[26.62px] text-[#9f9fa9] text-[8.652px] top-[5.49px] whitespace-nowrap">Competitor</p>
      </div>
    </div>
  );
}

function NavItem5() {
  return (
    <div className="h-[23.958px] relative shrink-0 w-[129.772px]" data-name="NavItem">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Link5 />
      </div>
    </div>
  );
}

function Icon7() {
  return (
    <div className="absolute left-[9.32px] size-[10.648px] top-[6.65px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.648 10.648">
        <g clipPath="url(#clip0_81_2196)" id="Icon">
          <path d={svgPaths.p2f6c0000} id="Vector" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.p2193e100} id="Vector_2" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d="M1.77467 9.76066H8.87334" id="Vector_3" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.p11c1cf00} id="Vector_4" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.p1b214904} id="Vector_5" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.p7a24960} id="Vector_6" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
        </g>
        <defs>
          <clipPath id="clip0_81_2196">
            <rect fill="white" height="10.648" width="10.648" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Link6() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative rounded-bl-[2.662px] rounded-br-[5.324px] rounded-tl-[2.662px] rounded-tr-[5.324px] w-[129.772px]" data-name="Link">
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0)] border-l-[1.331px] border-solid inset-0 pointer-events-none rounded-bl-[2.662px] rounded-br-[5.324px] rounded-tl-[2.662px] rounded-tr-[5.324px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon7 />
        <p className="absolute font-['Geist:Medium',sans-serif] font-medium leading-[12.977px] left-[26.62px] text-[#9f9fa9] text-[8.652px] top-[5.49px] whitespace-nowrap">Rank Creatives</p>
      </div>
    </div>
  );
}

function NavItem6() {
  return (
    <div className="h-[23.958px] relative shrink-0 w-[129.772px]" data-name="NavItem">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Link6 />
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="h-[100.491px] relative shrink-0 w-[129.772px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[1.331px] items-start relative size-full">
        <Container9 />
        <NavItem4 />
        <NavItem5 />
        <NavItem6 />
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[129.772px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[9.983px] left-[7.99px] text-[#52525c] text-[6.655px] top-[10.65px] tracking-[0.7986px] uppercase whitespace-nowrap">Library</p>
      </div>
    </div>
  );
}

function Icon8() {
  return (
    <div className="absolute left-[9.32px] size-[10.648px] top-[6.65px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.648 10.648">
        <g id="Icon">
          <path d={svgPaths.p2c97fd00} id="Vector" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
        </g>
      </svg>
    </div>
  );
}

function Link7() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative rounded-bl-[2.662px] rounded-br-[5.324px] rounded-tl-[2.662px] rounded-tr-[5.324px] w-[129.772px]" data-name="Link">
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0)] border-l-[1.331px] border-solid inset-0 pointer-events-none rounded-bl-[2.662px] rounded-br-[5.324px] rounded-tl-[2.662px] rounded-tr-[5.324px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon8 />
        <p className="absolute font-['Geist:Medium',sans-serif] font-medium leading-[12.977px] left-[26.62px] text-[#9f9fa9] text-[8.652px] top-[5.49px] whitespace-nowrap">Saved Ads</p>
      </div>
    </div>
  );
}

function NavItem7() {
  return (
    <div className="h-[23.958px] relative shrink-0 w-[129.772px]" data-name="NavItem">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Link7 />
      </div>
    </div>
  );
}

function Container10() {
  return (
    <div className="h-[49.912px] relative shrink-0 w-[129.772px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[1.331px] items-start relative size-full">
        <Container11 />
        <NavItem7 />
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="flex-[702_0_0] min-h-px min-w-px relative w-[145.744px]" data-name="Container">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[10.648px] items-start pl-[7.986px] pt-[5.324px] relative size-full">
          <Container6 />
          <Container8 />
          <Container10 />
        </div>
      </div>
    </div>
  );
}

function Icon10() {
  return (
    <div className="absolute inset-[-3.13%_0_3.13%_0]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.648 10.648">
        <g clipPath="url(#clip0_81_2113)" id="Icon">
          <path d={svgPaths.p3a273d80} id="Vector" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.p3dad7c00} id="Vector_2" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d="M5.32399 7.54247H5.32733" id="Vector_3" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
        </g>
        <defs>
          <clipPath id="clip0_81_2113">
            <rect fill="white" height="10.648" width="10.648" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Icon9() {
  return (
    <div className="absolute left-[7.99px] overflow-clip size-[10.648px] top-[6.65px]" data-name="Icon">
      <Icon10 />
    </div>
  );
}

function Button() {
  return (
    <div className="h-[23.958px] relative rounded-[5.324px] shrink-0 w-full" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon9 />
        <p className="absolute font-['Geist:Medium',sans-serif] font-medium leading-[12.977px] left-[25.29px] text-[#9f9fa9] text-[8.652px] top-[5.49px] whitespace-nowrap">{`Help & support`}</p>
      </div>
    </div>
  );
}

function Icon11() {
  return (
    <div className="absolute left-[7.99px] size-[10.648px] top-[6.66px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.648 10.648">
        <g clipPath="url(#clip0_81_2186)" id="Icon">
          <path d={svgPaths.p14ddbd00} id="Vector" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.p8348580} id="Vector_2" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
        </g>
        <defs>
          <clipPath id="clip0_81_2186">
            <rect fill="white" height="10.648" width="10.648" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Button1() {
  return (
    <div className="h-[23.958px] relative rounded-[5.324px] shrink-0 w-full" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon11 />
        <p className="-translate-x-1/2 absolute font-['Geist:Medium',sans-serif] font-medium leading-[12.977px] left-[42.29px] text-[#9f9fa9] text-[8.652px] text-center top-[5.49px] whitespace-nowrap">Settings</p>
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[129.772px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2.662px] items-start justify-center relative size-full">
        <Button />
        <Button1 />
      </div>
    </div>
  );
}

function Container12() {
  return (
    <div className="h-[109.142px] relative shrink-0 w-[145.744px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.04)] border-solid border-t-[0.666px] inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[10.648px] pl-[7.986px] pt-[11.314px] relative size-full">
        <Container13 />
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="bg-[#111113] h-[624.905px] relative shrink-0 w-[146.41px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.06)] border-r-[0.666px] border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pr-[0.666px] relative size-full">
        <Container1 />
        <Container4 />
        <Container5 />
        <Container12 />
      </div>
    </div>
  );
}

function Heading1() {
  return <div className="h-[13.976px] shrink-0 w-[73.512px]" data-name="Heading 2" />;
}

function Container17() {
  return (
    <div className="bg-[rgba(99,102,241,0.1)] relative rounded-[3.328px] shrink-0 w-[36.603px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0.666px] border-[rgba(99,102,241,0.2)] border-solid inset-0 pointer-events-none rounded-[3.328px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[7.986px] py-[3.328px] relative w-full">
        <p className="font-['Geist:Medium',sans-serif] font-medium leading-[11.979px] relative shrink-0 text-[#818cf8] text-[7.986px] w-[22.7px]">● Pro</p>
      </div>
    </div>
  );
}

function Text() {
  return (
    <div className="h-[9.983px] relative shrink-0 w-[4.352px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:Medium',sans-serif] font-medium leading-[9.983px] left-0 text-[#a3b3ff] text-[6.655px] top-0 whitespace-nowrap">S</p>
      </div>
    </div>
  );
}

function Container18() {
  return (
    <div className="bg-[rgba(99,102,241,0.2)] relative rounded-[11165227px] shrink-0 size-[18.634px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0.666px] border-[rgba(99,102,241,0.3)] border-solid inset-0 pointer-events-none rounded-[11165227px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center pl-[5.808px] pr-[5.813px] py-[0.666px] relative size-full">
        <Text />
      </div>
    </div>
  );
}

function Container16() {
  return (
    <div className="h-[18.634px] relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[10.648px] h-full items-center relative">
        <Container17 />
        <Container18 />
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="absolute content-stretch flex h-[31.944px] items-center justify-between left-0 pb-[0.666px] px-[15.972px] top-0 w-[765.325px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.06)] border-b-[0.666px] border-solid inset-0 pointer-events-none" />
      <Heading1 />
      <Container16 />
    </div>
  );
}

function Container20() {
  return <div className="absolute h-[557.689px] left-0 top-0 w-[765.325px]" data-name="Container" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 765.33 557.69\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(0 -63.095 -86.587 0 153.06 111.54)\\'><stop stop-color=\\'rgba(99,102,241,0.06)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(0,0,0,0)\\' offset=\\'0.5\\'/></radialGradient></defs></svg>'), url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 765.33 557.69\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(0 -63.095 -86.587 0 612.26 446.15)\\'><stop stop-color=\\'rgba(99,102,241,0.04)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(0,0,0,0)\\' offset=\\'0.4\\'/></radialGradient></defs></svg>')" }} />;
}

function Icon12() {
  return (
    <div className="relative shrink-0 size-[10.648px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.648 10.648">
        <g clipPath="url(#clip0_81_2172)" id="Icon">
          <path d={svgPaths.p16680a00} id="Vector" stroke="var(--stroke-0, #6366F1)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.p39292ff0} id="Vector_2" stroke="var(--stroke-0, #6366F1)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d="M2.2184 2.66201V4.43668" id="Vector_3" stroke="var(--stroke-0, #6366F1)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d="M8.42966 6.2115V7.98617" id="Vector_4" stroke="var(--stroke-0, #6366F1)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d="M4.43659 0.887402V1.77474" id="Vector_5" stroke="var(--stroke-0, #6366F1)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d="M3.10562 3.54945H1.33096" id="Vector_6" stroke="var(--stroke-0, #6366F1)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d="M9.31703 7.09854H7.54236" id="Vector_7" stroke="var(--stroke-0, #6366F1)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d="M4.88034 1.33092H3.99301" id="Vector_8" stroke="var(--stroke-0, #6366F1)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
        </g>
        <defs>
          <clipPath id="clip0_81_2172">
            <rect fill="white" height="10.648" width="10.648" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Container24() {
  return (
    <div className="bg-[rgba(99,102,241,0.15)] flex-[1_0_0] min-h-px min-w-px relative rounded-[15.972px] w-[26.62px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[7.986px] relative size-full">
        <Icon12 />
      </div>
    </div>
  );
}

function Text1() {
  return (
    <div className="h-[13.31px] relative shrink-0 w-[44.422px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Geist:Medium',sans-serif] font-medium leading-[13.31px] left-[22.5px] text-[#e4e4e7] text-[9.317px] text-center top-0 whitespace-nowrap">AI Rewrite</p>
      </div>
    </div>
  );
}

function ToolCard() {
  return (
    <div className="bg-[#18181b] col-1 justify-self-stretch relative rounded-[10.648px] row-1 self-stretch shrink-0" data-name="ToolCard">
      <div aria-hidden="true" className="absolute border-[0.666px] border-[rgba(255,255,255,0.06)] border-solid inset-0 pointer-events-none rounded-[10.648px]" />
      <div className="flex flex-col items-center size-full">
        <div className="content-stretch flex flex-col gap-[7.986px] items-center px-[0.666px] py-[13.976px] relative size-full">
          <Container24 />
          <Text1 />
        </div>
      </div>
    </div>
  );
}

function Icon13() {
  return (
    <div className="relative shrink-0 size-[10.648px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.648 10.648">
        <g clipPath="url(#clip0_81_2155)" id="Icon">
          <path d={svgPaths.p980c980} id="Vector" stroke="var(--stroke-0, #10B981)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d="M8.87333 1.33092V3.10559" id="Vector_2" stroke="var(--stroke-0, #10B981)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d="M9.76076 2.21836H7.98609" id="Vector_3" stroke="var(--stroke-0, #10B981)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d="M1.77482 7.54246V8.42979" id="Vector_4" stroke="var(--stroke-0, #10B981)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d="M2.21844 7.98597H1.3311" id="Vector_5" stroke="var(--stroke-0, #10B981)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
        </g>
        <defs>
          <clipPath id="clip0_81_2155">
            <rect fill="white" height="10.648" width="10.648" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Container25() {
  return (
    <div className="bg-[rgba(16,185,129,0.15)] flex-[1_0_0] min-h-px min-w-px relative rounded-[15.972px] w-[26.62px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[7.986px] relative size-full">
        <Icon13 />
      </div>
    </div>
  );
}

function Text2() {
  return (
    <div className="h-[13.31px] relative shrink-0 w-[39.342px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Geist:Medium',sans-serif] font-medium leading-[13.31px] left-[20px] text-[#e4e4e7] text-[9.317px] text-center top-0 whitespace-nowrap">Visualize</p>
      </div>
    </div>
  );
}

function ToolCard1() {
  return (
    <div className="bg-[#18181b] col-2 justify-self-stretch relative rounded-[10.648px] row-1 self-stretch shrink-0" data-name="ToolCard">
      <div aria-hidden="true" className="absolute border-[0.666px] border-[rgba(255,255,255,0.06)] border-solid inset-0 pointer-events-none rounded-[10.648px]" />
      <div className="flex flex-col items-center size-full">
        <div className="content-stretch flex flex-col gap-[7.986px] items-center px-[0.666px] py-[13.976px] relative size-full">
          <Container25 />
          <Text2 />
        </div>
      </div>
    </div>
  );
}

function Icon14() {
  return (
    <div className="relative shrink-0 size-[10.648px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.648 10.648">
        <g clipPath="url(#clip0_81_2168)" id="Icon">
          <path d={svgPaths.p8da5a80} id="Vector" stroke="var(--stroke-0, #F59E0B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.p10a34980} id="Vector_2" stroke="var(--stroke-0, #F59E0B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
        </g>
        <defs>
          <clipPath id="clip0_81_2168">
            <rect fill="white" height="10.648" width="10.648" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Container26() {
  return (
    <div className="bg-[rgba(245,158,11,0.15)] flex-[1_0_0] min-h-px min-w-px relative rounded-[15.972px] w-[26.62px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[7.986px] relative size-full">
        <Icon14 />
      </div>
    </div>
  );
}

function Text3() {
  return (
    <div className="h-[13.31px] relative shrink-0 w-[56.682px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Geist:Medium',sans-serif] font-medium leading-[13.31px] left-[28.5px] text-[#e4e4e7] text-[9.317px] text-center top-0 whitespace-nowrap">Policy Check</p>
      </div>
    </div>
  );
}

function ToolCard2() {
  return (
    <div className="bg-[#18181b] col-3 justify-self-stretch relative rounded-[10.648px] row-1 self-stretch shrink-0" data-name="ToolCard">
      <div aria-hidden="true" className="absolute border-[0.666px] border-[rgba(255,255,255,0.06)] border-solid inset-0 pointer-events-none rounded-[10.648px]" />
      <div className="flex flex-col items-center size-full">
        <div className="content-stretch flex flex-col gap-[7.986px] items-center px-[0.666px] py-[13.976px] relative size-full">
          <Container26 />
          <Text3 />
        </div>
      </div>
    </div>
  );
}

function Icon15() {
  return (
    <div className="relative shrink-0 size-[10.648px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.648 10.648">
        <g clipPath="url(#clip0_81_2103)" id="Icon">
          <path d={svgPaths.p37941270} id="Vector" stroke="var(--stroke-0, #0EA5E9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d="M9.76059 5.32406H7.98593" id="Vector_2" stroke="var(--stroke-0, #0EA5E9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d="M2.66189 5.32406H0.887219" id="Vector_3" stroke="var(--stroke-0, #0EA5E9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d="M5.32394 2.66207V0.887402" id="Vector_4" stroke="var(--stroke-0, #0EA5E9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d="M5.32394 9.76064V7.98597" id="Vector_5" stroke="var(--stroke-0, #0EA5E9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
        </g>
        <defs>
          <clipPath id="clip0_81_2103">
            <rect fill="white" height="10.648" width="10.648" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Container27() {
  return (
    <div className="bg-[rgba(14,165,233,0.15)] flex-[1_0_0] min-h-px min-w-px relative rounded-[15.972px] w-[26.62px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[7.986px] relative size-full">
        <Icon15 />
      </div>
    </div>
  );
}

function Text4() {
  return (
    <div className="h-[13.31px] relative shrink-0 w-[43.278px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Geist:Medium',sans-serif] font-medium leading-[13.31px] left-[22px] text-[#e4e4e7] text-[9.317px] text-center top-0 whitespace-nowrap">Safe Zone</p>
      </div>
    </div>
  );
}

function ToolCard3() {
  return (
    <div className="bg-[#18181b] col-4 justify-self-stretch relative rounded-[10.648px] row-1 self-stretch shrink-0" data-name="ToolCard">
      <div aria-hidden="true" className="absolute border-[0.666px] border-[rgba(255,255,255,0.06)] border-solid inset-0 pointer-events-none rounded-[10.648px]" />
      <div className="flex flex-col items-center size-full">
        <div className="content-stretch flex flex-col gap-[7.986px] items-center px-[0.666px] py-[13.976px] relative size-full">
          <Container27 />
          <Text4 />
        </div>
      </div>
    </div>
  );
}

function Container23() {
  return (
    <div className="absolute gap-x-[7.986001014709473px] gap-y-[7.986001014709473px] grid grid-cols-[repeat(4,minmax(0,1fr))] grid-rows-[repeat(1,minmax(0,1fr))] h-[75.867px] left-0 top-[287.5px] w-[490.474px]" data-name="Container">
      <ToolCard />
      <ToolCard1 />
      <ToolCard2 />
      <ToolCard3 />
    </div>
  );
}

function Icon16() {
  return (
    <div className="relative shrink-0 size-[7.986px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.986 7.986">
        <g clipPath="url(#clip0_81_2139)" id="Icon">
          <path d={svgPaths.p1d1e6800} id="Vector" stroke="var(--stroke-0, #10B981)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.831875" />
          <path d={svgPaths.p240e0040} id="Vector_2" stroke="var(--stroke-0, #10B981)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.776417" />
        </g>
        <defs>
          <clipPath id="clip0_81_2139">
            <rect fill="white" height="7.986" width="7.986" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text5() {
  return (
    <div className="flex-[1_0_0] h-[9.983px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:Bold',sans-serif] font-bold leading-[9.983px] left-0 text-[#10b981] text-[6.655px] top-0 tracking-[0.6655px] uppercase whitespace-nowrap">Ready</p>
      </div>
    </div>
  );
}

function Container30() {
  return (
    <div className="bg-[rgba(16,185,129,0.1)] h-[16.638px] relative rounded-[11165227px] shrink-0 w-[50.578px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0.666px] border-[rgba(16,185,129,0.2)] border-solid inset-0 pointer-events-none rounded-[11165227px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[3.993px] items-center px-[7.321px] py-[0.666px] relative size-full">
        <Icon16 />
        <Text5 />
      </div>
    </div>
  );
}

function Container31() {
  return <div className="bg-[rgba(255,255,255,0.2)] rounded-[11165227px] shrink-0 size-[2.662px]" data-name="Container" />;
}

function Text6() {
  return (
    <div className="h-[10.648px] relative shrink-0 w-[68.916px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Geist:Medium',sans-serif] font-medium leading-[10.648px] relative shrink-0 text-[#71717b] text-[7.986px] tracking-[0.1997px] uppercase whitespace-nowrap">2 Critical Fixes</p>
      </div>
    </div>
  );
}

function Container29() {
  return (
    <div className="h-[16.638px] relative shrink-0 w-[157.594px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[7.986px] items-center relative size-full">
        <Container30 />
        <Container31 />
        <Text6 />
      </div>
    </div>
  );
}

function Container28() {
  return (
    <div className="h-[35.937px] relative shrink-0 w-[489.142px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.04)] border-b-[0.666px] border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center pb-[0.666px] pl-[13.31px] relative size-full">
        <Container29 />
      </div>
    </div>
  );
}

function Heading2() {
  return (
    <div className="absolute h-[32.942px] left-[13.31px] top-[13.31px] w-[462.523px]" data-name="Heading 2">
      <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[16.471px] left-0 text-[#f4f4f5] text-[11.979px] top-[-0.33px] tracking-[-0.2995px] w-[428.582px]">Strong visual hook and clear messaging for a niche audience, ready for testing.</p>
    </div>
  );
}

function Icon17() {
  return (
    <div className="absolute left-0 size-[8.652px] top-[0.67px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.6515 8.6515">
        <g clipPath="url(#clip0_81_2238)" id="Icon">
          <path d={svgPaths.p6c47080} id="Vector" stroke="var(--stroke-0, #F59E0B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.720958" />
          <path d="M4.32574 2.88383V4.32574" id="Vector_2" stroke="var(--stroke-0, #F59E0B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.720958" />
          <path d="M4.32574 5.76757H4.32845" id="Vector_3" stroke="var(--stroke-0, #F59E0B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.720958" />
        </g>
        <defs>
          <clipPath id="clip0_81_2238">
            <rect fill="white" height="8.6515" width="8.6515" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text7() {
  return (
    <div className="absolute h-[9.983px] left-[13.98px] top-0 w-[45.701px]" data-name="Text">
      <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[9.983px] left-0 text-[#fe9a00] text-[6.655px] top-0 tracking-[0.3328px] uppercase whitespace-nowrap">PRIORITY FIX</p>
    </div>
  );
}

function Icon18() {
  return (
    <div className="absolute left-[432.58px] size-[7.321px] top-[1.33px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.3205 7.3205">
        <g id="Icon">
          <path d={svgPaths.p3b593c60} id="Vector" stroke="var(--stroke-0, #FE9A00)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.610042" />
        </g>
      </svg>
    </div>
  );
}

function Container34() {
  return (
    <div className="h-[9.983px] relative shrink-0 w-full" data-name="Container">
      <Icon17 />
      <Text7 />
      <Icon18 />
    </div>
  );
}

function Paragraph() {
  return (
    <div className="h-[15.307px] relative shrink-0 w-full" data-name="Paragraph">
      <p className="absolute font-['Geist:Regular',sans-serif] font-normal leading-[15.14px] left-0 text-[#e4e4e7] text-[9.317px] top-0 whitespace-nowrap">Increase tracking by 0.05em for better readability</p>
    </div>
  );
}

function Container33() {
  return (
    <div className="absolute bg-[rgba(254,154,0,0.04)] content-stretch flex flex-col gap-[5.324px] h-[45.254px] items-start left-[13.31px] pb-[0.666px] pt-[8.652px] px-[11.314px] rounded-[7.986px] top-[41.26px] w-[462.523px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0.666px] border-[rgba(254,154,0,0.2)] border-solid inset-0 pointer-events-none rounded-[7.986px]" />
      <Container34 />
      <Paragraph />
    </div>
  );
}

function Text8() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.1)] h-[9.317px] left-[21.59px] rounded-[3.993px] top-[5.49px] w-[12.229px]" data-name="Text">
      <p className="-translate-x-1/2 absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[6.655px] left-[6.49px] text-[6.655px] text-center text-white top-px whitespace-nowrap">3</p>
    </div>
  );
}

function Button2() {
  return (
    <div className="bg-[rgba(255,255,255,0.04)] h-[20.298px] relative rounded-[11165227px] shrink-0 w-[42.467px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-[0.666px] border-[rgba(255,255,255,0.12)] border-solid inset-0 pointer-events-none rounded-[11165227px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Geist:Medium',sans-serif] font-medium leading-[10.981px] left-[13.15px] text-[#e4e4e7] text-[7.321px] text-center top-[4.66px] whitespace-nowrap">All</p>
        <Text8 />
      </div>
    </div>
  );
}

function Button3() {
  return (
    <div className="h-[20.298px] relative rounded-[11165227px] shrink-0 w-[49.861px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-[0.666px] border-[rgba(255,255,255,0.04)] border-solid inset-0 pointer-events-none rounded-[11165227px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center px-[8.652px] py-[4.659px] relative size-full">
        <p className="font-['Geist:Medium',sans-serif] font-medium leading-[10.981px] relative shrink-0 text-[#71717b] text-[7.321px] text-center whitespace-nowrap">Hierarchy</p>
      </div>
    </div>
  );
}

function Button4() {
  return (
    <div className="h-[20.298px] relative rounded-[11165227px] shrink-0 w-[57.316px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-[0.666px] border-[rgba(255,255,255,0.04)] border-solid inset-0 pointer-events-none rounded-[11165227px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center px-[8.652px] py-[4.659px] relative size-full">
        <p className="font-['Geist:Medium',sans-serif] font-medium leading-[10.981px] relative shrink-0 text-[#71717b] text-[7.321px] text-center whitespace-nowrap">Typography</p>
      </div>
    </div>
  );
}

function Button5() {
  return (
    <div className="h-[20.298px] relative rounded-[11165227px] shrink-0 w-[40.699px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-[0.666px] border-[rgba(255,255,255,0.04)] border-solid inset-0 pointer-events-none rounded-[11165227px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center px-[8.652px] py-[4.659px] relative size-full">
        <p className="font-['Geist:Medium',sans-serif] font-medium leading-[10.981px] relative shrink-0 text-[#71717b] text-[7.321px] text-center whitespace-nowrap">Layout</p>
      </div>
    </div>
  );
}

function Button6() {
  return (
    <div className="h-[20.298px] relative rounded-[11165227px] shrink-0 w-[47.209px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-[0.666px] border-[rgba(255,255,255,0.04)] border-solid inset-0 pointer-events-none rounded-[11165227px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center px-[8.652px] py-[4.659px] relative size-full">
        <p className="font-['Geist:Medium',sans-serif] font-medium leading-[10.981px] relative shrink-0 text-[#71717b] text-[7.321px] text-center whitespace-nowrap">Contrast</p>
      </div>
    </div>
  );
}

function Container35() {
  return (
    <div className="absolute content-stretch flex gap-[5.324px] h-[22.96px] items-start left-[10.65px] overflow-clip pl-[2.662px] top-[99.82px] w-[467.846px]" data-name="Container">
      <Button2 />
      <Button3 />
      <Button4 />
      <Button5 />
      <Button6 />
    </div>
  );
}

function Icon19() {
  return (
    <div className="h-[9.317px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[8.34%_12.5%]" data-name="Vector">
        <div className="absolute inset-[-5%_-5.56%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.76417 8.53899">
            <path d={svgPaths.p459200} id="Vector" stroke="var(--stroke-0, #00D492)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.776417" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-1/2 left-[13.75%] right-[13.75%] top-[29.17%]" data-name="Vector">
        <div className="absolute inset-[-20%_-5.75%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.53137 2.71752">
            <path d={svgPaths.p17b37a44} id="Vector" stroke="var(--stroke-0, #00D492)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.776417" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-[8.33%] left-1/2 right-1/2 top-1/2" data-name="Vector">
        <div className="absolute inset-[-10%_-0.39px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 0.776417 4.6585">
            <path d="M0.388208 4.27029V0.388208" id="Vector" stroke="var(--stroke-0, #00D492)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.776417" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container38() {
  return (
    <div className="absolute bg-[rgba(0,188,125,0.1)] content-stretch flex flex-col items-start left-0 pt-[3.993px] px-[3.993px] rounded-[3.993px] size-[17.303px] top-0" data-name="Container">
      <Icon19 />
    </div>
  );
}

function Text9() {
  return (
    <div className="absolute content-stretch flex h-[10.648px] items-start left-[25.29px] top-[3.33px] w-[26.126px]" data-name="Text">
      <p className="font-['Geist:SemiBold',sans-serif] font-semibold leading-[10.648px] relative shrink-0 text-[#d4d4d8] text-[7.986px] whitespace-nowrap">Layout</p>
    </div>
  );
}

function Text10() {
  return (
    <div className="absolute bg-[rgba(251,44,54,0.1)] h-[11.646px] left-[391.66px] rounded-[2.662px] top-[2.83px] w-[50.9px]" data-name="Text">
      <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[8.984px] left-[3.99px] text-[#ff6467] text-[5.99px] top-[1.33px] uppercase whitespace-nowrap">HIGH PRIORITY</p>
    </div>
  );
}

function Container37() {
  return (
    <div className="h-[17.303px] relative shrink-0 w-[442.558px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container38 />
        <Text9 />
        <Text10 />
      </div>
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="h-[17.303px] relative shrink-0 w-[442.558px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:Regular',sans-serif] font-normal leading-[14.059px] left-[25.29px] text-[#d4d4d8] text-[8.652px] top-0 w-[404.624px]">Align CTA center with text block center</p>
      </div>
    </div>
  );
}

function FixRow() {
  return (
    <div className="absolute bg-[#18181b] content-stretch flex flex-col gap-[6.655px] h-[72.04px] items-start left-0 pl-[9.983px] pr-[0.666px] py-[9.983px] rounded-[7.986px] top-[-2.66px] w-[462.523px]" data-name="FixRow">
      <div aria-hidden="true" className="absolute border-[0.666px] border-[rgba(255,255,255,0.06)] border-solid inset-0 pointer-events-none rounded-[7.986px] shadow-[0px_0.666px_1.997px_0px_rgba(0,0,0,0.1),0px_0.666px_1.331px_0px_rgba(0,0,0,0.1)]" />
      <Container37 />
      <Paragraph1 />
    </div>
  );
}

function Icon20() {
  return (
    <div className="h-[9.317px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute bottom-1/2 left-[8.35%] right-[8.26%] top-[8.33%]" data-name="Vector">
        <div className="absolute inset-[-10%_-5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.54566 4.65878">
            <path d={svgPaths.p2132eb00} id="Vector" stroke="var(--stroke-0, #6366F1)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.776417" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-[29.18%] left-[8.33%] right-[8.33%] top-1/2" data-name="Vector">
        <div className="absolute inset-[-20.01%_-5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.5406 2.71672">
            <path d={svgPaths.p2d9a3800} id="Vector" stroke="var(--stroke-0, #6366F1)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.776417" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[70.83%_8.33%_8.34%_8.33%]" data-name="Vector">
        <div className="absolute inset-[-20.01%_-5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.5406 2.71672">
            <path d={svgPaths.p2d9a3800} id="Vector" stroke="var(--stroke-0, #6366F1)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.776417" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Container40() {
  return (
    <div className="absolute bg-[rgba(99,102,241,0.1)] content-stretch flex flex-col items-start left-0 pt-[3.993px] px-[3.993px] rounded-[3.993px] size-[17.303px] top-0" data-name="Container">
      <Icon20 />
    </div>
  );
}

function Text11() {
  return (
    <div className="absolute content-stretch flex h-[10.648px] items-start left-[25.29px] top-[3.33px] w-[36.514px]" data-name="Text">
      <p className="font-['Geist:SemiBold',sans-serif] font-semibold leading-[10.648px] relative shrink-0 text-[#d4d4d8] text-[7.986px] whitespace-nowrap">Hierarchy</p>
    </div>
  );
}

function Text12() {
  return (
    <div className="absolute bg-[rgba(251,44,54,0.1)] h-[11.646px] left-[391.66px] rounded-[2.662px] top-[2.83px] w-[50.9px]" data-name="Text">
      <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[8.984px] left-[3.99px] text-[#ff6467] text-[5.99px] top-[1.33px] uppercase whitespace-nowrap">HIGH PRIORITY</p>
    </div>
  );
}

function Container39() {
  return (
    <div className="h-[17.303px] relative shrink-0 w-[442.558px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container40 />
        <Text11 />
        <Text12 />
      </div>
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[442.558px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:Regular',sans-serif] font-normal leading-[14.059px] left-[25.29px] text-[#d4d4d8] text-[8.652px] top-0 w-[405.29px]">Brand logo is completely lost in the opening frames. Move to top left and ensure it persists through the hook.</p>
      </div>
    </div>
  );
}

function FixRow1() {
  return (
    <div className="absolute bg-[#18181b] content-stretch flex flex-col gap-[6.655px] h-[72.04px] items-start left-0 pl-[9.983px] pr-[0.666px] py-[9.983px] rounded-[15.972px] top-[78.7px] w-[462.523px]" data-name="FixRow">
      <div aria-hidden="true" className="absolute border-[0.666px] border-[rgba(255,255,255,0.06)] border-solid inset-0 pointer-events-none rounded-[15.972px] shadow-[0px_0.666px_1.997px_0px_rgba(0,0,0,0.1),0px_0.666px_1.331px_0px_rgba(0,0,0,0.1)]" />
      <Container39 />
      <Paragraph2 />
    </div>
  );
}

function Container36() {
  return (
    <div className="absolute h-[229.431px] left-[13.31px] top-[129.11px] w-[462.523px]" data-name="Container">
      <FixRow />
      <FixRow1 />
    </div>
  );
}

function Container32() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[489.142px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Heading2 />
        <Container33 />
        <Container35 />
        <Container36 />
      </div>
    </div>
  );
}

function DesignReviewCard() {
  return (
    <div className="absolute bg-[#18181b] h-[460.027px] left-0 rounded-[10.648px] top-[371.35px] w-[490.474px]" data-name="DesignReviewCard">
      <div className="content-stretch flex flex-col items-start overflow-clip p-[0.666px] relative rounded-[inherit] size-full">
        <Container28 />
        <Container32 />
      </div>
      <div aria-hidden="true" className="absolute border-[0.666px] border-[rgba(255,255,255,0.06)] border-solid inset-0 pointer-events-none rounded-[10.648px]" />
    </div>
  );
}

function Icon21() {
  return (
    <div className="relative shrink-0 size-[10.648px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.648 10.648">
        <g id="Icon">
          <path d={svgPaths.pa367940} id="Vector" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.p36b08440} id="Vector_2" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.p23a6b300} id="Vector_3" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.p1724bf00} id="Vector_4" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
        </g>
      </svg>
    </div>
  );
}

function Text13() {
  return (
    <div className="h-[10.981px] relative shrink-0 w-[77.863px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[10.981px] left-0 text-[#71717b] text-[7.321px] top-0 tracking-[0.8785px] uppercase whitespace-nowrap">Motion Concept</p>
      </div>
    </div>
  );
}

function Container41() {
  return (
    <div className="absolute content-stretch flex gap-[5.324px] h-[10.981px] items-center left-[15.97px] top-[15.97px] w-[457.199px]" data-name="Container">
      <Icon21 />
      <Text13 />
    </div>
  );
}

function Container45() {
  return <div className="bg-[#615fff] rounded-[11165227px] shrink-0 size-[3.993px]" data-name="Container" />;
}

function Text14() {
  return (
    <div className="h-[11.979px] relative shrink-0 w-[38.901px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:Bold',sans-serif] font-bold leading-[11.979px] left-0 text-[#615fff] text-[7.986px] top-0 tracking-[0.3993px] uppercase whitespace-nowrap">OPENING</p>
      </div>
    </div>
  );
}

function Container44() {
  return (
    <div className="absolute content-stretch flex gap-[7.986px] h-[11.979px] items-center left-0 top-[2.66px] w-[93.17px]" data-name="Container">
      <Container45 />
      <Text14 />
    </div>
  );
}

function Text15() {
  return (
    <div className="h-[11.979px] relative shrink-0 w-[206.69px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['SFMono-Regular:Regular',sans-serif] leading-[11.979px] left-0 not-italic text-[#71717b] text-[7.986px] top-[-0.33px] whitespace-nowrap">0–2s</p>
      </div>
    </div>
  );
}

function Text16() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[206.69px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:Regular',sans-serif] font-normal leading-[13.976px] left-0 text-[#e4e4e7] text-[9.317px] top-[0.33px] whitespace-nowrap">Fast-paced jump cuts. High contrast visual hook.</p>
      </div>
    </div>
  );
}

function Container46() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[3.993px] h-[29.948px] items-start left-[103.82px] top-0 w-[206.69px]" data-name="Container">
      <Text15 />
      <Text16 />
    </div>
  );
}

function Container43() {
  return (
    <div className="h-[43.257px] relative shrink-0 w-[457.199px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container44 />
        <Container46 />
      </div>
    </div>
  );
}

function Container49() {
  return <div className="bg-[#00bc7d] rounded-[11165227px] shrink-0 size-[3.993px]" data-name="Container" />;
}

function Text17() {
  return (
    <div className="h-[11.979px] relative shrink-0 w-[52.055px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:Bold',sans-serif] font-bold leading-[11.979px] left-0 text-[#00bc7d] text-[7.986px] top-0 tracking-[0.3993px] uppercase whitespace-nowrap">TRANSITION</p>
      </div>
    </div>
  );
}

function Container48() {
  return (
    <div className="absolute content-stretch flex gap-[7.986px] h-[11.979px] items-center left-0 top-[16.64px] w-[93.17px]" data-name="Container">
      <Container49 />
      <Text17 />
    </div>
  );
}

function Text18() {
  return (
    <div className="h-[11.979px] relative shrink-0 w-[213.22px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['SFMono-Regular:Regular',sans-serif] leading-[11.979px] left-0 not-italic text-[#71717b] text-[7.986px] top-[-0.33px] whitespace-nowrap">2–5s</p>
      </div>
    </div>
  );
}

function Text19() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[213.22px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:Regular',sans-serif] font-normal leading-[13.976px] left-0 text-[#e4e4e7] text-[9.317px] top-[0.33px] whitespace-nowrap">Quick UI zoom. Satisfying synchronized audio cue.</p>
      </div>
    </div>
  );
}

function Container50() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[3.993px] h-[29.948px] items-start left-[103.82px] top-[13.98px] w-[213.22px]" data-name="Container">
      <Text18 />
      <Text19 />
    </div>
  );
}

function Container47() {
  return (
    <div className="h-[57.233px] relative shrink-0 w-[457.199px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.04)] border-solid border-t-[0.666px] inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container48 />
        <Container50 />
      </div>
    </div>
  );
}

function Container53() {
  return <div className="bg-[#fe9a00] rounded-[11165227px] shrink-0 size-[3.993px]" data-name="Container" />;
}

function Text20() {
  return (
    <div className="h-[11.979px] relative shrink-0 w-[32.547px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:Bold',sans-serif] font-bold leading-[11.979px] left-0 text-[#fe9a00] text-[7.986px] top-0 tracking-[0.3993px] uppercase whitespace-nowrap">PAYOFF</p>
      </div>
    </div>
  );
}

function Container52() {
  return (
    <div className="absolute content-stretch flex gap-[7.986px] h-[11.979px] items-center left-0 top-[16.64px] w-[93.17px]" data-name="Container">
      <Container53 />
      <Text20 />
    </div>
  );
}

function Text21() {
  return (
    <div className="h-[11.979px] relative shrink-0 w-[194.492px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['SFMono-Regular:Regular',sans-serif] leading-[11.979px] left-0 not-italic text-[#71717b] text-[7.986px] top-[-0.33px] whitespace-nowrap">5–8s</p>
      </div>
    </div>
  );
}

function Text22() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[194.492px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:Regular',sans-serif] font-normal leading-[13.976px] left-0 text-[#e4e4e7] text-[9.317px] top-[0.33px] whitespace-nowrap">Pulsing CTA button. Instant offer presentation.</p>
      </div>
    </div>
  );
}

function Container54() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[3.993px] h-[29.948px] items-start left-[103.82px] top-[13.98px] w-[194.492px]" data-name="Container">
      <Text21 />
      <Text22 />
    </div>
  );
}

function Container51() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[457.199px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.04)] border-solid border-t-[0.666px] inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container52 />
        <Container54 />
      </div>
    </div>
  );
}

function Container42() {
  return (
    <div className="absolute content-stretch flex flex-col h-[157.724px] items-start left-[15.97px] top-[42.92px] w-[457.199px]" data-name="Container">
      <Container43 />
      <Container47 />
      <Container51 />
    </div>
  );
}

function Icon22() {
  return (
    <div className="relative shrink-0 size-[10.648px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.648 10.648">
        <g clipPath="url(#clip0_81_2182)" id="Icon">
          <path d={svgPaths.p18fa9080} id="Vector" stroke="var(--stroke-0, #7C86FF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.p19c71600} id="Vector_2" stroke="var(--stroke-0, #7C86FF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
        </g>
        <defs>
          <clipPath id="clip0_81_2182">
            <rect fill="white" height="10.648" width="10.648" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text23() {
  return (
    <div className="h-[13.976px] relative shrink-0 w-[222.771px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:Regular',sans-serif] font-normal leading-[0] left-0 text-[#9f9fa9] text-[0px] top-[0.33px] whitespace-nowrap">
          <span className="leading-[13.976px] text-[9.317px]">{`Motion ads drive `}</span>
          <span className="font-['Geist:Medium',sans-serif] font-medium leading-[13.976px] text-[#e4e4e7] text-[9.317px]">2–3x higher engagement</span>
          <span className="leading-[13.976px] text-[9.317px]">{` vs static.`}</span>
        </p>
      </div>
    </div>
  );
}

function Container56() {
  return (
    <div className="h-[13.976px] relative shrink-0 w-[457.199px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[5.324px] items-center relative size-full">
        <Icon22 />
        <Text23 />
      </div>
    </div>
  );
}

function Icon23() {
  return (
    <div className="absolute left-[165.8px] size-[10.648px] top-[9.32px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.648 10.648">
        <g clipPath="url(#clip0_81_2130)" id="Icon">
          <path d={svgPaths.p1f7d5780} id="Vector" stroke="var(--stroke-0, #A3B3FF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d="M8.87321 1.33127V3.10594" id="Vector_2" stroke="var(--stroke-0, #A3B3FF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d="M9.76063 2.21844H7.98597" id="Vector_3" stroke="var(--stroke-0, #A3B3FF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d="M1.7747 7.54254V8.42987" id="Vector_4" stroke="var(--stroke-0, #A3B3FF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d="M2.21831 7.98619H1.33098" id="Vector_5" stroke="var(--stroke-0, #A3B3FF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
        </g>
        <defs>
          <clipPath id="clip0_81_2130">
            <rect fill="white" height="10.648" width="10.648" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Button7() {
  return (
    <div className="bg-[rgba(97,95,255,0.04)] h-[29.282px] relative rounded-[7.986px] shrink-0 w-[457.199px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-[0.666px] border-[rgba(97,95,255,0.3)] border-solid inset-0 pointer-events-none rounded-[7.986px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon23 />
        <p className="-translate-x-1/2 absolute font-['Geist:Medium',sans-serif] font-medium leading-[13.976px] left-[236.77px] text-[#a3b3ff] text-[9.317px] text-center top-[7.99px] whitespace-nowrap">Generate Motion Preview</p>
      </div>
    </div>
  );
}

function Container55() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[13.31px] h-[61.892px] items-start left-[15.97px] pt-[5.324px] top-[211.3px] w-[457.199px]" data-name="Container">
      <Container56 />
      <Button7 />
    </div>
  );
}

function MotionTestIdeaCard() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.04)] border-[0.666px] border-[rgba(255,255,255,0.06)] border-solid h-[290.491px] left-0 rounded-[10.648px] top-[839.36px] w-[490.474px]" data-name="MotionTestIdeaCard">
      <Container41 />
      <Container42 />
      <Container55 />
    </div>
  );
}

function Text24() {
  return (
    <div className="h-[10.648px] relative shrink-0 w-[103.672px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['SFMono-Regular:Regular',sans-serif] leading-[10.648px] left-0 not-italic text-[#71717b] text-[7.986px] top-[-0.33px] whitespace-nowrap">juicy-oil-meta-v2.mp4</p>
      </div>
    </div>
  );
}

function Text25() {
  return (
    <div className="h-[10.648px] relative shrink-0 w-[48.566px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Geist:Regular',sans-serif] font-normal leading-[10.648px] relative shrink-0 text-[#71717b] text-[7.986px] whitespace-nowrap">0:28 · 4.6 MB</p>
      </div>
    </div>
  );
}

function Container58() {
  return (
    <div className="absolute content-stretch flex h-[27.285px] items-center justify-between left-0 pt-[0.666px] px-[10.648px] top-[250.89px] w-[489.142px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.05)] border-solid border-t-[0.666px] inset-0 pointer-events-none" />
      <Text24 />
      <Text25 />
    </div>
  );
}

function ImageAdPreview() {
  return (
    <div className="h-[250.894px] relative shrink-0 w-[489.142px]" data-name="Image (Ad preview)">
      <div className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-[194.96%] left-0 max-w-none top-[-26.75%] w-full" src={imgImageAdPreview} />
      </div>
    </div>
  );
}

function Container59() {
  return (
    <div className="absolute bg-[#18181b] content-stretch flex h-[250.894px] items-center justify-center left-0 overflow-clip rounded-tl-[10.648px] rounded-tr-[10.648px] top-0 w-[489.142px]" data-name="Container">
      <ImageAdPreview />
    </div>
  );
}

function Container57() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.2)] border-[0.666px] border-[rgba(255,255,255,0.06)] border-solid h-[279.51px] left-0 rounded-[10.648px] top-0 w-[490.474px]" data-name="Container">
      <Container58 />
      <Container59 />
    </div>
  );
}

function Container22() {
  return (
    <div className="h-[1129.853px] relative shrink-0 w-[490.474px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container23 />
        <DesignReviewCard />
        <MotionTestIdeaCard />
        <Container57 />
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="absolute h-[595.622px] left-0 top-0 w-[512.435px]" data-name="Container">
      <div className="content-stretch flex items-start justify-end overflow-clip pr-[11.314px] pt-[6.655px] relative rounded-[inherit] size-full">
        <Container22 />
      </div>
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.04)] border-r-[0.666px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Text26() {
  return (
    <div className="h-[19.965px] relative shrink-0 w-[49.772px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[9.983px] left-0 text-[#71717b] text-[6.655px] top-0 tracking-[0.7986px] uppercase w-[41.261px]">SCORE OVERVIEW</p>
      </div>
    </div>
  );
}

function Button8() {
  return (
    <div className="bg-[rgba(255,255,255,0.04)] h-[18.634px] relative rounded-[11165227px] shrink-0 w-[43.642px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-[0.666px] border-[rgba(255,255,255,0.06)] border-solid inset-0 pointer-events-none rounded-[11165227px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Geist:Medium',sans-serif] font-medium leading-[12.977px] left-[22.15px] text-[#9f9fa9] text-[8.652px] text-center top-[2.83px] whitespace-nowrap">TikTok</p>
      </div>
    </div>
  );
}

function Button9() {
  return (
    <div className="bg-[rgba(97,95,255,0.1)] flex-[1_0_0] h-[18.634px] min-h-px min-w-px relative rounded-[11165227px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-[0.666px] border-[rgba(97,95,255,0.3)] border-solid inset-0 pointer-events-none rounded-[11165227px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Geist:Medium',sans-serif] font-medium leading-[12.977px] left-[21.38px] text-[#a3b3ff] text-[8.652px] text-center top-[2.66px] w-[43.257px]">Meta</p>
      </div>
    </div>
  );
}

function Button10() {
  return (
    <div className="bg-[rgba(255,255,255,0.04)] h-[18.634px] relative rounded-[11165227px] shrink-0 w-[45.92px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-[0.666px] border-[rgba(255,255,255,0.06)] border-solid inset-0 pointer-events-none rounded-[11165227px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Geist:Medium',sans-serif] font-medium leading-[12.977px] left-[23.05px] text-[#9f9fa9] text-[8.652px] text-center top-[2.66px] w-[45.254px]">Youtube</p>
      </div>
    </div>
  );
}

function Container64() {
  return (
    <div className="h-[18.634px] relative shrink-0 w-[143.223px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[5.324px] items-center relative size-full">
        <Button8 />
        <Button9 />
        <Button10 />
      </div>
    </div>
  );
}

function Container63() {
  return (
    <div className="absolute content-stretch flex items-center justify-between left-[13.98px] top-[13.98px] w-[192.995px]" data-name="Container">
      <Text26 />
      <Container64 />
    </div>
  );
}

function Text27() {
  return (
    <div className="h-[10.981px] relative shrink-0 w-[78.389px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[10.981px] left-0 text-[#71717b] text-[7.321px] top-0 tracking-[0.8785px] uppercase whitespace-nowrap">OVERALL SCORE</p>
      </div>
    </div>
  );
}

function Text28() {
  return (
    <div className="absolute h-[34.606px] left-0 top-0 w-[43.985px]" data-name="Text">
      <p className="absolute font-['Geist:Bold',sans-serif] font-bold leading-[34.606px] left-0 text-[#10b981] text-[34.606px] top-0 tracking-[-0.8651px] whitespace-nowrap">8.0</p>
    </div>
  );
}

function Text29() {
  return (
    <div className="absolute h-[18.634px] left-[51.97px] top-[15.97px] w-[26.417px]" data-name="Text">
      <p className="absolute font-['Geist:Bold',sans-serif] font-bold leading-[15.972px] left-0 text-[#52525c] text-[15.972px] top-[-0.33px] whitespace-nowrap">/10</p>
    </div>
  );
}

function Container68() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[78.389px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text28 />
        <Text29 />
      </div>
    </div>
  );
}

function Container67() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[2.662px] h-[48.249px] items-start left-0 top-0 w-[78.389px]" data-name="Container">
      <Text27 />
      <Container68 />
    </div>
  );
}

function Container69() {
  return (
    <div className="absolute bg-[rgba(99,102,241,0.15)] border-[0.666px] border-[rgba(99,102,241,0.3)] border-solid h-[18.634px] left-[107.16px] rounded-[3.993px] top-[26.95px] w-[85.834px]" data-name="Container">
      <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[11.979px] left-[6.65px] text-[#818cf8] text-[7.986px] top-[2.66px] tracking-[0.1997px] uppercase whitespace-nowrap">Good Potential</p>
    </div>
  );
}

function Container66() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[192.995px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container67 />
        <Container69 />
      </div>
    </div>
  );
}

function Icon24() {
  return (
    <div className="absolute left-0 size-[9.317px] top-[1.33px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.317 9.317">
        <g id="Icon">
          <path d="M6.98782 7.76418V3.88209" id="Vector" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.776417" />
          <path d="M4.65851 7.76425V1.55292" id="Vector_2" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.776417" />
          <path d="M2.32927 7.76413V5.43488" id="Vector_3" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.776417" />
        </g>
      </svg>
    </div>
  );
}

function Text30() {
  return (
    <div className="h-[11.979px] relative shrink-0 w-[105.513px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon24 />
        <p className="absolute font-['Geist:Regular',sans-serif] font-normal leading-[11.979px] left-[13.31px] text-[#71717b] text-[7.986px] top-0 whitespace-nowrap">Vs. Meta (6.4)</p>
      </div>
    </div>
  );
}

function Text31() {
  return (
    <div className="h-[11.979px] relative shrink-0 w-[30.441px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:Medium',sans-serif] font-medium leading-[11.979px] left-0 text-[#00d492] text-[7.986px] top-0 whitespace-nowrap">+0.8 pts</p>
      </div>
    </div>
  );
}

function Container71() {
  return (
    <div className="absolute content-stretch flex h-[11.979px] items-center justify-between left-0 top-[5.32px] w-[192.995px]" data-name="Container">
      <Text30 />
      <Text31 />
    </div>
  );
}

function Container73() {
  return <div className="absolute bg-[#10b981] h-[3.993px] left-0 rounded-[11165227px] top-0 w-[138.954px]" data-name="Container" />;
}

function Container74() {
  return <div className="absolute bg-[#71717b] h-[3.993px] left-[123.51px] top-0 w-[1.331px]" data-name="Container" />;
}

function Container72() {
  return (
    <div className="absolute bg-[#3f3f46] h-[3.993px] left-0 overflow-clip rounded-[11165227px] top-[22.63px] w-[192.995px]" data-name="Container">
      <Container73 />
      <Container74 />
    </div>
  );
}

function Container70() {
  return (
    <div className="h-[26.62px] relative shrink-0 w-[192.995px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container71 />
        <Container72 />
      </div>
    </div>
  );
}

function Container65() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[10.648px] h-[85.517px] items-start left-[13.98px] top-[55.24px] w-[192.995px]" data-name="Container">
      <Container66 />
      <Container70 />
    </div>
  );
}

function Text32() {
  return (
    <div className="h-[10.981px] relative shrink-0 w-[192.995px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[10.981px] left-0 text-[#71717b] text-[7.321px] top-0 tracking-[0.8785px] uppercase whitespace-nowrap">Dimension Scores</p>
      </div>
    </div>
  );
}

function Text33() {
  return (
    <div className="h-[13.976px] relative shrink-0 w-[23.022px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:Medium',sans-serif] font-medium leading-[13.976px] left-0 text-[#d4d4d8] text-[9.317px] top-[0.33px] whitespace-nowrap">Hook</p>
      </div>
    </div>
  );
}

function Text34() {
  return (
    <div className="h-[17.969px] relative shrink-0 w-[14.511px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[17.969px] left-0 text-[#10b981] text-[11.979px] top-[-0.33px] whitespace-nowrap">9.1</p>
      </div>
    </div>
  );
}

function Container78() {
  return (
    <div className="absolute content-stretch flex h-[17.969px] items-center justify-between left-0 top-0 w-[192.995px]" data-name="Container">
      <Text33 />
      <Text34 />
    </div>
  );
}

function Container80() {
  return <div className="bg-[#10b981] h-[2.662px] rounded-[11165227px] shrink-0 w-full" data-name="Container" />;
}

function Container79() {
  return (
    <div className="absolute bg-[#27272a] content-stretch flex flex-col h-[2.662px] items-start left-0 overflow-clip pr-[17.371px] rounded-[11165227px] top-[21.96px] w-[192.995px]" data-name="Container">
      <Container80 />
    </div>
  );
}

function Container77() {
  return (
    <div className="h-[24.624px] relative shrink-0 w-[192.995px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container78 />
        <Container79 />
      </div>
    </div>
  );
}

function Text35() {
  return (
    <div className="h-[13.976px] relative shrink-0 w-[39.576px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:Medium',sans-serif] font-medium leading-[13.976px] left-0 text-[#d4d4d8] text-[9.317px] top-[0.33px] whitespace-nowrap">Message</p>
      </div>
    </div>
  );
}

function Text36() {
  return (
    <div className="h-[17.969px] relative shrink-0 w-[18.426px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[17.969px] left-0 text-[#10b981] text-[11.979px] top-[-0.33px] whitespace-nowrap">8.0</p>
      </div>
    </div>
  );
}

function Container82() {
  return (
    <div className="absolute content-stretch flex h-[17.969px] items-center justify-between left-0 top-0 w-[192.995px]" data-name="Container">
      <Text35 />
      <Text36 />
    </div>
  );
}

function Container84() {
  return <div className="bg-[#10b981] h-[2.662px] rounded-[11165227px] shrink-0 w-full" data-name="Container" />;
}

function Container83() {
  return (
    <div className="absolute bg-[#27272a] content-stretch flex flex-col h-[2.662px] items-start left-0 overflow-clip pr-[38.599px] rounded-[11165227px] top-[21.96px] w-[192.995px]" data-name="Container">
      <Container84 />
    </div>
  );
}

function Container81() {
  return (
    <div className="h-[24.624px] relative shrink-0 w-[192.995px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container82 />
        <Container83 />
      </div>
    </div>
  );
}

function Text37() {
  return (
    <div className="h-[13.976px] relative shrink-0 w-[26.688px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:Medium',sans-serif] font-medium leading-[13.976px] left-0 text-[#d4d4d8] text-[9.317px] top-[0.33px] whitespace-nowrap">Visual</p>
      </div>
    </div>
  );
}

function Text38() {
  return (
    <div className="h-[17.969px] relative shrink-0 w-[15.889px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[17.969px] left-0 text-[#10b981] text-[11.979px] top-[-0.33px] whitespace-nowrap">8.0</p>
      </div>
    </div>
  );
}

function Container86() {
  return (
    <div className="absolute content-stretch flex h-[17.969px] items-center justify-between left-0 top-0 w-[192.995px]" data-name="Container">
      <Text37 />
      <Text38 />
    </div>
  );
}

function Container88() {
  return <div className="bg-[#10b981] h-[2.662px] rounded-[11165227px] shrink-0 w-[154.396px]" data-name="Container" />;
}

function Container87() {
  return (
    <div className="absolute bg-[#27272a] content-stretch flex flex-col h-[2.662px] items-start left-0 overflow-clip pr-[48.249px] rounded-[11165227px] top-[21.96px] w-[192.995px]" data-name="Container">
      <Container88 />
    </div>
  );
}

function Container85() {
  return (
    <div className="h-[24.624px] relative shrink-0 w-[192.995px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container86 />
        <Container87 />
      </div>
    </div>
  );
}

function Text39() {
  return (
    <div className="h-[13.976px] relative shrink-0 w-[25.934px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:Medium',sans-serif] font-medium leading-[13.976px] left-0 text-[#d4d4d8] text-[9.317px] top-[0.33px] whitespace-nowrap">Brand</p>
      </div>
    </div>
  );
}

function Text40() {
  return (
    <div className="h-[17.969px] relative shrink-0 w-[18.078px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[17.969px] left-0 text-[#f59e0b] text-[11.979px] top-[-0.33px] whitespace-nowrap">4.2</p>
      </div>
    </div>
  );
}

function Container90() {
  return (
    <div className="absolute content-stretch flex h-[17.969px] items-center justify-between left-0 top-0 w-[192.995px]" data-name="Container">
      <Text39 />
      <Text40 />
    </div>
  );
}

function Container92() {
  return <div className="bg-[#f59e0b] h-[2.662px] rounded-[11165227px] shrink-0 w-full" data-name="Container" />;
}

function Container91() {
  return (
    <div className="absolute bg-[#27272a] content-stretch flex flex-col h-[2.662px] items-start left-0 overflow-clip pr-[111.939px] rounded-[11165227px] top-[21.96px] w-[192.995px]" data-name="Container">
      <Container92 />
    </div>
  );
}

function Container89() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[192.995px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container90 />
        <Container91 />
      </div>
    </div>
  );
}

function Container76() {
  return (
    <div className="h-[122.452px] relative shrink-0 w-[192.995px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[7.986px] items-start relative size-full">
        <Container77 />
        <Container81 />
        <Container85 />
        <Container89 />
      </div>
    </div>
  );
}

function Container75() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[10.648px] h-[149.405px] items-start left-[13.98px] pt-[5.324px] top-[154.06px] w-[192.995px]" data-name="Container">
      <Text32 />
      <Container76 />
    </div>
  );
}

function Icon25() {
  return (
    <div className="relative shrink-0 size-[10.648px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.648 10.648">
        <g clipPath="url(#clip0_81_2152)" id="Icon">
          <path d={svgPaths.p33f5b780} id="Vector" stroke="var(--stroke-0, #6366F1)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
        </g>
        <defs>
          <clipPath id="clip0_81_2152">
            <rect fill="white" height="10.648" width="10.648" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text41() {
  return (
    <div className="flex-[1_0_0] h-[13.976px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Geist:Medium',sans-serif] font-medium leading-[13.976px] left-[31px] text-[#d4d4d8] text-[9.317px] text-center top-[0.33px] whitespace-nowrap">Hook Analysis</p>
      </div>
    </div>
  );
}

function Container95() {
  return (
    <div className="h-[13.976px] relative shrink-0 w-[77.609px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[5.324px] items-center relative size-full">
        <Icon25 />
        <Text41 />
      </div>
    </div>
  );
}

function Icon26() {
  return (
    <div className="relative shrink-0 size-[10.648px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.648 10.648">
        <g id="Icon">
          <path d={svgPaths.p3f7a9b80} id="Vector" stroke="var(--stroke-0, #52525C)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
        </g>
      </svg>
    </div>
  );
}

function Button11() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[192.995px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between relative size-full">
        <Container95 />
        <Icon26 />
      </div>
    </div>
  );
}

function Container94() {
  return (
    <div className="h-[29.948px] relative shrink-0 w-[192.995px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.04)] border-b-[0.666px] border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[0.666px] relative size-full">
        <Button11 />
      </div>
    </div>
  );
}

function Icon27() {
  return (
    <div className="relative shrink-0 size-[10.648px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.648 10.648">
        <g id="Icon">
          <path d="M1.7747 3.99283H8.87337" id="Vector" stroke="var(--stroke-0, #8B5CF6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d="M1.7747 6.65502H8.87337" id="Vector_2" stroke="var(--stroke-0, #8B5CF6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.p3c2e9580} id="Vector_3" stroke="var(--stroke-0, #8B5CF6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          <path d={svgPaths.p19dacf80} id="Vector_4" stroke="var(--stroke-0, #8B5CF6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
        </g>
      </svg>
    </div>
  );
}

function Text42() {
  return (
    <div className="h-[13.976px] relative shrink-0 w-[41.391px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Geist:Medium',sans-serif] font-medium leading-[13.976px] left-[21px] text-[#d4d4d8] text-[9.317px] text-center top-[0.33px] whitespace-nowrap">Hashtags</p>
      </div>
    </div>
  );
}

function Text43() {
  return (
    <div className="h-[11.979px] relative shrink-0 w-[9.244px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Geist:Regular',sans-serif] font-normal leading-[11.979px] left-[5px] text-[#71717b] text-[7.986px] text-center top-0 whitespace-nowrap">(6)</p>
      </div>
    </div>
  );
}

function Button12() {
  return (
    <div className="flex-[216.75_0_0] h-[13.976px] min-h-px min-w-px relative" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[5.324px] items-center relative size-full">
        <Icon27 />
        <Text42 />
        <Text43 />
      </div>
    </div>
  );
}

function Button13() {
  return (
    <div className="flex-[1_0_0] h-[10.648px] min-h-px min-w-px relative" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <p className="font-['Geist:Medium',sans-serif] font-medium leading-[10.648px] relative shrink-0 text-[#7c86ff] text-[7.986px] text-center whitespace-nowrap">Copy all</p>
      </div>
    </div>
  );
}

function Icon28() {
  return (
    <div className="h-[10.648px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute bottom-1/4 left-[37.5%] right-[37.5%] top-1/4" data-name="Vector">
        <div className="absolute inset-[-8.33%_-16.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3.54933 6.21133">
            <path d={svgPaths.p35ee1480} id="Vector" stroke="var(--stroke-0, #52525C)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Button14() {
  return (
    <div className="relative shrink-0 size-[10.648px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Icon28 />
      </div>
    </div>
  );
}

function Container98() {
  return (
    <div className="h-[10.648px] relative shrink-0 w-[48.748px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[7.986px] items-center relative size-full">
        <Button13 />
        <Button14 />
      </div>
    </div>
  );
}

function Container97() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[192.995px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between relative size-full">
        <Button12 />
        <Container98 />
      </div>
    </div>
  );
}

function Container96() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[192.995px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.04)] border-b-[0.666px] border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[0.666px] relative size-full">
        <Container97 />
      </div>
    </div>
  );
}

function Container93() {
  return (
    <div className="absolute content-stretch flex flex-col h-[60.561px] items-start left-[13.98px] pt-[0.666px] top-[322.1px] w-[192.995px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.04)] border-solid border-t-[0.666px] inset-0 pointer-events-none" />
      <Container94 />
      <Container96 />
    </div>
  );
}

function Icon29() {
  return (
    <div className="absolute left-[15.8px] size-[8.652px] top-[9.65px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.6515 8.6515">
        <g id="Icon">
          <path d={svgPaths.pc17a880} id="Vector" stroke="var(--stroke-0, #9F9FA9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.720958" />
          <path d={svgPaths.p33eea300} id="Vector_2" stroke="var(--stroke-0, #9F9FA9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.720958" />
        </g>
      </svg>
    </div>
  );
}

function Button15() {
  return (
    <div className="flex-[140_0_0] h-[27.951px] min-h-px min-w-px relative rounded-[15.972px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-[0.666px] border-[rgba(255,255,255,0.08)] border-solid inset-0 pointer-events-none rounded-[15.972px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon29 />
        <p className="-translate-x-1/2 absolute font-['Geist:Medium',sans-serif] font-medium leading-[13.31px] left-[52.94px] text-[#d4d4d8] text-[9.317px] text-center top-[7.32px] whitespace-nowrap">Re-analyze</p>
      </div>
    </div>
  );
}

function Button16() {
  return (
    <div className="bg-[#615fff] flex-[138_0_0] h-[27.951px] min-h-px min-w-px relative rounded-[15.972px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center py-[6.655px] relative size-full">
        <p className="font-['Geist:Medium',sans-serif] font-medium leading-[13.31px] relative shrink-0 text-[9.317px] text-center text-white whitespace-nowrap">Generate Brief</p>
      </div>
    </div>
  );
}

function Container99() {
  return (
    <div className="absolute content-stretch flex gap-[7.986px] h-[33.275px] items-start left-[13.98px] pt-[5.324px] top-[395.97px] w-[192.995px]" data-name="Container">
      <Button15 />
      <Button16 />
    </div>
  );
}

function ScoreCard() {
  return (
    <div className="bg-[#18181b] flex-[1_0_0] min-h-px min-w-px relative rounded-[10.648px] w-[220.946px]" data-name="ScoreCard">
      <div aria-hidden="true" className="absolute border-[0.666px] border-[rgba(255,255,255,0.06)] border-solid inset-0 pointer-events-none rounded-[10.648px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container63 />
        <Container65 />
        <Container75 />
        <Container93 />
        <Container99 />
      </div>
    </div>
  );
}

function Text44() {
  return (
    <div className="h-[9.983px] relative shrink-0 w-[105.716px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[9.983px] left-0 text-[#71717b] text-[6.655px] top-0 tracking-[0.7986px] uppercase whitespace-nowrap">PREDICTED PERFORMANCE</p>
      </div>
    </div>
  );
}

function Container101() {
  return (
    <div className="bg-[rgba(0,188,125,0.1)] h-[17.636px] relative rounded-[3.993px] shrink-0 w-[70.21px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0.666px] border-[rgba(0,188,125,0.2)] border-solid inset-0 pointer-events-none rounded-[3.993px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:Medium',sans-serif] font-medium leading-[10.981px] left-[5.99px] text-[#00d492] text-[7.321px] top-[3.33px] tracking-[0.183px] whitespace-nowrap">High confidence</p>
      </div>
    </div>
  );
}

function Container100() {
  return (
    <div className="absolute content-stretch flex h-[17.636px] items-center justify-between left-[13.98px] top-[13.98px] w-[192.995px]" data-name="Container">
      <Text44 />
      <Container101 />
    </div>
  );
}

function Text45() {
  return (
    <div className="h-[10.981px] relative shrink-0 w-[113.015px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[10.981px] left-0 text-[#71717b] text-[7.321px] top-0 tracking-[0.8785px] uppercase whitespace-nowrap">EST. CTR</p>
      </div>
    </div>
  );
}

function Text46() {
  return (
    <div className="flex-[1_0_0] h-[21.296px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:Bold',sans-serif] font-bold leading-[0] left-0 text-[#f4f4f5] text-[0px] top-0 tracking-[-0.5324px] whitespace-nowrap">
          <span className="leading-[21.296px] text-[21.296px]">{`0.8% `}</span>
          <span className="font-['Geist:Medium',sans-serif] font-medium leading-[15.972px] text-[#71717b] text-[15.972px]">–</span>
          <span className="leading-[21.296px] text-[21.296px]">{` 1.4%`}</span>
        </p>
      </div>
    </div>
  );
}

function Container105() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[113.015px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <Text46 />
      </div>
    </div>
  );
}

function Container104() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[5.324px] h-[37.601px] items-start left-0 top-0 w-[113.015px]" data-name="Container">
      <Text45 />
      <Container105 />
    </div>
  );
}

function Text47() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[70.283px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:Medium',sans-serif] font-medium leading-[11.979px] left-0 text-[#9f9fa9] text-[7.986px] top-0 whitespace-nowrap">Meta avg · 0.6%</p>
      </div>
    </div>
  );
}

function Container106() {
  return (
    <div className="absolute content-stretch flex flex-col h-[11.979px] items-end left-[122.71px] top-[22.96px] w-[70.283px]" data-name="Container">
      <Text47 />
    </div>
  );
}

function Container103() {
  return (
    <div className="absolute h-[37.601px] left-0 top-0 w-[192.995px]" data-name="Container">
      <Container104 />
      <Container106 />
    </div>
  );
}

function Container108() {
  return (
    <div className="absolute h-[9.983px] left-0 top-0 w-[9.884px]" data-name="Container">
      <p className="absolute font-['Geist:Medium',sans-serif] font-medium leading-[9.983px] left-0 text-[#71717b] text-[6.655px] top-0 whitespace-nowrap">0%</p>
    </div>
  );
}

function Container109() {
  return (
    <div className="absolute h-[9.983px] left-[179.7px] top-0 w-[13.294px]" data-name="Container">
      <p className="absolute font-['Geist:Medium',sans-serif] font-medium leading-[9.983px] left-0 text-[#71717b] text-[6.655px] top-0 whitespace-nowrap">3%+</p>
    </div>
  );
}

function Container111() {
  return <div className="absolute bg-[#6366f1] h-[2.662px] left-[51.33px] rounded-[11165227px] top-0 w-[38.599px]" data-name="Container" />;
}

function Container112() {
  return <div className="absolute bg-[#9f9fa9] h-[7.986px] left-[38.6px] top-[-2.66px] w-[1.331px]" data-name="Container" />;
}

function Container110() {
  return (
    <div className="absolute bg-[#27272a] h-[2.662px] left-0 rounded-[11165227px] top-[15.97px] w-[192.995px]" data-name="Container">
      <Container111 />
      <Container112 />
    </div>
  );
}

function Container107() {
  return (
    <div className="absolute h-[23.958px] left-0 top-[48.25px] w-[192.995px]" data-name="Container">
      <Container108 />
      <Container109 />
      <Container110 />
    </div>
  );
}

function Container102() {
  return (
    <div className="absolute h-[72.207px] left-[13.98px] top-[52.91px] w-[192.995px]" data-name="Container">
      <Container103 />
      <Container107 />
    </div>
  );
}

function Icon30() {
  return (
    <div className="h-[9.317px] relative shrink-0 w-[7.809px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.80923 9.317">
        <g clipPath="url(#clip0_81_2219)" id="Icon">
          <path d={svgPaths.p8bc6780} id="Vector" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.650769" />
          <path d={svgPaths.p3bf39600} id="Vector_2" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.650769" />
          <path d={svgPaths.p1af54c00} id="Vector_3" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.650769" />
        </g>
        <defs>
          <clipPath id="clip0_81_2219">
            <rect fill="white" height="9.317" width="7.80923" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text48() {
  return (
    <div className="flex-[1_0_0] h-[21.962px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[10.981px] left-0 text-[#71717b] text-[7.321px] top-0 tracking-[0.8785px] uppercase w-[47.916px]">CVR POTENTIAL</p>
      </div>
    </div>
  );
}

function Container115() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[68.547px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[3.993px] items-center relative size-full">
        <Icon30 />
        <Text48 />
      </div>
    </div>
  );
}

function Text49() {
  return (
    <div className="h-[17.969px] relative shrink-0 w-[68.547px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[17.969px] left-0 text-[#e4e4e7] text-[11.979px] top-[-0.33px] whitespace-nowrap">1.2% – 2.1%</p>
      </div>
    </div>
  );
}

function Container114() {
  return (
    <div className="bg-[rgba(255,255,255,0.01)] col-1 justify-self-stretch relative rounded-[15.972px] row-1 self-stretch shrink-0" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0.666px] border-[rgba(255,255,255,0.04)] border-solid inset-0 pointer-events-none rounded-[15.972px]" />
      <div className="content-stretch flex flex-col gap-[5.324px] items-start pl-[11.314px] pr-[0.666px] py-[11.314px] relative size-full">
        <Container115 />
        <Text49 />
      </div>
    </div>
  );
}

function Icon31() {
  return (
    <div className="h-[9.317px] relative shrink-0 w-[6.728px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.72779 9.317">
        <g clipPath="url(#clip0_81_2215)" id="Icon">
          <path d={svgPaths.p6b79880} id="Vector" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.560649" />
          <path d={svgPaths.p3456cb00} id="Vector_2" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.560649" />
        </g>
        <defs>
          <clipPath id="clip0_81_2215">
            <rect fill="white" height="9.317" width="6.72779" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text50() {
  return (
    <div className="flex-[1_0_0] h-[21.962px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[10.981px] left-0 text-[#71717b] text-[7.321px] top-0 tracking-[0.8785px] uppercase w-[41.927px]">CREATIVE FATIGUE</p>
      </div>
    </div>
  );
}

function Container117() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[68.547px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[3.993px] items-center relative size-full">
        <Icon31 />
        <Text50 />
      </div>
    </div>
  );
}

function Text51() {
  return (
    <div className="h-[17.969px] relative shrink-0 w-[68.547px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[17.969px] left-0 text-[#e4e4e7] text-[11.979px] top-[-0.33px] whitespace-nowrap">~14 days</p>
      </div>
    </div>
  );
}

function Container116() {
  return (
    <div className="bg-[rgba(255,255,255,0.01)] col-2 justify-self-stretch relative rounded-[15.972px] row-1 self-stretch shrink-0" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0.666px] border-[rgba(255,255,255,0.04)] border-solid inset-0 pointer-events-none rounded-[15.972px]" />
      <div className="content-stretch flex flex-col gap-[5.324px] items-start pl-[11.314px] pr-[0.666px] py-[11.314px] relative size-full">
        <Container117 />
        <Text51 />
      </div>
    </div>
  );
}

function Container113() {
  return (
    <div className="absolute gap-x-[10.648000717163086px] gap-y-[10.648000717163086px] grid grid-cols-[repeat(2,minmax(0,1fr))] grid-rows-[repeat(1,minmax(0,1fr))] h-[67.881px] left-[13.98px] top-[138.42px] w-[192.995px]" data-name="Container">
      <Container114 />
      <Container116 />
    </div>
  );
}

function Paragraph3() {
  return (
    <div className="absolute h-[59.625px] left-[13.98px] top-[219.62px] w-[192.995px]" data-name="Paragraph">
      <p className="absolute font-['Geist:Regular',sans-serif] font-normal leading-[0] left-0 text-[#9f9fa9] text-[0px] top-0 w-[190.999px]">
        <span className="leading-[14.907px] text-[9.317px]">{`Strong hook and clear message drive above-average CTR potential. Brand recall at `}</span>
        <span className="font-['Geist:Medium',sans-serif] font-medium leading-[14.907px] text-[#f59e0b] text-[9.317px]">4.2</span>
        <span className="leading-[14.907px] text-[9.317px]">{` is the limiting factor — expect fatigue after 2 weeks without creative refresh.`}</span>
      </p>
    </div>
  );
}

function Icon32() {
  return (
    <div className="relative shrink-0 size-[10.648px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.648 10.648">
        <g clipPath="url(#clip0_81_2110)" id="Icon">
          <path d={svgPaths.p2a961600} id="Vector" stroke="var(--stroke-0, #6366F1)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
        </g>
        <defs>
          <clipPath id="clip0_81_2110">
            <rect fill="white" height="10.648" width="10.648" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text52() {
  return (
    <div className="flex-[1_0_0] h-[13.976px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Geist:Medium',sans-serif] font-medium leading-[13.976px] left-[40.5px] text-[#d4d4d8] text-[9.317px] text-center top-[0.33px] whitespace-nowrap">{`What's driving this`}</p>
      </div>
    </div>
  );
}

function Container119() {
  return (
    <div className="h-[13.976px] relative shrink-0 w-[96.794px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[5.324px] items-center relative size-full">
        <Icon32 />
        <Text52 />
      </div>
    </div>
  );
}

function Icon33() {
  return (
    <div className="relative shrink-0 size-[10.648px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.648 10.648">
        <g id="Icon">
          <path d={svgPaths.p19f21424} id="Vector" stroke="var(--stroke-0, #52525C)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.887333" />
        </g>
      </svg>
    </div>
  );
}

function Button17() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[192.995px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between relative size-full">
        <Container119 />
        <Icon33 />
      </div>
    </div>
  );
}

function Container118() {
  return (
    <div className="absolute content-stretch flex flex-col h-[29.948px] items-start left-[13.98px] pt-[0.666px] top-[297.87px] w-[192.995px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.04)] border-solid border-t-[0.666px] inset-0 pointer-events-none" />
      <Button17 />
    </div>
  );
}

function PredictedPerformanceCard() {
  return (
    <div className="bg-[#18181b] h-[341.797px] relative rounded-[10.648px] shrink-0 w-[220.946px]" data-name="PredictedPerformanceCard">
      <div aria-hidden="true" className="absolute border-[0.666px] border-[rgba(255,255,255,0.06)] border-solid inset-0 pointer-events-none rounded-[10.648px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container100 />
        <Container102 />
        <Container113 />
        <Paragraph3 />
        <Container118 />
      </div>
    </div>
  );
}

function Text53() {
  return (
    <div className="h-[9.983px] relative shrink-0 w-[31.72px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[9.983px] left-0 text-[#71717b] text-[6.655px] top-0 tracking-[0.7986px] uppercase whitespace-nowrap">BUDGET</p>
      </div>
    </div>
  );
}

function Text54() {
  return (
    <div className="h-[11.979px] relative shrink-0 w-[95.312px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:Medium',sans-serif] font-medium leading-[11.979px] left-0 text-[#9f9fa9] text-[7.986px] top-0 whitespace-nowrap">Est. CPM $8–14 · YouTube</p>
      </div>
    </div>
  );
}

function Container120() {
  return (
    <div className="absolute content-stretch flex h-[11.979px] items-center justify-between left-[13.98px] top-[13.98px] w-[192.995px]" data-name="Container">
      <Text53 />
      <Text54 />
    </div>
  );
}

function Container124() {
  return <div className="absolute bg-[#818cf8] left-[8.65px] rounded-[11165227px] shadow-[0px_0px_5.324px_0px_rgba(129,140,248,0.8)] size-[3.993px] top-[8.65px]" data-name="Container" />;
}

function Container123() {
  return (
    <div className="bg-[rgba(99,102,241,0.15)] h-[21.296px] relative rounded-[3.993px] shrink-0 w-[47.734px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0.666px] border-[rgba(99,102,241,0.3)] border-solid inset-0 pointer-events-none rounded-[3.993px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container124 />
        <p className="absolute font-['Geist:Bold',sans-serif] font-bold leading-[11.979px] left-[17.97px] text-[#818cf8] text-[7.986px] top-[4.66px] tracking-[0.3993px] uppercase whitespace-nowrap">Test</p>
      </div>
    </div>
  );
}

function Container122() {
  return (
    <div className="h-[21.296px] relative shrink-0 w-[192.995px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <Container123 />
      </div>
    </div>
  );
}

function Container125() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[192.995px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:Bold',sans-serif] font-bold leading-[0] left-0 text-[#f4f4f5] text-[0px] top-[-0.33px] tracking-[-0.7321px] w-[99.16px]">
          <span className="leading-[29.282px] text-[29.282px]">{`$500 `}</span>
          <span className="font-['Geist:Medium',sans-serif] font-medium leading-[21.296px] text-[#52525c] text-[21.296px]">–</span>
          <span className="leading-[29.282px] text-[29.282px]">{` $1,500`}</span>
        </p>
      </div>
    </div>
  );
}

function Container121() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[7.986px] h-[87.846px] items-start left-[13.98px] top-[47.25px] w-[192.995px]" data-name="Container">
      <Container122 />
      <Container125 />
    </div>
  );
}

function Text55() {
  return (
    <div className="h-[10.981px] relative shrink-0 w-[57.233px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[10.981px] left-0 text-[#71717b] text-[7.321px] top-0 tracking-[0.8785px] uppercase whitespace-nowrap">Ad Sets</p>
      </div>
    </div>
  );
}

function Text56() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[57.233px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[15.972px] left-0 text-[#e4e4e7] text-[10.648px] top-[-0.33px] whitespace-nowrap">3</p>
      </div>
    </div>
  );
}

function Container127() {
  return (
    <div className="col-1 content-stretch flex flex-col gap-[3.993px] items-start justify-self-stretch relative row-1 self-stretch shrink-0" data-name="Container">
      <Text55 />
      <Text56 />
    </div>
  );
}

function Text57() {
  return (
    <div className="h-[10.981px] relative shrink-0 w-[57.233px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[10.981px] left-0 text-[#71717b] text-[7.321px] top-0 tracking-[0.8785px] uppercase whitespace-nowrap">Per Set</p>
      </div>
    </div>
  );
}

function Text58() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[57.233px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[15.972px] left-0 text-[#e4e4e7] text-[10.648px] top-[-0.33px] whitespace-nowrap">$150–500</p>
      </div>
    </div>
  );
}

function Container128() {
  return (
    <div className="col-2 content-stretch flex flex-col gap-[3.993px] items-start justify-self-stretch relative row-1 self-stretch shrink-0" data-name="Container">
      <Text57 />
      <Text58 />
    </div>
  );
}

function Text59() {
  return (
    <div className="h-[10.981px] relative shrink-0 w-[57.233px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[10.981px] left-0 text-[#71717b] text-[7.321px] top-0 tracking-[0.8785px] uppercase whitespace-nowrap">Window</p>
      </div>
    </div>
  );
}

function Text60() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[57.233px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[15.972px] left-0 text-[#e4e4e7] text-[10.648px] top-[-0.33px] whitespace-nowrap">7 Days</p>
      </div>
    </div>
  );
}

function Container129() {
  return (
    <div className="col-3 content-stretch flex flex-col gap-[3.993px] items-start justify-self-stretch relative row-1 self-stretch shrink-0" data-name="Container">
      <Text59 />
      <Text60 />
    </div>
  );
}

function Container126() {
  return (
    <div className="absolute gap-x-[10.648000717163086px] gap-y-[10.648000717163086px] grid grid-cols-[repeat(3,minmax(0,1fr))] grid-rows-[repeat(1,minmax(0,1fr))] h-[53.573px] left-[13.98px] py-[11.314px] top-[148.41px] w-[192.995px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[rgba(255,255,255,0.04)] border-b-[0.666px] border-solid border-t-[0.666px] inset-0 pointer-events-none" />
      <Container127 />
      <Container128 />
      <Container129 />
    </div>
  );
}

function Paragraph4() {
  return (
    <div className="absolute h-[29.812px] left-[13.98px] top-[215.29px] w-[192.995px]" data-name="Paragraph">
      <p className="absolute font-['Geist:Regular',sans-serif] font-normal leading-[14.907px] left-0 text-[#9f9fa9] text-[9.317px] top-0 w-[189.002px]">Score suggests strong hook but weak brand recall. Test at low spend before scaling.</p>
    </div>
  );
}

function BudgetRecommendationCard() {
  return (
    <div className="bg-[#18181b] h-[259.077px] relative rounded-[10.648px] shrink-0 w-[220.946px]" data-name="BudgetRecommendationCard">
      <div aria-hidden="true" className="absolute border-[0.666px] border-[rgba(255,255,255,0.06)] border-solid inset-0 pointer-events-none rounded-[10.648px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container120 />
        <Container121 />
        <Container126 />
        <Paragraph4 />
      </div>
    </div>
  );
}

function Container62() {
  return (
    <div className="h-[1084.1px] relative shrink-0 w-[220.946px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[10.648px] items-start relative size-full">
        <ScoreCard />
        <PredictedPerformanceCard />
        <BudgetRecommendationCard />
      </div>
    </div>
  );
}

function Container61() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col items-start pl-[15.972px] py-[15.972px] relative w-full">
        <Container62 />
      </div>
    </div>
  );
}

function Container60() {
  return (
    <div className="absolute bg-[#111113] content-stretch flex flex-col h-[602.943px] items-start left-[512.43px] overflow-clip top-[-9.98px] w-[252.89px]" data-name="Container">
      <Container61 />
    </div>
  );
}

function ResultsScreen() {
  return (
    <div className="absolute h-[593.626px] left-0 overflow-clip top-[25.29px] w-[765.325px]" data-name="ResultsScreen">
      <Container20 />
      <Container21 />
      <Container60 />
    </div>
  );
}

function PaidAdPage() {
  return (
    <div className="absolute bg-[#09090b] h-[616.253px] left-0 top-[-25.95px] w-[765.325px]" data-name="PaidAdPage">
      <ResultsScreen />
    </div>
  );
}

function Container19() {
  return (
    <div className="absolute h-[592.961px] left-0 overflow-clip top-[31.94px] w-[765.325px]" data-name="Container">
      <PaidAdPage />
    </div>
  );
}

function Container14() {
  return (
    <div className="bg-[#09090b] flex-[1150_0_0] h-[624.905px] min-h-px min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container15 />
        <Container19 />
      </div>
    </div>
  );
}

function Cutsheet() {
  return (
    <div className="absolute bg-[#09090b] content-stretch flex h-[624.905px] items-start left-[184.6px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-120.6px_-124px] mask-size-[1150px_728px] shadow-[0px_24px_100px_0px_rgba(97,95,255,0.2)] top-[124px] w-[911.735px]" data-name="Cutsheet" style={{ maskImage: `url('${imgCutsheet}')` }}>
      <Container />
      <Container14 />
    </div>
  );
}

function MaskGroup() {
  return (
    <div className="absolute contents left-[64px] top-0" data-name="Mask group">
      <Cutsheet />
    </div>
  );
}

function LandingPage() {
  return (
    <div className="absolute bg-[#09090b] inset-0 overflow-clip" data-name="LandingPage">
      <Heading />
      <MaskGroup />
    </div>
  );
}

export default function Section() {
  return (
    <div className="bg-[#09090b] relative size-full min-h-[850px] flex justify-center overflow-hidden" data-name="Section 1">
      <div className="relative w-[1280px] h-full flex-shrink-0">
        <LandingPage />
        <div className="-translate-x-1/2 absolute font-['Geist:Bold',sans-serif] font-bold left-1/2 text-[#e4e4e7] text-[36px] text-center top-[15px] w-full max-w-[800px] z-10 tracking-tight">
          <p className="leading-[1.2] mb-1 text-[32px]">Every other tool analyzes your ads after they run.</p>
          <p className="leading-[1.2] text-[32px]">Cutsheet analyzes them before.</p>
        </div>
      </div>
    </div>
  );
}