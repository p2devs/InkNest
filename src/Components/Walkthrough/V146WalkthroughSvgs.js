import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  Easing,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Rect,
  G,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

// Colors
const COMICS_PURPLE = '#667EEA';
const MANGA_BLUE = '#007AFF';
const DARK_BG = '#1a1a2e';
const WHITE = '#FFFFFF';

// Animated wrapper for SVG components
const createAnimatedSvg = (SvgComponent) => {
  return ({ size = 180, ...props }) => {
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      // Entrance animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();

      // Subtle pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    }, []);

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }, { scale: pulseAnim }] }}>
        <SvgComponent size={size} {...props} />
      </Animated.View>
    );
  };
};

// Step 1: Welcome SVG - Animated logo with pulsing effect
const WelcomeSvgBase = ({ size = 180 }) => (
  <Svg width={size} height={size} viewBox="0 0 180 180">
    <Defs>
      <LinearGradient id="welcomeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={COMICS_PURPLE} />
        <Stop offset="100%" stopColor={MANGA_BLUE} />
      </LinearGradient>
    </Defs>

    {/* Outer glow circle */}
    <Circle cx="90" cy="90" r="85" fill="none" stroke="url(#welcomeGrad)" strokeWidth="2" opacity="0.3" />

    {/* Main circle */}
    <Circle cx="90" cy="90" r="70" fill="url(#welcomeGrad)" />

    {/* IN text */}
    <SvgText
      x="90"
      y="100"
      textAnchor="middle"
      fill={WHITE}
      fontSize="36"
      fontWeight="bold"
      fontFamily="System">
      IN
    </SvgText>

    {/* Version badge */}
    <G transform="translate(130, 130)">
      <Rect x="0" y="0" width="45" height="22" rx="11" fill={MANGA_BLUE} />
      <SvgText x="22.5" y="15" textAnchor="middle" fill={WHITE} fontSize="10" fontWeight="600">
        1.4.6
      </SvgText>
    </G>

    {/* Decorative elements */}
    <Circle cx="35" cy="50" r="4" fill={COMICS_PURPLE} opacity="0.6" />
    <Circle cx="145" cy="50" r="4" fill={MANGA_BLUE} opacity="0.6" />
    <Circle cx="35" cy="130" r="4" fill={MANGA_BLUE} opacity="0.6" />
  </Svg>
);

// Step 2: Manga Tab SVG - Animated tab switcher
const MangaTabSvgBase = ({ size = 180 }) => (
  <Svg width={size} height={size * 0.7} viewBox="0 0 180 126">
    <Defs>
      <LinearGradient id="tabGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor={COMICS_PURPLE} />
        <Stop offset="100%" stopColor={MANGA_BLUE} />
      </LinearGradient>
    </Defs>

    {/* Background */}
    <Rect x="10" y="20" width="160" height="86" rx="12" fill="#2a2a4a" />

    {/* Tab bar */}
    <Rect x="10" y="20" width="160" height="36" rx="12" fill="#1a1a2e" />
    <Rect x="10" y="44" width="160" height="12" fill="#1a1a2e" />

    {/* Comics tab */}
    <G>
      <Rect x="18" y="28" width="70" height="24" rx="8" fill="transparent" />
      <SvgText x="53" y="44" textAnchor="middle" fill="#888" fontSize="13" fontWeight="500">
        Comics
      </SvgText>
    </G>

    {/* Manga tab (active) */}
    <G>
      <Rect x="92" y="26" width="70" height="26" rx="8" fill={MANGA_BLUE} />
      <SvgText x="127" y="44" textAnchor="middle" fill={WHITE} fontSize="13" fontWeight="600">
        Manga
      </SvgText>
    </G>

    {/* Arrow pointing to Manga tab */}
    <Path
      d="M127 10 L127 22 M120 16 L127 22 L134 16"
      stroke={MANGA_BLUE}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />

    {/* Content area - book icons */}
    <G transform="translate(25, 68)">
      <Rect x="0" y="0" width="30" height="28" rx="3" fill="#3a3a5a" />
      <Rect x="4" y="4" width="22" height="3" rx="1" fill="#555" />
      <Rect x="4" y="10" width="18" height="2" rx="1" fill="#555" />
    </G>
    <G transform="translate(65, 68)">
      <Rect x="0" y="0" width="30" height="28" rx="3" fill="#3a3a5a" />
      <Rect x="4" y="4" width="22" height="3" rx="1" fill="#555" />
      <Rect x="4" y="10" width="18" height="2" rx="1" fill="#555" />
    </G>
    <G transform="translate(105, 68)">
      <Rect x="0" y="0" width="30" height="28" rx="3" fill="url(#tabGrad)" />
      <Rect x="4" y="4" width="22" height="3" rx="1" fill="#fff" opacity="0.5" />
      <Rect x="4" y="10" width="18" height="2" rx="1" fill="#fff" opacity="0.3" />
    </G>
  </Svg>
);

