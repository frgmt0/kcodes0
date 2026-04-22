type Choice = {
  num: string;
  name: string;
  tag: string;
  desc: string;
  href: string;
};

const CHOICES: Choice[] = [
  {
    num: '1',
    name: 'Atelier',
    tag: 'isometric / room',
    desc: 'A hand-built room split down the middle. Painter’s studio one side, engineer’s bench the other. Inhabit it.',
    href: '/1',
  },
  {
    num: '2',
    name: 'Descent',
    tag: 'scroll / 3d depth',
    desc: 'Scroll to fall through layered worlds. Clouds, ink, blueprint, circuit, then the room at the bottom.',
    href: '/2',
  },
  {
    num: '3',
    name: 'Workshop',
    tag: 'top-down / dual lens',
    desc: 'A bench seen from above. Same scene, two lenses: blueprint or watercolor. Press space to flip.',
    href: '/3',
  },
];

export default function Chooser() {
  return (
    <div className="chooser">
      <header className="chooser-head">
        <span className="mark">kona</span>
        <span className="meta">three prototypes · pick one</span>
      </header>

      <main className="chooser-body">
        {CHOICES.map((c) => (
          <a key={c.num} className="choice" href={c.href}>
            <span className="tag">{c.tag}</span>
            <h2 className="num">{c.num}</h2>
            <div className="name">{c.name}</div>
            <p className="desc">{c.desc}</p>
            <span className="arrow">enter <span aria-hidden>→</span></span>
          </a>
        ))}
      </main>

      <footer className="chooser-foot">
        <span>scratchpad · not final</span>
        <span>v0 · {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
