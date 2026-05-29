/* Tweaks panel — palette flavor + HUD intensity controls */
const TARANG_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "blue",
  "scanlines": 0.35,
  "glowText": true
}/*EDITMODE-END*/;

const PALETTES = [
  { id: 'blue',  label: 'Holo Blue' },
  { id: 'green', label: 'Terminal Green' },
  { id: 'neon',  label: 'Neon Cyberpunk' },
  { id: 'amber', label: 'Amber Retro' },
];

function TarangTweaks() {
  const [t, setTweak] = useTweaks(TARANG_TWEAK_DEFAULTS);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-palette', t.palette);
  }, [t.palette]);

  React.useEffect(() => {
    document.documentElement.style.setProperty('--scan-op', String(t.scanlines));
  }, [t.scanlines]);

  React.useEffect(() => {
    document.body.style.setProperty('text-shadow', t.glowText ? '' : 'none');
  }, [t.glowText]);

  return (
    <TweaksPanel>
      <TweakSection label="Interface Palette" />
      <TweakRadio
        label="Flavor"
        value={t.palette}
        options={PALETTES.map((p) => p.label)}
        onChange={(label) => {
          const found = PALETTES.find((p) => p.label === label);
          if (found) setTweak('palette', found.id);
        }}
      />
      <TweakSection label="HUD Effects" />
      <TweakSlider label="Scanlines" value={t.scanlines} min={0} max={0.7} step={0.05}
                   onChange={(v) => setTweak('scanlines', v)} />
      <TweakButton label="Replay boot sequence" onClick={() => {
        sessionStorage.removeItem('booted');
        location.reload();
      }} />
    </TweaksPanel>
  );
}

(function mountTarangTweaks() {
  function go() {
    const root = document.getElementById('tweaks-root');
    if (!root || !window.ReactDOM || !window.useTweaks) { setTimeout(go, 60); return; }
    ReactDOM.createRoot(root).render(<TarangTweaks />);
  }
  go();
})();