// Step 3: Unified Search SVG - Search icon with tabs
const UnifiedSearchSvgBase = ({ size = 180 }) => (
  <Svg width={size} height={size * 0.75} viewBox="0 0 180 135">
    <Defs>
      <LinearGradient id="searchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={COMICS_PURPLE} />
        <Stop offset="100%" stopColor={MANGA_BLUE} />
      </LinearGradient>
    </Defs>

    {/* Search magnifying glass */}
    <G transform="translate(55, 10)">
      <Circle cx="30" cy="30" r="25" stroke="url(#searchGrad)" strokeWidth="4" fill="none" />
      <Path
        d="M48 48 L65 65"
        stroke="url(#searchGrad)"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </G>

    {/* Results tabs */}
    <G transform="translate(20, 80)">
      {/* Comics result tab */}
      <G>
        <Rect x="0" y="0" width="60" height="45" rx="8" fill="#2a2a4a" stroke={COMICS_PURPLE} strokeWidth="1" />
        <Rect x="8" y="10" width="20" height="20" rx="3" fill={COMICS_PURPLE} opacity="0.3" />
        <Rect x="32" y="12" width="20" height="3" rx="1" fill="#666" />
        <Rect x="32" y="18" width="15" height="2" rx="1" fill="#555" />
        <SvgText x="30" y="42" textAnchor="middle" fill={COMICS_PURPLE} fontSize="9" fontWeight="500">
          Comics
        </SvgText>
      </G>

      {/* Manga result tab */}
      <G transform="translate(70, 0)">
        <Rect x="0" y="0" width="60" height="45" rx="8" fill="#2a2a4a" stroke={MANGA_BLUE} strokeWidth="1" />
        <Rect x="8" y="10" width="20" height="20" rx="3" fill={MANGA_BLUE} opacity="0.3" />
        <Rect x="32" y="12" width="20" height="3" rx="1" fill="#666" />
        <Rect x="32" y="18" width="15" height="2" rx="1" fill="#555" />
        <SvgText x="30" y="42" textAnchor="middle" fill={MANGA_BLUE} fontSize="9" fontWeight="500">
          Manga
        </SvgText>
      </G>
    </G>

    {/* Decorative dots */}
    <Circle cx="140" cy="95" r="3" fill={COMICS_PURPLE} opacity="0.5" />
    <Circle cx="150" cy="105" r="2" fill={MANGA_BLUE} opacity="0.5" />
  </Svg>
);

