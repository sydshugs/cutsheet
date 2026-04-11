import svgPaths from "./svg-m5wnmqeoco";
import imgImageAdCreative from "figma:asset/ec42d7e90ef7d0ebc9a3d6fb5b41f69144e16a73.png";

function Gradient() {
  return (
    <div className="absolute bottom-[138.62px] contents right-[165px]" data-name="Gradient">
      <div className="absolute bottom-[231px] right-[165px] size-[393px]" data-name="Eclipse">
        <div className="absolute inset-[-30.79%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 635 635">
            <g filter="url(#filter0_fn_81_1026)" id="Eclipse">
              <circle cx="317.5" cy="317.5" fill="url(#paint0_linear_81_1026)" r="196.5" />
            </g>
            <defs>
              <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="635" id="filter0_fn_81_1026" width="635" x="0" y="0">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                <feGaussianBlur result="effect1_foregroundBlur_81_1026" stdDeviation="60.5" />
                <feTurbulence baseFrequency="2 2" numOctaves="3" result="noise" seed="6829" stitchTiles="stitch" type="fractalNoise" />
                <feColorMatrix in="noise" result="alphaNoise" type="luminanceToAlpha" />
                <feComponentTransfer in="alphaNoise" result="coloredNoise1">
                  <feFuncA tableValues="1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 " type="discrete" />
                </feComponentTransfer>
                <feComposite in="coloredNoise1" in2="effect1_foregroundBlur_81_1026" operator="in" result="noise1Clipped" />
                <feComponentTransfer in="alphaNoise" result="coloredNoise2">
                  <feFuncA tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 " type="discrete" />
                </feComponentTransfer>
                <feComposite in="coloredNoise2" in2="effect1_foregroundBlur_81_1026" operator="in" result="noise2Clipped" />
                <feFlood floodColor="rgba(0, 0, 0, 0.25)" result="color1Flood" />
                <feComposite in="color1Flood" in2="noise1Clipped" operator="in" result="color1" />
                <feFlood floodColor="rgba(255, 255, 255, 0.25)" result="color2Flood" />
                <feComposite in="color2Flood" in2="noise2Clipped" operator="in" result="color2" />
                <feMerge result="effect2_noise_81_1026">
                  <feMergeNode in="effect1_foregroundBlur_81_1026" />
                  <feMergeNode in="color1" />
                  <feMergeNode in="color2" />
                </feMerge>
              </filter>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_81_1026" x1="317.5" x2="317.5" y1="121" y2="514">
                <stop stopColor="#A78BFA" stopOpacity="0" />
                <stop offset="1" stopColor="#A78BFA" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <div className="absolute bg-gradient-to-b blur-[60.5px] bottom-[138.62px] from-[rgba(99,102,241,0.75)] h-[312.394px] right-[251.64px] to-[#6366f1] w-[225.515px]" />
    </div>
  );
}

function Heading() {
  return (
    <div className="absolute h-[201.586px] left-0 top-[62px] w-[576px]" data-name="Heading 1">
      <p className="absolute font-['Geist:Bold',sans-serif] font-bold leading-[67.2px] left-0 text-[64px] text-white top-[4.5px] tracking-[-3.2px] w-[529px]">Stop guessing why your ads underperform.</p>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="absolute h-[58.5px] left-0 top-[287.59px] w-[448px]" data-name="Paragraph">
      <p className="absolute font-['Geist:Light',sans-serif] font-light leading-[29.25px] left-0 text-[#9f9fa9] text-[18px] top-px w-[414px]">Upload any ad. Get a score, a priority fix, and an AI rewrite in 30 seconds. No ad account needed.</p>
    </div>
  );
}

function Icon() {
  return (
    <div className="absolute left-[135.09px] size-[16px] top-[2px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon">
          <path d="M3.33333 8H12.6667" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p1d405500} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Text() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="Text">
      <p className="-translate-x-1/2 absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[20px] left-[64px] text-[14px] text-center text-white top-px whitespace-nowrap">Enter Access Code</p>
      <Icon />
    </div>
  );
}

