/* Tweaks island — applies live design controls to the vanilla site
   via CSS custom properties + a root class, persisted by useTweaks. */
const GC_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#A78BFA",
  "headlineFont": "Space Grotesk",
  "motion": true,
  "bgDark": 7
}/*EDITMODE-END*/;

function applyTweaks(t) {
  const root = document.documentElement;
  root.style.setProperty('--accent', t.accent);
  root.style.setProperty('--font-display', `'${t.headlineFont}', system-ui, sans-serif`);
  root.style.setProperty('--bg-l', t.bgDark + '%');
  root.classList.toggle('motion-off', !t.motion);
  // on-accent text: keep dark for light accents, light for deep ones
  window.dispatchEvent(new Event('tweakschange'));
}

function GCTweaks() {
  const [t, setTweak] = useTweaks(GC_DEFAULTS);

  React.useEffect(() => { applyTweaks(t); }, [t]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Accent" />
      <TweakColor
        label="Accent color"
        value={t.accent}
        options={['#A78BFA', '#38BDF8', '#2DD4BF', '#FB7185']}
        onChange={(v) => setTweak('accent', v)}
      />
      <TweakSection label="Type" />
      <TweakSelect
        label="Headline font"
        value={t.headlineFont}
        options={['Space Grotesk', 'Sora', 'Bricolage Grotesque', 'Familjen Grotesk']}
        onChange={(v) => setTweak('headlineFont', v)}
      />
      <TweakSection label="Atmosphere" />
      <TweakToggle
        label="Cinematic motion"
        value={t.motion}
        onChange={(v) => setTweak('motion', v)}
      />
      <TweakSlider
        label="Background darkness"
        value={t.bgDark}
        min={4} max={13} step={1} unit="%"
        onChange={(v) => setTweak('bgDark', v)}
      />
    </TweaksPanel>
  );
}

// Apply persisted values immediately on first paint (before React mounts),
// so there's no flash of defaults.
(function preApply() {
  try {
    const saved = JSON.parse(localStorage.getItem('tweaks') || 'null');
    if (saved) applyTweaks(Object.assign({}, GC_DEFAULTS, saved));
  } catch (e) {}
})();

ReactDOM.createRoot(document.getElementById('tweaks-root')).render(<GCTweaks />);