// Step 4: Manga Bookmarks SVG
const MangaBookmarksSvgBase = ({ size = 180 }) => (
  <Svg width={size} height={size * 0.75} viewBox="0 0 180 135">
    <Defs>
      <LinearGradient id="bookmarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={COMICS_PURPLE} />
        <Stop offset="100%" stopColor={MANGA_BLUE} />
      </LinearGradient>
    </Defs>

    {/* Main bookmark icon */}
    <G transform="translate(60, 15)">
      <Path
        d="M10 0 L40 0 C45 0 50 5 50 10 L50 60 L30 45 L10 60 L10 10 C10 5 15 0 20 0 Z"
        fill="url(#bookmarkGrad)"
      />
      {/* Star */}
      <Path
        d="M30 20 L32 26 L38 26 L33 30 L35 36 L30 32 L25 36 L27 30 L22 26 L28 26 Z"
        fill={WHITE}
      />
    </G>

    {/* Tabs below */}
    <G transform="translate(30, 90)">
      {/* Comics tab */}
      <Rect x="0" y="0" width="50" height="30" rx="6" fill="#2a2a4a" />
      <SvgText x="25" y="20" textAnchor="middle" fill="#888" fontSize="11" fontWeight="500">
        Comics
      </SvgText>

      {/* Manga tab (active) */}
      <G transform="translate(60, 0)">
        <Rect x="0" y="0" width="50" height="30" rx="6" fill={MANGA_BLUE} />
        <SvgText x="25" y="20" textAnchor="middle" fill={WHITE} fontSize="11" fontWeight="600">
          Manga
        </SvgText>
      </G>
    </G>

    {/* Count badge */}
    <G transform="translate(135, 30)">
      <Circle cx="12" cy="12" r="14" fill={MANGA_BLUE} />
      <SvgText x="12" y="16" textAnchor="middle" fill={WHITE} fontSize="12" fontWeight="bold">
        5
      </SvgText>
    </G>
  </Svg>
);

// Step 5: Reading Progress SVG
const ReadingProgressSvgBase = ({ size = 180 }) => (
  <Svg width={size} height={size * 0.75} viewBox="0 0 180 135">
    <Defs>
      <LinearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor={COMICS_PURPLE} />
        <Stop offset="100%" stopColor={MANGA_BLUE} />
      </LinearGradient>
    </Defs>

    {/* Book cover placeholder */}
    <G transform="translate(30, 15)">
      <Rect x="0" y="0" width="50" height="70" rx="4" fill="#2a2a4a" stroke="#444" strokeWidth="1" />
      <Rect x="8" y="12" width="34" height="4" rx="2" fill="#555" />
      <Rect x="8" y="22" width="28" height="3" rx="1" fill="#444" />
      <Rect x="8" y="30" width="30" height="3" rx="1" fill="#444" />
      {/* Manga label */}
      <Rect x="8" y="50" width="34" height="14" rx="3" fill={MANGA_BLUE} opacity="0.3" />
      <SvgText x="25" y="60" textAnchor="middle" fill={MANGA_BLUE} fontSize="8" fontWeight="500">
        MANGA
      </SvgText>
    </G>

    {/* Progress section */}
    <G transform="translate(95, 25)">
      {/* Progress bar background */}
      <Rect x="0" y="0" width="70" height="8" rx="4" fill="#333" />

      {/* Progress bar fill (65% filled) */}
      <Rect x="0" y="0" width="45" height="8" rx="4" fill="url(#progressGrad)" />

      {/* Percentage text */}
      <SvgText x="35" y="30" textAnchor="middle" fill={WHITE} fontSize="18" fontWeight="bold">
        65%
      </SvgText>

      {/* Page info */}
      <SvgText x="35" y="48" textAnchor="middle" fill="#888" fontSize="10">
        Page 13 of 20
      </SvgText>
    </G>

    {/* Continue button */}
    <G transform="translate(90, 95)">
      <Rect x="0" y="0" width="75" height="28" rx="8" fill={MANGA_BLUE} />
      <SvgText x="37.5" y="18" textAnchor="middle" fill={WHITE} fontSize="11" fontWeight="600">
        Continue
      </SvgText>
      <Path d="M55 14 L60 14 L57 11 M60 14 L57 17" stroke={WHITE} strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </G>

    {/* Auto-save indicator */}
    <G transform="translate(30, 95)">
      <Circle cx="10" cy="10" r="8" fill="#2a2a4a" stroke="#00C853" strokeWidth="1" />
      <Path d="M6 10 L9 13 L14 7" stroke="#00C853" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <SvgText x="25" y="14" fill="#00C853" fontSize="9">Auto-saved</SvgText>
    </G>
  </Svg>
);