function LandingPage1() {
  return (
    <div className="absolute bg-[#615fff] content-stretch flex flex-col h-[52px] items-start left-0 overflow-clip pt-[16px] px-[32px] rounded-[16777200px] shadow-[0px_0px_40px_-10px_rgba(99,102,241,0.4)] top-0 w-[215.094px]" data-name="LandingPage">
      <Text />
    </div>
  );
}

function Container2() {
  return (
    <div className="absolute h-[52px] left-0 top-[386.09px] w-[364.914px]" data-name="Container">
      <LandingPage1 />
    </div>
  );
}

function Container4() {
  return <div className="absolute bg-[#7c86ff] left-[12.76px] opacity-76 rounded-[16777200px] shadow-[0px_0px_8px_0px_rgba(99,102,241,0.8)] size-[8.482px] top-[9.76px]" data-name="Container" />;
}

function LandingPage2() {
  return (
    <div className="absolute h-[16px] left-[28px] top-[6px] w-[153.141px]" data-name="LandingPage">
      <p className="absolute font-['Geist:Medium',sans-serif] font-medium leading-[16px] left-0 text-[#a3b3ff] text-[12px] top-px tracking-[0.3px] whitespace-nowrap">Private beta · Limited spots</p>
    </div>
  );
}

function Container3() {
  return (
    <div className="absolute bg-[rgba(97,95,255,0.08)] border border-[rgba(97,95,255,0.3)] border-solid h-[30px] left-0 overflow-clip rounded-[16777200px] top-[-0.45px] w-[196px]" data-name="Container">
      <Container4 />
      <LandingPage2 />
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute h-[438.086px] left-[64px] top-[250.45px] w-[576px]" data-name="Container">
      <Heading />
      <Paragraph />
      <Container2 />
      <Container3 />
    </div>
  );
}

