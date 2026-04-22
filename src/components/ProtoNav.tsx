type Props = { active: '/1' | '/2' | '/3' };

export default function ProtoNav({ active }: Props) {
  return (
    <nav className="proto-nav" aria-label="prototype switcher">
      <a href="/1" className={active === '/1' ? 'active' : ''}>1</a>
      <a href="/2" className={active === '/2' ? 'active' : ''}>2</a>
      <a href="/3" className={active === '/3' ? 'active' : ''}>3</a>
    </nav>
  );
}