// Step 6: ReadAllComic Enhanced Results SVG
const ReadAllComicEnhancedSvgBase = ({ size = 180 }) => (
  <Svg width={size} height={size * 0.85} viewBox="0 0 180 153">
    <Defs>
      <LinearGradient id="readAllGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={COMICS_PURPLE} />
        <Stop offset="100%" stopColor={MANGA_BLUE} />
      </LinearGradient>
    </Defs>

    {/* Search result card */}
    <G transform="translate(15, 10)">
      {/* Card background */}
      <Rect x="0" y="0" width="150" height="80" rx="12" fill="#2a2a4a" stroke="url(#readAllGrad)" strokeWidth="1" />

      {/* Cover image placeholder */}
      <Rect x="10" y="10" width="40" height="60" rx="6" fill="url(#readAllGrad)" />
      <Rect x="16" y="20" width="28" height="3" rx="1" fill={WHITE} opacity="0.5" />
      <Rect x="16" y="28" width="20" height="2" rx="1" fill={WHITE} opacity="0.3" />

      {/* Content area */}
      <G transform="translate(58, 12)">
        {/* Badge */}
        <Rect x="0" y="0" width="55" height="14" rx="4" fill={COMICS_PURPLE} opacity="0.3" />
        <SvgText x="27.5" y="10" textAnchor="middle" fill={COMICS_PURPLE} fontSize="7" fontWeight="700">
          READALLCOMIC
        </SvgText>

        {/* Title */}
        <SvgText x="0" y="28" fill={WHITE} fontSize="10" fontWeight="600">
          Spider-Man #1
        </SvgText>

        {/* Publisher row */}
        <G transform="translate(0, 35)">
          <Circle cx="5" cy="4" r="3" fill="#888" />
          <SvgText x="12" y="7" fill="#888" fontSize="8">Marvel</SvgText>
        </G>

        {/* Meta info */}
        <G transform="translate(0, 48)">
          <Rect x="0" y="0" width="35" height="12" rx="3" fill="#4CAF50" opacity="0.2" />
          <SvgText x="17.5" y="9" textAnchor="middle" fill="#4CAF50" fontSize="7">45 Issues</SvgText>

          <Rect x="40" y="0" width="30" height="12" rx="3" fill="#FF9800" opacity="0.2" />
          <SvgText x="55" y="9" textAnchor="middle" fill="#FF9800" fontSize="7">2d ago</SvgText>
        </G>
      </G>

      {/* Arrow indicator */}
      <G transform="translate(130, 30)">
        <Circle cx="8" cy="8" r="10" fill={COMICS_PURPLE} opacity="0.2" />
        <Path d="M6 8 L10 8 L8 6 M10 8 L8 10" stroke={COMICS_PURPLE} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </G>
    </G>

    {/* Feature highlights */}
    <G transform="translate(15, 100)">
      {/* Cover icon */}
      <G transform="translate(0, 0)">
        <Circle cx="12" cy="12" r="14" fill="#2a2a4a" />
        <Rect x="6" y="6" width="12" height="14" rx="2" fill="#4CAF50" />
        <SvgText x="12" y="42" textAnchor="middle" fill="#888" fontSize="8">Cover</SvgText>
      </G>

      {/* Publisher icon */}
      <G transform="translate(45, 0)">
        <Circle cx="12" cy="12" r="14" fill="#2a2a4a" />
        <Rect x="6" y="8" width="12" height="8" rx="1" fill="#FF9800" />
        <SvgText x="12" y="42" textAnchor="middle" fill="#888" fontSize="8">Publisher</SvgText>
      </G>

      {/* Issues icon */}
      <G transform="translate(90, 0)">
        <Circle cx="12" cy="12" r="14" fill="#2a2a4a" />
        <Rect x="7" y="6" width="10" height="6" rx="1" fill={MANGA_BLUE} />
        <Rect x="7" y="14" width="10" height="6" rx="1" fill={MANGA_BLUE} opacity="0.6" />
        <SvgText x="12" y="42" textAnchor="middle" fill="#888" fontSize="8">Issues</SvgText>
      </G>

      {/* Latest icon */}
      <G transform="translate(135, 0)">
        <Circle cx="12" cy="12" r="14" fill="#2a2a4a" />
        <Path d="M12 7 L12 12 L16 14" stroke={COMICS_PURPLE} strokeWidth="2" strokeLinecap="round" fill="none" />
        <SvgText x="12" y="42" textAnchor="middle" fill="#888" fontSize="8">Latest</SvgText>
      </G>
    </G>
  </Svg>
);