function Icon1() {
  return (
    <div className="relative shrink-0 size-[11.761px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.7612 11.7612">
        <g clipPath="url(#clip0_81_1038)" id="Icon">
          <path d={svgPaths.p2fe48800} id="Vector" stroke="var(--stroke-0, #FE9A00)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.9801" />
          <path d="M5.88015 3.92025V5.88045" id="Vector_2" stroke="var(--stroke-0, #FE9A00)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.9801" />
          <path d="M5.88015 7.84065H5.88515" id="Vector_3" stroke="var(--stroke-0, #FE9A00)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.9801" />
        </g>
        <defs>
          <clipPath id="clip0_81_1038">
            <rect fill="white" height="11.7612" width="11.7612" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text1() {
  return (
    <div className="h-[14.702px] relative shrink-0 w-[69.97px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:Bold',sans-serif] font-bold leading-[14.701px] left-0 text-[#fe9a00] text-[9.801px] top-[0.49px] tracking-[0.49px] uppercase whitespace-nowrap">Priority Fix</p>
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex gap-[5.881px] h-[14.702px] items-center relative shrink-0 w-full" data-name="Container">
      <Icon1 />
      <Text1 />
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="h-[38.224px] relative shrink-0 w-full" data-name="Paragraph">
      <div className="absolute font-['Geist:Regular',sans-serif] font-normal leading-[0] left-0 text-[#d4d4d8] text-[11.761px] top-[0.49px] w-[151.915px] whitespace-pre-wrap">
        <p className="leading-[19.112px] mb-0">{`Add a clear CTA in `}</p>
        <p className="leading-[19.112px]">the final 3 seconds.</p>
      </div>
    </div>
  );
}

function LandingPage3() {
  return (
    <div className="absolute bg-[rgba(13,13,16,0.9)] content-stretch flex flex-col gap-[5.881px] h-[84.289px] items-start left-[26px] pb-[0.98px] pt-[12.741px] px-[16.662px] rounded-[15.682px] top-[37px] w-[193.622px]" data-name="LandingPage">
      <div aria-hidden="true" className="absolute border-[0.98px] border-[rgba(254,154,0,0.2)] border-solid inset-0 pointer-events-none rounded-[15.682px] shadow-[0px_19.602px_49.005px_0px_rgba(0,0,0,0.5)]" />
      <Container6 />
      <Paragraph1 />
    </div>
  );
}

function LandingPage4() {
  return (
    <div className="absolute grid-cols-[repeat(1,fit-content(100%))] grid-rows-[repeat(1,fit-content(100%))] inline-grid left-[52.83px] top-[66.3px]" data-name="LandingPage">
      <div className="col-1 font-['Gilda_Display:Regular',sans-serif] justify-self-start leading-[0] not-italic relative row-1 self-start shrink-0 text-[23.481px] text-black text-center whitespace-nowrap">
        <p className="leading-[24.797px] mb-0">He cooks.</p>
        <p className="leading-[24.797px]">We deliver.</p>
      </div>
    </div>
  );
}

function ImageAdCreative() {
  return (
    <div className="absolute h-[495.931px] left-0 overflow-clip top-0 w-[409.682px]" data-name="Image (Ad creative)">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImageAdCreative} />
      <LandingPage4 />
    </div>
  );
}

function Container8() {
  return <div className="h-[48.515px] shrink-0 w-[111.879px]" data-name="Container" />;
}

function LandingPage5() {
  return (
    <div className="absolute bg-gradient-to-t content-stretch flex flex-col from-[rgba(0,0,0,0.43)] h-[259.825px] items-start justify-end left-0 pb-[25.875px] pl-[28.031px] to-[rgba(0,0,0,0)] top-[236.11px] via-[60%] via-[rgba(0,0,0,0.2)] w-[409.682px]" data-name="LandingPage">
      <Container8 />
    </div>
  );
}

function Icon2() {
  return (
    <div className="relative shrink-0 size-[10.781px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.7811 10.7811">
        <g clipPath="url(#clip0_81_1022)" id="Icon">
          <path d={svgPaths.p1e53cdf0} id="Vector" stroke="var(--stroke-0, #9F9FA9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.898425" />
          <path d={svgPaths.p152fb520} id="Vector_2" stroke="var(--stroke-0, #9F9FA9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.898425" />
        </g>
        <defs>
          <clipPath id="clip0_81_1022">
            <rect fill="white" height="10.7811" width="10.7811" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text2() {
  return (
    <div className="flex-[1_0_0] h-[14.554px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:Medium',sans-serif] font-medium leading-[14.554px] left-0 text-[#e4e4e7] text-[9.703px] top-[0.54px] tracking-[0.2426px] uppercase whitespace-nowrap">Preview</p>
      </div>
    </div>
  );
}

function LandingPage6() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.5)] content-stretch flex gap-[6.469px] h-[25.336px] items-center left-[305.01px] px-[11.859px] py-[1.078px] rounded-[18087666px] top-[17.25px] w-[87.42px]" data-name="LandingPage">
      <div aria-hidden="true" className="absolute border-[1.078px] border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[18087666px] shadow-[0px_10.781px_16.172px_0px_rgba(0,0,0,0.1),0px_4.312px_6.469px_0px_rgba(0,0,0,0.1)]" />
      <Icon2 />
      <Text2 />
    </div>
  );
}

function Container7() {
  return (
    <div className="absolute bg-[#111113] h-[495.931px] left-[159.57px] overflow-clip rounded-[17.25px] shadow-[0px_34.5px_86.249px_0px_rgba(0,0,0,0.6)] top-0 w-[409.682px]" data-name="Container">
      <ImageAdCreative />
      <LandingPage5 />
      <LandingPage6 />
    </div>
  );
}

