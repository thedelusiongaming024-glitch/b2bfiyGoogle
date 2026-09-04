import React from "react";
import bgImage from "../assets/images/premium-bg.jpg";

/**
 * SiteBackground
 * A fixed, full-viewport decorative background layer.
 * - Uses `position: fixed` (not CSS `background-attachment: fixed`) so it
 *   renders reliably on iOS Safari / mobile browsers where the native
 *   fixed-attachment trick is unreliable.
 * - Sits behind all page content (`-z-10`) and never intercepts clicks.
 * - Layered with soft brand-tinted gradients + a subtle vignette so text
 *   and cards placed on top stay comfortably legible while the sculpted
 *   curves of the source image still read through, giving the site a
 *   premium, editorial feel instead of a flat color.
 */
export default function SiteBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none select-none overflow-hidden bg-[#FFF7F5] dark:bg-[#0b0f19]"
    >
      {/* Base photographic layer */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80 dark:opacity-[0.14] transition-opacity duration-500"
        style={{ backgroundImage: `url(${bgImage})` }}
      />

      {/* Warm brand-tinted wash to unify the image with the site palette */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFF7F5]/35 via-[#FFF1EF]/25 to-[#FFF7F5]/55 dark:from-[#0b0f19]/55 dark:via-[#0b0f19]/65 dark:to-[#0b0f19]/90" />

      {/* Soft radial glow, top-right, for a premium studio-light accent */}
      <div className="absolute -top-1/4 -right-1/4 w-[70vw] h-[70vw] rounded-full bg-[radial-gradient(circle,rgba(255,45,45,0.10),transparent_65%)] dark:bg-[radial-gradient(circle,rgba(255,45,45,0.08),transparent_65%)]" />

      {/* Vignette to keep edges (and long-scroll content) legible */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(255,247,245,0.35)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_30%,rgba(11,15,25,0.55)_100%)]" />
    </div>
  );
}