// Step 7: Comic Background Color SVG
const ComicBackgroundSvgBase = ({ size = 180 }) => (
  <Svg width={size} height={size * 0.85} viewBox="0 0 180 153">
    <Defs>
      <LinearGradient id="bgColorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={COMICS_PURPLE} />
        <Stop offset="100%" stopColor={MANGA_BLUE} />
      </LinearGradient>
    </Defs>

    {/* Comic reader preview */}
    <G transform="translate(20, 10)">
      {/* Reader frame */}
      <Rect x="0" y="0" width="140" height="70" rx="10" fill="#1a1a2e" stroke="#333" strokeWidth="1" />

      {/* Comic page preview */}
      <Rect x="10" y="8" width="55" height="54" rx="4" fill="#2a2a4a" />
      <Rect x="15" y="15" width="45" height="8" rx="2" fill="#3a3a5a" />
      <Rect x="15" y="28" width="40" height="4" rx="1" fill="#3a3a5a" />
      <Rect x="15" y="36" width="42" height="4" rx="1" fill="#3a3a5a" />
      <Rect x="15" y="44" width="35" height="4" rx="1" fill="#3a3a5a" />

      {/* Second page */}
      <Rect x="75" y="8" width="55" height="54" rx="4" fill="#F5E6D3" />
      <Rect x="80" y="15" width="45" height="8" rx="2" fill="#D4C4B0" />
      <Rect x="80" y="28" width="40" height="4" rx="1" fill="#D4C4B0" />
      <Rect x="80" y="36" width="42" height="4" rx="1" fill="#D4C4B0" />
      <Rect x="80" y="44" width="35" height="4" rx="1" fill="#D4C4B0" />
    </G>

    {/* Color palette */}
    <G transform="translate(20, 90)">
      {/* Default */}
      <G transform="translate(0, 0)">
        <Rect x="0" y="0" width="24" height="24" rx="12" fill="#14142A" stroke="#667EEA" strokeWidth="2" />
        <SvgText x="12" y="38" textAnchor="middle" fill="#888" fontSize="8">Default</SvgText>
      </G>

      {/* White */}
      <G transform="translate(30, 0)">
        <Rect x="0" y="0" width="24" height="24" rx="12" fill="#FFFFFF" stroke="#333" strokeWidth="1" />
        <SvgText x="12" y="38" textAnchor="middle" fill="#888" fontSize="8">White</SvgText>
      </G>

      {/* Black */}
      <G transform="translate(60, 0)">
        <Rect x="0" y="0" width="24" height="24" rx="12" fill="#000000" stroke="#444" strokeWidth="1" />
        <SvgText x="12" y="38" textAnchor="middle" fill="#888" fontSize="8">Black</SvgText>
      </G>

      {/* Sepia - selected */}
      <G transform="translate(90, 0)">
        <Rect x="0" y="0" width="24" height="24" rx="12" fill="#F5E6D3" stroke="url(#bgColorGrad)" strokeWidth="3" />
        <Path d="M12 7 L12 17 M7 12 L17 12" stroke="#8B7765" strokeWidth="2" strokeLinecap="round" />
        <SvgText x="12" y="38" textAnchor="middle" fill="#888" fontSize="8">Sepia</SvgText>
      </G>

      {/* Cream */}
      <G transform="translate(120, 0)">
        <Rect x="0" y="0" width="24" height="24" rx="12" fill="#FFFDD0" stroke="#333" strokeWidth="1" />
        <SvgText x="12" y="38" textAnchor="middle" fill="#888" fontSize="8">Cream</SvgText>
      </G>
    </G>

    {/* Palette icon */}
    <G transform="translate(75, 135)">
      <Circle cx="15" cy="10" r="12" fill="url(#bgColorGrad)" opacity="0.2" />
      <Path
        d="M15 2 C8 2 2 8 2 15 C2 22 8 25 12 24 C14 23 14 20 12 18 C10 16 10 13 12 11 C14 9 18 9 20 11 C22 13 22 16 20 18 C19 19 19 21 20 22 C22 23 26 20 26 15 C26 8 22 2 15 2 Z"
        fill="url(#bgColorGrad)"
        transform="scale(0.7) translate(8, 5)"
      />
      <SvgText x="15" y="28" textAnchor="middle" fill="#aaa" fontSize="9">
        Customize in Settings
      </SvgText>
    </G>
  </Svg>
);