function Text3() {
  return (
    <div className="h-[10.61px] relative shrink-0 w-[116.077px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[10.61px] left-0 text-[#71717b] text-[7.073px] top-[0.35px] tracking-[0.8488px] uppercase whitespace-nowrap">PREDICTED PERFORMANCE</p>
      </div>
    </div>
  );
}

function Container10() {
  return (
    <div className="bg-[rgba(0,188,125,0.1)] h-[18.745px] relative rounded-[4.244px] shrink-0 w-[71.453px]" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0.707px] border-[rgba(0,188,125,0.2)] border-solid inset-0 pointer-events-none rounded-[4.244px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:Medium',sans-serif] font-medium leading-[11.671px] left-[6.36px] text-[#00d492] text-[7.781px] top-[4.24px] tracking-[0.1945px] whitespace-nowrap">High confidence</p>
      </div>
    </div>
  );
}

function Container9() {
  return (
    <div className="absolute content-stretch flex h-[18.745px] items-center justify-between left-[14.15px] top-[14.15px] w-[205.131px]" data-name="Container">
      <Text3 />
      <Container10 />
    </div>
  );
}

function Text4() {
  return (
    <div className="h-[11.671px] relative shrink-0 w-[121.824px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[11.671px] left-0 text-[#71717b] text-[7.781px] top-[0.71px] tracking-[0.9337px] uppercase whitespace-nowrap">EST. CTR</p>
      </div>
    </div>
  );
}

function Text5() {
  return (
    <div className="flex-[1_0_0] h-[22.635px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:Bold',sans-serif] font-bold leading-[0] left-0 text-[#f4f4f5] text-[0px] top-[1.77px] tracking-[-0.5659px] whitespace-nowrap">
          <span className="leading-[22.635px] text-[22.635px]">{`0.8% `}</span>
          <span className="font-['Geist:Medium',sans-serif] font-medium leading-[16.976px] text-[#71717b] text-[16.976px]">–</span>
          <span className="leading-[22.635px] text-[22.635px]">{` 1.4%`}</span>
        </p>
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[121.824px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative size-full">
        <Text5 />
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[5.659px] h-[39.965px] items-start left-0 top-0 w-[121.824px]" data-name="Container">
      <Text4 />
      <Container14 />
    </div>
  );
}

function Text6() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[75.83px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:Medium',sans-serif] font-medium leading-[12.732px] left-0 text-[#9f9fa9] text-[8.488px] top-[0.71px] whitespace-nowrap">YouTube avg · 0.6%</p>
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="absolute content-stretch flex flex-col h-[12.732px] items-end left-[129.3px] top-[24.4px] w-[75.83px]" data-name="Container">
      <Text6 />
    </div>
  );
}

function Container12() {
  return (
    <div className="absolute h-[39.965px] left-0 top-0 w-[205.131px]" data-name="Container">
      <Container13 />
      <Container15 />
    </div>
  );
}

function Container17() {
  return (
    <div className="absolute h-[10.61px] left-0 top-0 w-[10.223px]" data-name="Container">
      <p className="absolute font-['Geist:Medium',sans-serif] font-medium leading-[10.61px] left-0 text-[#71717b] text-[7.073px] top-[0.35px] whitespace-nowrap">0%</p>
    </div>
  );
}

function Container18() {
  return (
    <div className="absolute h-[10.61px] left-[190.77px] top-0 w-[14.357px]" data-name="Container">
      <p className="absolute font-['Geist:Medium',sans-serif] font-medium leading-[10.61px] left-0 text-[#71717b] text-[7.073px] top-[0.35px] whitespace-nowrap">3%+</p>
    </div>
  );
}

function Container20() {
  return <div className="absolute bg-[#6366f1] h-[2.829px] left-[54.56px] rounded-[11867317px] top-0 w-[41.026px]" data-name="Container" />;
}

function Container21() {
  return <div className="absolute bg-[#9f9fa9] h-[8.488px] left-[41.03px] top-[-2.83px] w-[1.415px]" data-name="Container" />;
}

function Container19() {
  return (
    <div className="absolute bg-[#27272a] h-[2.829px] left-0 rounded-[11867317px] top-[16.98px] w-[205.131px]" data-name="Container">
      <Container20 />
      <Container21 />
    </div>
  );
}

function Container16() {
  return (
    <div className="absolute h-[25.465px] left-0 top-[51.28px] w-[205.131px]" data-name="Container">
      <Container17 />
      <Container18 />
      <Container19 />
    </div>
  );
}

function Container11() {
  return (
    <div className="absolute h-[76.747px] left-[14.15px] top-[55.53px] w-[205.131px]" data-name="Container">
      <Container12 />
      <Container16 />
    </div>
  );
}

function Icon3() {
  return (
    <div className="h-[9.903px] relative shrink-0 w-[8.018px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.01845 9.90287">
        <g id="Icon">
          <path d={svgPaths.p34b4d300} id="Vector" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.668204" />
          <path d={svgPaths.p17e31d80} id="Vector_2" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.668204" />
          <path d={svgPaths.p4dcbd30} id="Vector_3" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.668204" />
        </g>
      </svg>
    </div>
  );
}

function Text7() {
  return (
    <div className="flex-[1_0_0] h-[23.342px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[11.671px] left-0 text-[#71717b] text-[7.781px] top-[0.71px] tracking-[0.9337px] uppercase w-[53.051px]">CVR POTENTIAL</p>
      </div>
    </div>
  );
}

function Container24() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[72.857px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4.244px] items-center relative size-full">
        <Icon3 />
        <Text7 />
      </div>
    </div>
  );
}

function Text8() {
  return (
    <div className="h-[19.098px] relative shrink-0 w-[72.857px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[19.098px] left-0 text-[#e4e4e7] text-[12.732px] top-[0.71px] whitespace-nowrap">1.2% – 2.1%</p>
      </div>
    </div>
  );
}

function Container23() {
  return (
    <div className="bg-[rgba(255,255,255,0.01)] col-1 justify-self-stretch relative rounded-[16.976px] row-1 self-stretch shrink-0" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0.707px] border-[rgba(255,255,255,0.04)] border-solid inset-0 pointer-events-none rounded-[16.976px]" />
      <div className="content-stretch flex flex-col gap-[5.659px] items-start pl-[12.025px] pr-[0.707px] py-[12.025px] relative size-full">
        <Container24 />
        <Text8 />
      </div>
    </div>
  );
}