// Step 6: Get Started SVG - Celebration/checkmark
const GetStartedSvgBase = ({ size = 180 }) => (
  <Svg width={size} height={size * 0.75} viewBox="0 0 180 135">
    <Defs>
      <LinearGradient id="celebrationGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={COMICS_PURPLE} />
        <Stop offset="100%" stopColor={MANGA_BLUE} />
      </LinearGradient>
    </Defs>

    {/* Main circle */}
    <Circle cx="90" cy="50" r="40" fill="url(#celebrationGrad)" />

    {/* Checkmark */}
    <Path
      d="M70 50 L85 65 L110 35"
      stroke={WHITE}
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />

    {/* Decorative elements - confetti-like */}
    <Circle cx="40" cy="30" r="4" fill={COMICS_PURPLE} opacity="0.7" />
    <Circle cx="140" cy="35" r="4" fill={MANGA_BLUE} opacity="0.7" />
    <Circle cx="50" cy="75" r="3" fill={MANGA_BLUE} opacity="0.5" />
    <Circle cx="130" cy="70" r="3" fill={COMICS_PURPLE} opacity="0.5" />

    {/* Small stars */}
    <Path d="M30 55 L32 60 L37 60 L33 63 L34 68 L30 65 L26 68 L27 63 L23 60 L28 60 Z" fill={COMICS_PURPLE} opacity="0.6" />
    <Path d="M150 50 L151.5 53 L155 53 L152.5 55 L153.5 58 L150 56 L146.5 58 L147.5 55 L145 53 L148.5 53 Z" fill={MANGA_BLUE} opacity="0.6" />

    {/* Ready text */}
    <SvgText x="90" y="115" textAnchor="middle" fill={WHITE} fontSize="16" fontWeight="bold">
      Ready to Explore!
    </SvgText>

    {/* Subtitle */}
    <SvgText x="90" y="132" textAnchor="middle" fill="#888" fontSize="10">
      Dive into the world of manga and comics
    </SvgText>
  </Svg>
);

// Export animated versions
export const WelcomeSvg = createAnimatedSvg(WelcomeSvgBase);
export const MangaTabSvg = createAnimatedSvg(MangaTabSvgBase);
export const UnifiedSearchSvg = createAnimatedSvg(UnifiedSearchSvgBase);
export const MangaBookmarksSvg = createAnimatedSvg(MangaBookmarksSvgBase);
export const ReadingProgressSvg = createAnimatedSvg(ReadingProgressSvgBase);
export const ReadAllComicEnhancedSvg = createAnimatedSvg(ReadAllComicEnhancedSvgBase);
export const ComicBackgroundSvg = createAnimatedSvg(ComicBackgroundSvgBase);
export const GetStartedSvg = createAnimatedSvg(GetStartedSvgBase);

export default {
  WelcomeSvg,
  MangaTabSvg,
  UnifiedSearchSvg,
  MangaBookmarksSvg,
  ReadingProgressSvg,
  ReadAllComicEnhancedSvg,
  ComicBackgroundSvg,
  GetStartedSvg,
};