function Icon4() {
  return (
    <div className="h-[9.903px] relative shrink-0 w-[6.869px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.86901 9.90287">
        <g clipPath="url(#clip0_81_1043)" id="Icon">
          <path d={svgPaths.p298d8a70} id="Vector" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.572418" />
          <path d={svgPaths.pc20cd40} id="Vector_2" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.572418" />
        </g>
        <defs>
          <clipPath id="clip0_81_1043">
            <rect fill="white" height="9.90287" width="6.86901" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Text9() {
  return (
    <div className="flex-[1_0_0] h-[23.342px] min-h-px min-w-px relative" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[11.671px] left-0 text-[#71717b] text-[7.781px] top-[0.71px] tracking-[0.9337px] uppercase w-[46.685px]">CREATIVE FATIGUE</p>
      </div>
    </div>
  );
}

function Container26() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[72.857px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4.244px] items-center relative size-full">
        <Icon4 />
        <Text9 />
      </div>
    </div>
  );
}

function Text10() {
  return (
    <div className="h-[19.098px] relative shrink-0 w-[72.857px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[19.098px] left-0 text-[#e4e4e7] text-[12.732px] top-[0.71px] whitespace-nowrap">~14 days</p>
      </div>
    </div>
  );
}

function Container25() {
  return (
    <div className="bg-[rgba(255,255,255,0.01)] col-2 justify-self-stretch relative rounded-[16.976px] row-1 self-stretch shrink-0" data-name="Container">
      <div aria-hidden="true" className="absolute border-[0.707px] border-[rgba(255,255,255,0.04)] border-solid inset-0 pointer-events-none rounded-[16.976px]" />
      <div className="content-stretch flex flex-col gap-[5.659px] items-start pl-[12.025px] pr-[0.707px] py-[12.025px] relative size-full">
        <Container26 />
        <Text10 />
      </div>
    </div>
  );
}

function Container22() {
  return (
    <div className="absolute gap-x-[11.317566871643066px] gap-y-[11.317566871643066px] grid grid-cols-[repeat(2,minmax(0,1fr))] grid-rows-[repeat(1,minmax(0,1fr))] h-[72.149px] left-[14.15px] top-[146.42px] w-[205.131px]" data-name="Container">
      <Container23 />
      <Container25 />
    </div>
  );
}

function PredictedPerformanceCard() {
  return (
    <div className="absolute bg-[rgba(13,13,16,0.9)] border-[0.707px] border-[rgba(255,255,255,0.06)] border-solid h-[234.036px] left-[417.14px] rounded-[11.318px] shadow-[0px_21.562px_53.905px_0px_rgba(0,0,0,0.5)] top-[339.25px] w-[234.909px]" data-name="PredictedPerformanceCard">
      <Container9 />
      <Container11 />
      <Container22 />
    </div>
  );
}

function Text11() {
  return (
    <div className="h-[8.769px] relative shrink-0 w-[60.456px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:SemiBold',sans-serif] font-semibold leading-[8.769px] left-0 text-[#71717b] text-[5.846px] top-[0.53px] tracking-[0.7015px] uppercase whitespace-nowrap">OVERALL SCORE</p>
      </div>
    </div>
  );
}

function Text12() {
  return (
    <div className="absolute h-[27.635px] left-0 top-0 w-[36.346px]" data-name="Text">
      <p className="absolute font-['Geist:Bold',sans-serif] font-bold leading-[27.635px] left-0 text-[#10b981] text-[27.635px] top-[2.13px] tracking-[-0.6909px] whitespace-nowrap">7.2</p>
    </div>
  );
}

function Text13() {
  return (
    <div className="absolute h-[14.88px] left-[42.72px] top-[12.75px] w-[17.733px]" data-name="Text">
      <p className="absolute font-['Geist:Bold',sans-serif] font-bold leading-[12.755px] left-0 text-[#52525c] text-[12.755px] top-[0.53px] whitespace-nowrap">/10</p>
    </div>
  );
}

function Container30() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[60.456px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text12 />
        <Text13 />
      </div>
    </div>
  );
}

function Container29() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[2.126px] h-[38.529px] items-start left-0 top-0 w-[60.456px]" data-name="Container">
      <Text11 />
      <Container30 />
    </div>
  );
}

function Container28() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[154.118px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container29 />
      </div>
    </div>
  );
}

function Icon5() {
  return (
    <div className="absolute left-0 size-[7.44px] top-[1.06px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.44017 7.44017">
        <g id="Icon">
          <path d="M5.58067 6.20022V3.10014" id="Vector" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.620014" />
          <path d="M3.72014 6.20033V1.24021" id="Vector_2" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.620014" />
          <path d="M1.85971 6.20021V4.34017" id="Vector_3" stroke="var(--stroke-0, #71717B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.620014" />
        </g>
      </svg>
    </div>
  );
}

function Text14() {
  return (
    <div className="h-[9.566px] relative shrink-0 w-[86.525px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon5 />
        <p className="absolute font-['Geist:Regular',sans-serif] font-normal leading-[9.566px] left-[10.63px] text-[#71717b] text-[6.377px] top-[0.53px] whitespace-nowrap">Vs. TikTok Average (6.4)</p>
      </div>
    </div>
  );
}

function Text15() {
  return (
    <div className="h-[9.566px] relative shrink-0 w-[22.869px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Geist:Medium',sans-serif] font-medium leading-[9.566px] left-0 text-[#00d492] text-[6.377px] top-[0.53px] whitespace-nowrap">+0.8 pts</p>
      </div>
    </div>
  );
}

function Container32() {
  return (
    <div className="absolute content-stretch flex h-[9.566px] items-center justify-between left-0 top-[4.25px] w-[154.118px]" data-name="Container">
      <Text14 />
      <Text15 />
    </div>
  );
}

function Container34() {
  return <div className="absolute bg-[#10b981] h-[3.189px] left-0 rounded-[8916091px] top-0 w-[110.963px]" data-name="Container" />;
}

function Container35() {
  return <div className="absolute bg-[#71717b] h-[3.189px] left-[98.63px] top-0 w-[1.063px]" data-name="Container" />;
}

function Container33() {
  return (
    <div className="absolute bg-[#3f3f46] h-[3.189px] left-0 overflow-clip rounded-[8916091px] top-[18.07px] w-[154.118px]" data-name="Container">
      <Container34 />
      <Container35 />
    </div>
  );
}

function Container31() {
  return (
    <div className="h-[21.258px] relative shrink-0 w-[154.118px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container32 />
        <Container33 />
      </div>
    </div>
  );
}

function Container27() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[8.503px] h-[68.29px] items-start left-[10.63px] top-[10px] w-[154.118px]" data-name="Container">
      <Container28 />
      <Container31 />
    </div>
  );
}

function LandingPage7() {
  return (
    <div className="absolute bg-[rgba(97,95,255,0.15)] border-[0.891px] border-[rgba(97,95,255,0.3)] border-solid h-[17.374px] right-[-15.32px] rounded-[14948486px] top-[5.53px] w-[93.826px]" data-name="LandingPage">
      <p className="absolute font-['Geist:Bold',sans-serif] font-bold leading-[12.028px] left-[7.13px] text-[#a3b3ff] text-[8.019px] top-[2.23px] tracking-[0.4009px] whitespace-nowrap">GOOD POTENTIAL</p>
    </div>
  );
}

function ScoreCard() {
  return (
    <div className="absolute bg-[rgba(13,13,16,0.9)] border-[0.531px] border-[rgba(255,255,255,0.06)] border-solid h-[89.1px] left-[475.46px] rounded-[8.503px] top-[216.94px] w-[176.58px]" data-name="ScoreCard">
      <Container27 />
      <LandingPage7 />
    </div>
  );
}

function LandingPage8() {
  return (
    <div className="absolute bg-[rgba(251,44,54,0.1)] border-[0.98px] border-[rgba(251,44,54,0.2)] border-solid h-[27px] left-[-4px] rounded-[16443334px] shadow-[0px_9.801px_19.602px_0px_rgba(0,0,0,0.3)] top-0 w-[155px]" data-name="LandingPage">
      <p className="absolute font-['Geist:Bold',sans-serif] font-bold leading-[14.701px] left-[11.76px] text-[#ff6467] text-[9.801px] top-[6.37px] tracking-[0.245px] whitespace-nowrap">NOT READY · 3 critical fixes</p>
    </div>
  );
}

function Container5() {
  return (
    <div className="absolute h-[585.63px] right-[64.56px] top-[176px] w-[667.44px]" data-name="Container">
      <LandingPage3 />
      <Container7 />
      <PredictedPerformanceCard />
      <ScoreCard />
      <LandingPage8 />
    </div>
  );
}

function Container() {
  return (
    <div className="absolute h-[780px] left-0 right-[-1px] top-0" data-name="Container">
      <Gradient />
      <Container1 />
      <Container5 />
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-[#09090b] relative size-full" data-name="LandingPage">
      <Container />
    </div>
  );
}